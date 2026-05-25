export function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    rut: user.rut,
    telefono: user.telefono,
    email: user.email,
    fecha_nacimiento: user.fecha_nacimiento,
    peso_kg: user.peso_kg,
    estatura_cm: user.estatura_cm,
    historial_medico: user.historial_medico,
    role: user.role
  };
}
