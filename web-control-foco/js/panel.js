let cache_devs = {};

// Ripple: track click position for CSS radial highlight on btn-toggle
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn-toggle');
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  btn.style.setProperty('--rx', ((e.clientX - r.left) / r.width  * 100) + '%');
  btn.style.setProperty('--ry', ((e.clientY - r.top)  / r.height * 100) + '%');
});

auth.onAuthStateChanged(usuario => {
  if (!usuario) { window.location.href = 'index.html'; return; }
  document.getElementById('email-usuario').textContent = usuario.email;
  escucharDispositivos();
});

// ---- NAVEGACION ----
function mostrarSeccion(nombre) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.add('oculto'));
  document.getElementById('sec-' + nombre).classList.remove('oculto');
  document.querySelectorAll('.nav-link[id^="lnk-"]').forEach(l => l.classList.remove('activo'));
  const lnk = document.getElementById('lnk-' + nombre);
  if (lnk) lnk.classList.add('activo');
}

function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('nav-abierto');
  document.getElementById('hamburger').classList.toggle('activo');
}

function cerrarMenu() {
  document.getElementById('nav-links').classList.remove('nav-abierto');
  document.getElementById('hamburger').classList.remove('activo');
}

document.addEventListener('click', e => {
  const links = document.getElementById('nav-links');
  const ham   = document.getElementById('hamburger');
  if (links && links.classList.contains('nav-abierto') &&
      !links.contains(e.target) && !ham.contains(e.target)) {
    cerrarMenu();
  }
});

function cerrarSesion() {
  apagarNova();
  db.ref('/dispositivos').off();
  auth.signOut().then(() => { window.location.href = 'index.html'; });
}

// ---- SVG FOCO ----
const SVG_FOCO = `
  <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="38" rx="36" ry="36" class="foco-brillo"/>
    <path d="M40 6 C22 6 8 20 8 38 C8 53 17 65 28 71 L28 82 L52 82 L52 71 C63 65 72 53 72 38 C72 20 58 6 40 6 Z" class="foco-bola"/>
    <path d="M35 70 L35 60 Q40 54 45 60 L45 70" class="foco-filamento"/>
    <rect x="28" y="82" width="24" height="6" rx="2" class="foco-base"/>
    <rect x="30" y="88" width="20" height="6" rx="2" class="foco-base"/>
    <rect x="32" y="94" width="16" height="5" rx="2" class="foco-base"/>
  </svg>`;

// ---- FIREBASE ----
function escucharDispositivos() {
  db.ref('/dispositivos').on('value', snap => {
    const datos = snap.val();
    actualizarGrid(datos);
    actualizarLista(datos);
    actualizarContador(datos);
  });
}

function actualizarContador(datos) {
  const el = document.getElementById('sec-contador');
  if (!el) return;
  if (!datos) { el.textContent = '0 activos'; return; }
  const total   = Object.keys(datos).length;
  const activos = Object.values(datos).filter(d => d.estado === true).length;
  el.textContent = `${activos} de ${total} activo${activos !== 1 ? 's' : ''}`;
}

// ---- GRID ----
function actualizarGrid(datos) {
  const grid   = document.getElementById('dispositivos-grid');
  const sinDiv = document.getElementById('sin-dispositivos');

  if (!datos) {
    grid.querySelectorAll('.dis-card').forEach(c => c.remove());
    sinDiv.classList.remove('oculto');
    cache_devs = {};
    return;
  }
  sinDiv.classList.add('oculto');

  Object.keys(cache_devs).forEach(id => {
    if (!datos[id]) {
      const card = document.getElementById('card-' + id);
      if (card) card.remove();
      delete cache_devs[id];
    }
  });

  Object.keys(datos).forEach(id => {
    const dev  = datos[id];
    const prev = cache_devs[id];
    if (!document.getElementById('card-' + id)) {
      grid.appendChild(crearCard(id, dev));
    } else if (prev && prev.estado !== dev.estado) {
      actualizarCard(id, dev.estado);
    }
    cache_devs[id] = Object.assign({}, dev);
  });
}

function crearCard(id, dev) {
  const nombre    = dev.nombre    || id;
  const ubicacion = dev.ubicacion || '-';
  const tipo      = dev.tipo      || 'Dispositivo';

  const div = document.createElement('div');
  div.id        = 'card-' + id;
  div.className = 'tarjeta dis-card' + (dev.estado ? ' encendido' : '');
  div.innerHTML = `
    <div class="dis-header">
      <span class="dis-tipo-chip">${tipo}</span>
      <span class="dis-id">#${id}</span>
    </div>
    <h3 class="dis-nombre">${nombre}</h3>
    <p class="dis-ubic">${ubicacion}</p>
    <div class="foco-contenedor${dev.estado ? ' foco-on' : ''}" id="foco-${id}">
      ${SVG_FOCO}
    </div>
    <div class="estado-badge ${dev.estado ? 'badge-on' : 'badge-off'}" id="badge-${id}">
      <span id="texto-${id}">${dev.estado ? 'ENCENDIDO' : 'APAGADO'}</span>
    </div>
    <button id="btn-${id}"
      class="btn-toggle ${dev.estado ? 'btn-apagar-mode' : 'btn-encender-mode'}"
      onclick="cambiarEstadoDispositivo('${id}')">
      ${dev.estado ? 'APAGAR' : 'ENCENDER'}
    </button>`;
  return div;
}

function actualizarCard(id, estado) {
  const card  = document.getElementById('card-' + id);
  const foco  = document.getElementById('foco-' + id);
  const badge = document.getElementById('badge-' + id);
  const texto = document.getElementById('texto-' + id);
  const btn   = document.getElementById('btn-' + id);
  if (!card) return;

  if (estado) {
    card.classList.add('encendido');
    foco.classList.add('foco-on');
    foco.classList.remove('flash'); void foco.offsetWidth;
    foco.classList.add('flash');
    setTimeout(() => foco.classList.remove('flash'), 650);
    badge.className   = 'estado-badge badge-on';
    texto.textContent = 'ENCENDIDO';
    btn.textContent   = 'APAGAR';
    btn.className     = 'btn-toggle btn-apagar-mode';
  } else {
    card.classList.remove('encendido');
    foco.classList.remove('foco-on');
    badge.className   = 'estado-badge badge-off';
    texto.textContent = 'APAGADO';
    btn.textContent   = 'ENCENDER';
    btn.className     = 'btn-toggle btn-encender-mode';
  }
}

function cambiarEstadoDispositivo(idDispositivo) {
  const rutaEstado = db.ref('/dispositivos/' + idDispositivo + '/estado');
  rutaEstado.once('value', function(instantanea) {
    const estadoActual = instantanea.val();
    const nuevoEstado  = !estadoActual;
    rutaEstado.set(nuevoEstado).catch(function() {
      msgDis('Error al cambiar estado. Verifica las reglas de Firebase.', 'error');
    });
  });
}

// ---- LISTA ADMIN ----
function actualizarLista(datos) {
  const lista = document.getElementById('lista-dispositivos');
  lista.innerHTML = '';
  if (!datos) { lista.innerHTML = '<p class="lista-vacia">Sin dispositivos aun.</p>'; return; }
  Object.keys(datos).forEach(id => {
    const dev  = datos[id];
    const fila = document.createElement('div');
    fila.className = 'lista-item';
    fila.innerHTML = `
      <div class="lista-info">
        <strong>${dev.nombre || id}</strong>
        <span class="lista-meta">${dev.tipo || 'Dispositivo'} &bull; ${dev.ubicacion || '-'} &bull; <code>${id}</code></span>
      </div>
      <button class="btn-eliminar" onclick="eliminarDispositivo('${id}')">Eliminar</button>`;
    lista.appendChild(fila);
  });
}

function agregarDispositivo() {
  const nombre    = document.getElementById('d-nombre').value.trim();
  const id_raw    = document.getElementById('d-id').value.trim();
  const ubicacion = document.getElementById('d-ubicacion').value.trim();
  const tipo      = document.getElementById('d-tipo').value;
  const id        = id_raw.replace(/\s+/g, '_').toLowerCase();

  if (!nombre || !id || !ubicacion) { msgDis('Completa todos los campos.', 'error'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(id)) { msgDis('ID solo puede tener letras, numeros y guion bajo.', 'error'); return; }

  db.ref('/dispositivos/' + id).set({ nombre, ubicacion, tipo, estado: false })
    .then(() => {
      msgDis('Dispositivo agregado correctamente.', 'exito');
      document.getElementById('d-nombre').value    = '';
      document.getElementById('d-id').value        = '';
      document.getElementById('d-ubicacion').value = '';
    })
    .catch(() => msgDis('Error al guardar. Verifica reglas de Firebase.', 'error'));
}

function eliminarDispositivo(id) {
  if (!confirm('Eliminar dispositivo "' + id + '"?')) return;
  db.ref('/dispositivos/' + id).remove();
}

function msgDis(texto, tipo) {
  const msg = document.getElementById('msg-dispositivo');
  msg.textContent = texto;
  msg.className   = 'mensaje ' + tipo;
  setTimeout(() => { msg.className = 'mensaje oculto'; }, 3500);
}

// ================================================================
// PROCESAMIENTO DE COMANDOS
// ================================================================
let _ultimoTextoVoz = '';
let _tiempoUltimoVoz = 0;

function procesarComandoVoz(texto) {
  const ahora = Date.now();
  if (texto === _ultimoTextoVoz && ahora - _tiempoUltimoVoz < 3000) return;
  _ultimoTextoVoz = texto;
  _tiempoUltimoVoz = ahora;
  const palabras = texto.split(/\s+/);

  // Comando especial: TODOS los dispositivos
  if (/todo|todos/.test(texto)) {
    const encender = /encend|prend|activ|pon/.test(texto) || palabras.includes('on');
    const apagar   = /apag|desactiv|quita/.test(texto)    || palabras.includes('off');
    if (!encender && !apagar) {
      mostrarFeedbackVoz('Di "todo on" o "todo off".', 'info');
      return;
    }
    const ids = Object.keys(cache_devs);
    if (!ids.length) { mostrarFeedbackVoz('Sin dispositivos registrados.', 'info'); return; }
    ids.forEach(id => db.ref('/dispositivos/' + id + '/estado').set(!!encender));
    mostrarFeedbackVoz(encender ? 'Encendiendo todo...' : 'Apagando todo...', 'exito');
    hablar(encender ? 'Encendiendo todo' : 'Apagando todo');
    return;
  }

  // Detectar accion individual
  let accion = null;
  if (/encend|prend|activ|pon|ilumina/.test(texto) || palabras.includes('on'))  accion = 'encender';
  else if (/apag|desactiv|quita/.test(texto)        || palabras.includes('off')) accion = 'apagar';

  if (!accion) {
    mostrarFeedbackVoz('Di encender/on o apagar/off + nombre.', 'info');
    return;
  }

  // Buscar dispositivo por nombre (coincidencia mas larga gana)
  let idEncontrado = null;
  let mejorPuntaje = 0;

  Object.keys(cache_devs).forEach(id => {
    const nombre = (cache_devs[id].nombre || id).toLowerCase();
    const coincide = texto.includes(nombre) ||
      nombre.split(' ').some(p => p.length > 2 && texto.includes(p));
    if (coincide && nombre.length > mejorPuntaje) {
      mejorPuntaje = nombre.length;
      idEncontrado = id;
    }
  });

  // Fallback: buscar por ID
  if (!idEncontrado) {
    Object.keys(cache_devs).forEach(id => {
      if (texto.includes(id.toLowerCase())) idEncontrado = id;
    });
  }

  if (!idEncontrado) {
    mostrarFeedbackVoz('Dispositivo no reconocido.', 'error');
    hablar('Dispositivo no encontrado');
    return;
  }

  const dev            = cache_devs[idEncontrado];
  const nombre         = dev.nombre || idEncontrado;
  const quiereEncender = (accion === 'encender');

  if (quiereEncender === dev.estado) {
    mostrarFeedbackVoz(nombre + ' ya esta ' + (dev.estado ? 'encendido' : 'apagado') + '.', 'info');
    hablar(nombre + ' ya esta ' + (dev.estado ? 'encendido' : 'apagado'));
    return;
  }

  cambiarEstadoDispositivo(idEncontrado);

  // Flash azul en la tarjeta al responder por voz
  const card = document.getElementById('card-' + idEncontrado);
  if (card) {
    card.classList.remove('voz-flash'); void card.offsetWidth;
    card.classList.add('voz-flash');
    setTimeout(() => card.classList.remove('voz-flash'), 900);
  }

  mostrarFeedbackVoz((quiereEncender ? '▶ ' : '■ ') + nombre + (quiereEncender ? ' — ON' : ' — OFF'), 'exito');
  hablar(nombre + (quiereEncender ? ' encendido' : ' apagado'));
}

function mostrarFeedbackVoz(texto, tipo) {
  const el = document.getElementById('voz-feedback');
  if (!el) return;
  el.textContent = texto;
  el.className   = 'voz-feedback voz-' + tipo;
  clearTimeout(el._timer);
  if (tipo !== 'escuchando' && tipo !== 'espera') {
    el._timer = setTimeout(() => {
      if (estadoNova === 'ESPERA_WAKE') {
        el.textContent = 'Di "Nova" para activar';
        el.className   = 'voz-feedback voz-espera';
      } else {
        el.className = 'voz-feedback oculto';
      }
    }, 3000);
  }
}

// Sintesis de voz: la app responde en espanol
function hablar(texto) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(texto);
  utt.lang   = 'es-ES';
  utt.rate   = 1.05;
  utt.pitch  = 1.1;
  utt.volume = 1.0;
  speechSynthesis.speak(utt);
}

// ================================================================
// ASISTENTE NOVA — WAKE WORD + MANOS LIBRES
//
// Di "Nova" para activar. Luego di el comando.
// Si el comando viene en la misma frase se ejecuta de inmediato.
// En resultados intermedios, si detecta accion + dispositivo
// dispara antes de que el reconocedor finalice (menos delay).
// ================================================================
const NOVA_ALIASES = [
  'nova',
  'yarwis', 'jarvis', 'yarvis', 'yarwiz', 'yarbis', 'garvis'
];

let reconNova   = null;
let estadoNova  = 'INACTIVO'; // INACTIVO | ESPERA_WAKE | ESPERA_COMANDO
let timerComando = null;
let yaEjecuto    = false;

function toggleNova() {
  if (estadoNova !== 'INACTIVO') apagarNova();
  else                           encenderNova();
}

function encenderNova() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { mostrarFeedbackVoz('Navegador sin soporte de voz.', 'error'); return; }
  estadoNova = 'ESPERA_WAKE';
  setEstiloNova('espera');
  mostrarFeedbackVoz('Di "Nova" para activar', 'espera');
  iniciarReconocimientoNova();
}

function apagarNova() {
  estadoNova = 'INACTIVO';
  clearTimeout(timerComando);
  setEstiloNova('inactivo');
  mostrarFeedbackVoz('Nova desactivada.', 'info');
  if (reconNova) {
    try { reconNova.stop(); } catch (e) {}
    reconNova = null;
  }
}

function iniciarReconocimientoNova() {
  if (estadoNova === 'INACTIVO') return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  reconNova = new SR();
  reconNova.lang            = 'es-ES';
  reconNova.continuous      = true;
  reconNova.interimResults  = true;
  reconNova.maxAlternatives = 3;

  reconNova.onresult = manejarResultadoNova;
  reconNova.onerror  = function(e) {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
  };
  reconNova.onend = function() {
    if (estadoNova !== 'INACTIVO') setTimeout(iniciarReconocimientoNova, 350);
  };
  try { reconNova.start(); } catch (e) {}
}

function manejarResultadoNova(evento) {
  for (let i = evento.resultIndex; i < evento.results.length; i++) {
    const resultado = evento.results[i];

    // Juntar alternativas para mayor tolerancia
    let textoTotal = '';
    for (let j = 0; j < resultado.length; j++) {
      textoTotal += ' ' + resultado[j].transcript.toLowerCase();
    }

    // --- FASE 1: esperando wake word ---
    if (estadoNova === 'ESPERA_WAKE') {
      const wakeAlias = NOVA_ALIASES.find(a => textoTotal.includes(a));
      if (!wakeAlias) continue;

      const pos         = textoTotal.indexOf(wakeAlias);
      const despuesWake = textoTotal.substring(pos + wakeAlias.length).trim();
      const palabrasDW  = despuesWake.split(/\s+/);
      const tieneAccion = /encend|prend|activ|pon|apag|desactiv|quita|todo/.test(despuesWake) ||
                          palabrasDW.includes('on') || palabrasDW.includes('off');

      estadoNova = 'ESPERA_COMANDO';
      yaEjecuto  = false;
      setEstiloNova('escuchando');
      clearTimeout(timerComando);

      if (tieneAccion && despuesWake.length > 2) {
        // Comando en la misma frase — ejecutar directo, sin "Te escucho"
        yaEjecuto = true;
        procesarComandoVoz(despuesWake);
        setTimeout(volverAEsperaWake, 2400);
      } else {
        hablar('Te escucho');
        mostrarFeedbackVoz('Te escucho...', 'escuchando');
        timerComando = setTimeout(volverAEsperaWake, 5000);
      }

    // --- FASE 2: esperando comando ---
    } else if (estadoNova === 'ESPERA_COMANDO' && !yaEjecuto) {
      const textoCheck = resultado[0].transcript.toLowerCase().trim();
      const palabras   = textoCheck.split(/\s+/);

      if (NOVA_ALIASES.some(a => textoCheck === a)) continue;

      const tieneAccion = /encend|prend|activ|pon|apag|desactiv|quita|todo/.test(textoCheck) ||
                          palabras.includes('on') || palabras.includes('off');
      const tieneDevice = /todo|todos/.test(textoCheck) ||
                          Object.keys(cache_devs).some(id => {
                            const n = (cache_devs[id].nombre || id).toLowerCase();
                            return textoCheck.includes(n) ||
                                   n.split(' ').some(p => p.length > 2 && textoCheck.includes(p));
                          });

      if (resultado.isFinal) {
        clearTimeout(timerComando);
        yaEjecuto = true;
        procesarComandoVoz(textoCheck);
        setTimeout(volverAEsperaWake, 2400);
      } else if (tieneAccion && tieneDevice) {
        clearTimeout(timerComando);
        yaEjecuto = true;
        procesarComandoVoz(textoCheck);
        setTimeout(volverAEsperaWake, 2400);
      }
    }
  }
}

function volverAEsperaWake() {
  if (estadoNova === 'INACTIVO') return;
  estadoNova = 'ESPERA_WAKE';
  yaEjecuto  = false;
  setEstiloNova('espera');
  setTimeout(() => {
    if (estadoNova === 'ESPERA_WAKE')
      mostrarFeedbackVoz('Di "Nova" para activar', 'espera');
  }, 1600);
}

function setEstiloNova(estado) {
  const btn  = document.getElementById('btn-nova');
  const dot  = document.getElementById('nova-dot');
  const bars = document.getElementById('nova-bars');
  if (btn)  btn.className  = 'btn-nova nova-' + estado;
  if (dot)  dot.className  = 'nova-dot dot-' + estado;
  if (bars) bars.className = 'nova-bars' + (estado === 'escuchando' ? ' bars-activo' : '');
}

// ── NOVA ORB — ARRASTRABLE CON SNAP A ESQUINA ──
(function initNovaDrag() {
  const wrap = document.querySelector('.voz-controles');
  const btn  = document.getElementById('btn-nova');
  if (!wrap || !btn) return;

  const MARGIN = 28;
  let dragging = false, moved = false;
  let ox = 0, oy = 0, sx = 0, sy = 0, pid = null;

  function applyCorner(onRight, onBottom, animate) {
    if (animate) {
      wrap.style.transition = 'left .35s cubic-bezier(.34,1.4,.64,1), top .35s cubic-bezier(.34,1.4,.64,1)';
      setTimeout(() => { wrap.style.transition = ''; }, 380);
    }
    wrap.style.right  = 'auto';
    wrap.style.bottom = 'auto';
    wrap.style.left   = onRight  ? (window.innerWidth  - wrap.offsetWidth  - MARGIN) + 'px'
                                 : MARGIN + 'px';
    wrap.style.top    = onBottom ? (window.innerHeight - wrap.offsetHeight - MARGIN) + 'px'
                                 : MARGIN + 'px';
    try { localStorage.setItem('nova-corner', JSON.stringify({ onRight, onBottom })); } catch(e) {}
  }

  // Posicion inicial: restaurar guardada o default esquina inferior derecha
  function initPosition() {
    wrap.style.position = 'fixed';
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
    try {
      const s = JSON.parse(localStorage.getItem('nova-corner'));
      if (s) { applyCorner(s.onRight, s.onBottom, false); return; }
    } catch(e) {}
    // default: inferior derecha
    wrap.style.left = (window.innerWidth  - wrap.offsetWidth  - MARGIN) + 'px';
    wrap.style.top  = (window.innerHeight - wrap.offsetHeight - MARGIN) + 'px';
  }

  // Esperar a que el DOM esté pintado para leer dimensiones reales
  requestAnimationFrame(initPosition);
  window.addEventListener('resize', () => {
    try {
      const s = JSON.parse(localStorage.getItem('nova-corner'));
      if (s) applyCorner(s.onRight, s.onBottom, false);
    } catch(e) { initPosition(); }
  });

  wrap.style.touchAction = 'none';

  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.voz-feedback')) return;
    pid = e.pointerId;
    dragging = true;
    moved    = false;
    wrap.setPointerCapture(pid);
    const r = wrap.getBoundingClientRect();
    wrap.style.transition = 'none';
    wrap.style.left = r.left + 'px';
    wrap.style.top  = r.top  + 'px';
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    sx = e.clientX;
    sy = e.clientY;
    wrap.style.cursor = 'grabbing';
    e.preventDefault();
  });

  wrap.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pid) return;
    const W = window.innerWidth, H = window.innerHeight;
    const r = wrap.getBoundingClientRect();
    const nx = Math.max(0, Math.min(W - r.width,  e.clientX - ox));
    const ny = Math.max(0, Math.min(H - r.height, e.clientY - oy));
    wrap.style.left = nx + 'px';
    wrap.style.top  = ny + 'px';
    if (Math.abs(e.clientX - sx) > 5 || Math.abs(e.clientY - sy) > 5) moved = true;
  });

  wrap.addEventListener('pointerup', e => {
    if (!dragging || e.pointerId !== pid) return;
    dragging = false;
    wrap.style.cursor = '';
    if (!moved) return;
    const r  = wrap.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    applyCorner(cx > window.innerWidth / 2, cy > window.innerHeight / 2, true);
  });

  // Evitar que un arrastre dispare el toggleNova
  btn.addEventListener('click', e => {
    if (moved) { e.stopImmediatePropagation(); moved = false; }
  }, true);
})();
