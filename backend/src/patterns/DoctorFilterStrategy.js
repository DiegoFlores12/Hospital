/**
 * Patrón de COMPORTAMIENTO: Strategy.
 * Permite cambiar el algoritmo de búsqueda de doctores sin alterar la ruta /api/doctors.
 * Actualmente se usa para filtrar por especialidad o devolver todos los doctores activos.
 */
class DoctorFilterStrategy {
  constructor(strategy) {
    this.strategy = strategy;
  }

  buildQuery(params = {}) {
    return this.strategy(params);
  }

  static allDoctors() {
    return {
      text: `SELECT id, nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url
            FROM staff
            WHERE tipo IN ('doctor','medico','profesional')
              AND estado <> 'inactivo'
            ORDER BY nombre ASC`,
      values: []
    };
  }

  static bySpecialty({ especialidad }) {
    return {
      text: `SELECT id, nombre, especialidad, cargo, email, telefono, estado, tipo, foto_url
            FROM staff
            WHERE tipo IN ('doctor','medico','profesional')
              AND estado <> 'inactivo'
              AND LOWER(TRIM(especialidad)) = LOWER(TRIM($1))
            ORDER BY nombre ASC`,
      values: [especialidad]
    };
  }

  static fromRequest({ especialidad }) {
    return new DoctorFilterStrategy(
      especialidad && String(especialidad).trim()
        ? DoctorFilterStrategy.bySpecialty
        : DoctorFilterStrategy.allDoctors
    );
  }
}

export { DoctorFilterStrategy };
