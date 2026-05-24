CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120),
    rut VARCHAR(30) UNIQUE NOT NULL,
    telefono VARCHAR(40),
    email VARCHAR(160) UNIQUE,
    fecha_nacimiento DATE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('paciente', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    especialidad VARCHAR(120),
    cargo VARCHAR(120),
    email VARCHAR(160),
    telefono VARCHAR(40),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    tipo VARCHAR(30) NOT NULL DEFAULT 'doctor',
    foto_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_schedules (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    inicio TIME NOT NULL,
    fin TIME NOT NULL,
    ubicacion VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (doctor_id, slot_date, slot_time)
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'confirmada',
    modalidad VARCHAR(60),
    ubicacion VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exams (
    id BIGSERIAL PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(160) NOT NULL,
    fecha DATE NOT NULL,
    estado VARCHAR(40) NOT NULL DEFAULT 'En revisión',
    archivo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Compatibilidad si ya creaste la tabla antes de esta versión.
ALTER TABLE users ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) NOT NULL DEFAULT 'doctor';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS foto_url TEXT;

CREATE TABLE IF NOT EXISTS hiring_requests (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    especialidad VARCHAR(120) NOT NULL,
    email VARCHAR(160),
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('contratar', 'rechazar', 'pendiente')),
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO staff (nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url)
SELECT * FROM (VALUES
('Dr. Roberto Silva', 'Cardiología', 'Cardiólogo', 'roberto@hospital.test', '+56 9 1111 1111', 'activo', 'doctor', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80'),
('Dra. Elena Ramos', 'Pediatría', 'Pediatra', 'elena@hospital.test', '+56 9 2222 2222', 'activo', 'doctor', 'https://images.unsplash.com/photo-1594824436998-058b231b14c2?auto=format&fit=crop&w=150&q=80'),
('Dr. Marcos Vega', 'Neurología', 'Neurólogo', 'marcos@hospital.test', '+56 9 3333 3333', 'activo', 'doctor', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80'),
('Dra. Sofía Castro', 'Traumatología', 'Traumatóloga', 'sofia@hospital.test', '+56 9 4444 4444', 'activo', 'doctor', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80')
) AS seed(nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url)
WHERE NOT EXISTS (SELECT 1 FROM staff existing WHERE existing.email = seed.email);

INSERT INTO availability_slots (doctor_id, slot_date, slot_time)
SELECT s.id, d::date, t::time
FROM staff s
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day') d
CROSS JOIN (VALUES ('09:00'), ('10:30'), ('11:15'), ('14:00'), ('16:30')) AS hours(t)
WHERE s.tipo = 'doctor'
ON CONFLICT DO NOTHING;
