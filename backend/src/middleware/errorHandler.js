export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.code === '23505') return res.status(409).json({ error: 'Registro duplicado. El RUT o correo ya existe.' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referencia inválida. Revisa el trabajador o usuario seleccionado.' });
  if (err.code === '23502') return res.status(400).json({ error: `Falta un dato obligatorio en base de datos: ${err.column || 'campo requerido'}` });
  if (err.code === '22P02') return res.status(400).json({ error: 'Formato inválido en uno de los datos enviados.' });
  if (err.code === '42703') return res.status(500).json({ error: 'La base de datos no está actualizada. Ejecuta backend/db/schema.sql en Neon.' });
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });

  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(500).json({ error: isDevelopment ? err.message : 'Error interno del servidor' });
}
