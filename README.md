# Hospital

Este repositorio es un trabajo para Patrones de diseño, su fin principal es crear una paguina web funcional utilizando 3 patrones distintos para Estructura, comportamiento y creacional, el proyecto tiene varios lenguajes, los cuales son: Frontend(HTML, CSS, JavaScript), Backend (JavaScript, node, Express), ademas cuenta con una base de datos subida en la nube llamada Neon, la estrutura del proyecto esta formado de esta forma:

# Estructura

Frontend-Hospital-main/
├─ index.html
├─ login.html
├─ registro.html
├─ css/
│  └─ style.css
├─ js/
│  └─ script.js
├─ paciente/
│  ├─ panel.html
│  ├─ agendar.html
│  ├─ mis-citas.html
│  ├─ mis-examenes.html
│  └─ perfil.html
├─ admin/
│  ├─ panel.html
│  ├─ personal.html
│  ├─ horarios.html
│  └─ contratacion.html
├─ doctor/
│  ├─ panel-doc.html
│  └─ mis-pacientes.html
└─ backend/
   ├─ server.js
   ├─ package.json
   ├─ .env.example
   └─ db/schema.sql

los patrones utilisados son:
# Patrones

para el Patrón Creacional: Singleton

para el Patrón Estructural: Facade

para el Patrón de Comportamiento: Strategy

# Como iniciarlo

la manera de iniciarlo es simple:
1.- cd backend  //nos dirigimos a la carpeta "backend" dentro del proyecto
2.- npm install  //instalamos las dependencias necesarias
3.- npm run dev  //iniciamos el backend
