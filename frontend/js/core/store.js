const SESSION_KEY = 'hospital_session';

export const Store = {
  get session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  },

  set session(value) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  },

  clear() {
    localStorage.removeItem(SESSION_KEY);
  },

  loginUrl() {
    const protectedArea = ['/admin/', '/paciente/', '/doctor/'].some(segment => location.pathname.includes(segment));
    return protectedArea ? '../login.html' : 'login.html';
  },

  requireRole(role) {
    const session = this.session;
    if (!session?.token || session?.user?.role !== role) {
      this.clear();
      location.href = this.loginUrl();
      return null;
    }
    return session;
  }
};
