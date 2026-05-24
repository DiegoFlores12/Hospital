import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseSingleton } from './src/patterns/DatabaseSingleton.js';
import { DoctorFilterStrategy } from './src/patterns/DoctorFilterStrategy.js';
import { AppointmentFacade } from './src/patterns/AppointmentFacade.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const pool = DatabaseSingleton.getInstance();
const appointmentFacade = new AppointmentFacade(pool);

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    rut: user.rut,
    telefono: user.telefono,
    email: user.email,
    role: user.role
  };
}

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) return res.status(403).json({ error: 'Rol no autorizado' });
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'hospital-api' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { nombre, apellido, rut, telefono, email, password, fecha_nacimiento } = req.body;
    if ([nombre, apellido, rut, password].some(isBlank)) {
      return res.status(400).json({ error: 'Nombre, apellido, RUT y contraseña son obligatorios' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (nombre, apellido, rut, telefono, email, fecha_nacimiento, password_hash, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'paciente')
      RETURNING id, nombre, apellido, rut, telefono, email, role`,
      [nombre.trim(), apellido.trim(), rut.trim(), telefono || null, email || null, fecha_nacimiento || null, hash]
    );
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'El RUT o correo ya está registrado' });
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { rut, password, role } = req.body;
    if ([rut, password, role].some(isBlank)) return res.status(400).json({ error: 'RUT, contraseña y rol son obligatorios' });
    const { rows } = await pool.query('SELECT * FROM users WHERE rut = $1 AND role = $2 LIMIT 1', [rut.trim(), role]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    const safeUser = publicUser(user);
    res.json({ token: tokenFor(safeUser), user: safeUser });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', auth(), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, apellido, rut, telefono, email, role FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({ user: rows[0] });
  } catch (error) { next(error); }
});

app.get('/api/doctors', async (req, res, next) => {
  try {
    // Strategy: cambia el algoritmo de búsqueda según venga o no la especialidad.
    const strategy = DoctorFilterStrategy.fromRequest({ especialidad: req.query.especialidad });
    const query = strategy.buildQuery({ especialidad: req.query.especialidad });
    const { rows } = await pool.query(query.text, query.values);
    res.json(rows);
  } catch (error) { next(error); }
});

app.get('/api/availability', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ error: 'doctorId y date son requeridos' });
    const { rows } = await pool.query(
      `SELECT to_char(slot_time, 'HH24:MI') AS hora
      FROM availability_slots
      WHERE doctor_id = $1 AND slot_date = $2 AND is_booked = false
      ORDER BY slot_time ASC`,
      [doctorId, date]
    );
    res.json(rows.map(r => r.hora));
  } catch (error) { next(error); }
});

app.get('/api/appointments/my', auth('paciente'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, to_char(a.fecha, 'YYYY-MM-DD') AS fecha, to_char(a.hora, 'HH24:MI') AS hora, a.estado, a.modalidad, a.ubicacion,
              s.nombre AS doctor_nombre, s.especialidad
      FROM appointments a
      JOIN staff s ON s.id = a.doctor_id
      WHERE a.patient_id = $1
      ORDER BY a.fecha ASC, a.hora ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/appointments', auth('paciente'), async (req, res, next) => {
  try {
    const { doctorId, fecha, hora } = req.body;
    if ([doctorId, fecha, hora].some(isBlank)) return res.status(400).json({ error: 'doctorId, fecha y hora son requeridos' });

    // Facade: una sola llamada coordina disponibilidad + reserva + transacción.
    const appointment = await appointmentFacade.scheduleAppointment({
      patientId: req.user.id,
      doctorId,
      fecha,
      hora
    });

    res.status(201).json({ appointment });
  } catch (error) { next(error); }
});

app.get('/api/exams/my', auth('paciente'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, to_char(fecha, 'YYYY-MM-DD') AS fecha, estado, archivo_url
      FROM exams WHERE patient_id = $1 ORDER BY fecha DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

app.get('/api/admin/staff', auth('admin'), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url,
              to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
      FROM staff
      ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/admin/staff', auth('admin'), async (req, res, next) => {
  try {
    const { id, nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url } = req.body;
    if (isBlank(nombre)) return res.status(400).json({ error: 'El nombre del trabajador es obligatorio' });
    if (id) {
      const { rows } = await pool.query(
        `UPDATE staff
        SET nombre=$1, especialidad=$2, cargo=$3, email=$4, telefono=$5, estado=$6, tipo=$7, foto_url=$8, updated_at=now()
        WHERE id=$9
         RETURNING *`,
        [nombre.trim(), especialidad || null, cargo || null, email || null, telefono || null, estado || 'activo', tipo || 'doctor', foto_url || null, id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Trabajador no encontrado' });
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(
      `INSERT INTO staff (nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre.trim(), especialidad || null, cargo || null, email || null, telefono || null, estado || 'activo', tipo || 'doctor', foto_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

app.post('/api/admin/schedules', auth('admin'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { doctor_id, fecha, inicio, fin, ubicacion } = req.body;
    if ([doctor_id, fecha, inicio, fin].some(isBlank)) return res.status(400).json({ error: 'Trabajador, fecha, inicio y fin son obligatorios' });
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO work_schedules (doctor_id, fecha, inicio, fin, ubicacion)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [doctor_id, fecha, inicio, fin, ubicacion || null]
    );
    await client.query(
      `INSERT INTO availability_slots (doctor_id, slot_date, slot_time)
      SELECT $1, $2::date, gs::time
      FROM generate_series($3::time, ($4::time - interval '30 minutes'), interval '30 minutes') AS gs
      ON CONFLICT DO NOTHING`,
      [doctor_id, fecha, inicio, fin]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally { client.release(); }
});

app.post('/api/admin/hiring', auth('admin'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { nombre, especialidad, email, decision, observacion } = req.body;
    if ([nombre, especialidad, decision].some(isBlank)) return res.status(400).json({ error: 'Nombre, especialidad y decisión son obligatorios' });
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO hiring_requests (nombre, especialidad, email, decision, observacion)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombre.trim(), especialidad.trim(), email || null, decision, observacion || null]
    );
    let staff = null;
    if (decision === 'contratar') {
      const inserted = await client.query(
        `INSERT INTO staff (nombre, especialidad, cargo, email, estado, tipo)
         VALUES ($1,$2,$3,$4,'activo','doctor') RETURNING *`,
        [nombre.trim(), especialidad.trim(), especialidad.trim(), email || null]
      );
      staff = inserted.rows[0];
    }
    await client.query('COMMIT');
    res.status(201).json({ hiring: rows[0], staff });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally { client.release(); }
});

app.get('/api/admin/summary', auth('admin'), async (_req, res, next) => {
  try {
    const [personal, horarios, contratacion] = await Promise.all([
      pool.query("SELECT count(*)::int AS total FROM staff WHERE estado = 'activo'"),
      pool.query("SELECT count(*)::int AS total FROM availability_slots WHERE slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND is_booked = false"),
      pool.query("SELECT count(*)::int AS total FROM hiring_requests WHERE decision = 'pendiente'")
    ]);
    res.json({
      personal_activo: personal.rows[0].total,
      horarios_semana: horarios.rows[0].total,
      contratacion_pendiente: contratacion.rows[0].total
    });
  } catch (error) { next(error); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: 'Registro duplicado' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referencia inválida. Revisa el trabajador o usuario seleccionado.' });
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`Hospital API escuchando en http://localhost:${PORT}`));
