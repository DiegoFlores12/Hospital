import { Api } from '../core/api.js';
import { Store } from '../core/store.js';

function redirectByRole(role) {
  if (role === 'admin') return 'admin/panel.html';
  if (role === 'doctor') return 'doctor/panel-doc.html';
  return 'paciente/panel.html';
}

export function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());
      try {
        const response = await Api.login(data);
        Store.session = { token: response.token, user: response.user };
        location.href = redirectByRole(response.user.role);
      } catch (error) {
        Store.clear();
        alert(error.message);
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(registerForm).entries());
      if (data.password !== data.password_confirm) return alert('Las contraseñas no coinciden.');

      data.fecha_nacimiento = `${data.anio}-${String(Number(data.mes)).padStart(2, '0')}-${String(Number(data.dia)).padStart(2, '0')}`;
      delete data.password_confirm;
      delete data.dia;
      delete data.mes;
      delete data.anio;
      ['email', 'telefono', 'peso_kg', 'estatura_cm'].forEach(key => {
        if (!data[key] || !String(data[key]).trim()) delete data[key];
      });

      try {
        await Api.register(data);
        alert('Registro creado. Ahora puedes iniciar sesión.');
        location.href = 'login.html';
      } catch (error) {
        alert(error.message);
      }
    });
  }
}
