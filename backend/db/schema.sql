CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120),
    rut VARCHAR(30) UNIQUE NOT NULL,
    telefono VARCHAR(40),
    email VARCHAR(160) UNIQUE,
    fecha_nacimiento DATE,
    peso_kg NUMERIC(5,2),
    estatura_cm NUMERIC(5,2),
    historial_medico TEXT,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'paciente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Migraciones defensivas para bases Neon ya creadas con versiones anteriores del proyecto.
ALTER TABLE users ADD COLUMN IF NOT EXISTS apellido VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono VARCHAR(40);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(160);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'paciente';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS estatura_cm NUMERIC(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS historial_medico TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_rut_unique_idx ON users (rut);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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

ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) NOT NULL DEFAULT 'doctor';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS foto_url TEXT;

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
('Dr. Roberto Silva', 'Cardiología', 'Cardiólogo', 'roberto@hospital.test', '+56 9 1111 1111', 'activo', 'doctor', NULL),
('Dra. Elena Ramos', 'Pediatría', 'Pediatra', 'elena@hospital.test', '+56 9 2222 2222', 'activo', 'doctor', NULL),
('Dr. Marcos Vega', 'Neurología', 'Neurólogo', 'marcos@hospital.test', '+56 9 3333 3333', 'activo', 'doctor', NULL),
('Dra. Sofía Castro', 'Traumatología', 'Traumatóloga', 'sofia@hospital.test', '+56 9 4444 4444', 'activo', 'doctor', NULL)
) AS seed(nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url)
WHERE NOT EXISTS (SELECT 1 FROM staff existing WHERE existing.email = seed.email);

INSERT INTO availability_slots (doctor_id, slot_date, slot_time)
SELECT s.id, d::date, t::time
FROM staff s
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day') d
CROSS JOIN (VALUES ('09:00'), ('10:30'), ('11:15'), ('14:00'), ('16:30')) AS hours(t)
WHERE s.tipo = 'doctor'
ON CONFLICT DO NOTHING;
