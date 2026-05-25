const datosEspecialidades = [
  { titulo: 'Urgencias y Rescate', texto: 'Atención crítica inmediata 24/7. Nuestro equipo está altamente capacitado en maniobras de reanimación cardiopulmonar (RCP) y protocolos de seguridad, incluyendo el manejo avanzado de extintores.', img: 'https://images.unsplash.com/photo-1587559070757-f72a388edbba?auto=format&fit=crop&w=1200&q=80' },
  { titulo: 'Cardiología', texto: 'Monitoreo, prevención y cirugía cardiovascular con la más alta tecnología.', img: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80' },
  { titulo: 'Pediatría', texto: 'Un entorno seguro diseñado especialmente para el bienestar de los más pequeños.', img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80' },
  { titulo: 'Neurología', texto: 'Especialistas en el sistema nervioso central y periférico.', img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80' },
  { titulo: 'Traumatología', texto: 'Rehabilitación y cirugía ortopédica integral.', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80' },
  { titulo: 'Oftalmología', texto: 'Evaluaciones oftalmológicas y tratamientos para proteger tu visión.', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80' }
];

let indiceActual = 0;
let intervaloRotacion;
let timeoutPausa;
const tiempoRotacion = 4000;
const tiempoPausaClick = 10000;

function moverIndicador(elementoActivo, indicador) {
  if (!elementoActivo || !indicador) return;
  indicador.style.width = `${elementoActivo.offsetWidth}px`;
  indicador.style.left = `${elementoActivo.offsetLeft}px`;
}

function actualizarVisual(indice, tabs, indicador, elementoHover = null) {
  if (!tabs.length) return;
  const elementoActivo = elementoHover || tabs[indice];
  tabs.forEach(tab => tab.classList.remove('activo'));
  elementoActivo.classList.add('activo');
  moverIndicador(elementoActivo, indicador);

  const pod = document.getElementById('pod-imagen');
  if (pod) pod.style.backgroundImage = `url('${datosEspecialidades[indice].img}')`;

  const panelInfo = document.getElementById('info-panel');
  const titulo = document.getElementById('info-titulo');
  const texto = document.getElementById('info-texto');
  if (panelInfo && titulo && texto) {
    panelInfo.classList.remove('visible');
    setTimeout(() => {
      titulo.innerText = datosEspecialidades[indice].titulo;
      texto.innerText = datosEspecialidades[indice].texto;
      panelInfo.classList.add('visible');
    }, 150);
  }

  indiceActual = indice;
}

export function setupHome() {
  const tabs = document.querySelectorAll('.tab-item');
  const indicador = document.getElementById('indicador');
  if (!tabs.length) return;

  const iniciarAutoPlay = () => {
    clearInterval(intervaloRotacion);
    intervaloRotacion = setInterval(() => actualizarVisual((indiceActual + 1) % datosEspecialidades.length, tabs, indicador), tiempoRotacion);
  };
  const detenerAutoPlay = () => clearInterval(intervaloRotacion);

  tabs.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      detenerAutoPlay();
      clearTimeout(timeoutPausa);
      actualizarVisual(index, tabs, indicador, item);
    });
    item.addEventListener('mouseleave', iniciarAutoPlay);
    item.addEventListener('click', () => {
      detenerAutoPlay();
      actualizarVisual(index, tabs, indicador, item);
      clearTimeout(timeoutPausa);
      timeoutPausa = setTimeout(iniciarAutoPlay, tiempoPausaClick);
    });
  });

  moverIndicador(tabs[0], indicador);
  document.getElementById('info-panel')?.classList.add('visible');
  iniciarAutoPlay();
  window.addEventListener('resize', () => moverIndicador(tabs[indiceActual], indicador));
}
