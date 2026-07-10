let cache_devs = {};

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
  apagarYarwis();
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
// CONTROL POR VOZ — UN DISPARO (boton microfono)
// ================================================================
let reconocimientoVoz = null;
let escuchandoVoz     = false;

function iniciarVoz() {
  if (estadoYarwis !== 'INACTIVO') {
    mostrarFeedbackVoz('Desactiva Yarwis primero.', 'info');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { mostrarFeedbackVoz('Navegador sin soporte de voz.', 'error'); return; }
  if (escuchandoVoz) { detenerVoz(); return; }

  reconocimientoVoz                 = new SR();
  reconocimientoVoz.lang            = 'es-ES';
  reconocimientoVoz.interimResults  = false;
  reconocimientoVoz.maxAlternatives = 1;
  reconocimientoVoz.continuous      = false;

  reconocimientoVoz.onresult = function(evento) {
    const texto = evento.results[0][0].transcript.toLowerCase().trim();
    mostrarFeedbackVoz('"' + texto + '"', 'neutro');
    procesarComandoVoz(texto);
  };
  reconocimientoVoz.onerror = function() {
    mostrarFeedbackVoz('No se entendio.', 'error');
    detenerVoz();
  };
  reconocimientoVoz.onend = function() { detenerVoz(); };

  escuchandoVoz = true;
  actualizarBotonMic(true);
  mostrarFeedbackVoz('Escuchando...', 'escuchando');
  reconocimientoVoz.start();
}

function detenerVoz() {
  escuchandoVoz = false;
  actualizarBotonMic(false);
  if (reconocimientoVoz) {
    try { reconocimientoVoz.stop(); } catch (e) {}
    reconocimientoVoz = null;
  }
}

function actualizarBotonMic(activo) {
  const btn = document.getElementById('btn-mic');
  if (!btn) return;
  btn.classList.toggle('mic-activo', activo);
  btn.title = activo ? 'Detener' : 'Comando rapido de voz';
}

// ================================================================
// PROCESAMIENTO DE COMANDOS (compartido por mic y Yarwis)
//
// Comandos rapidos soportados:
//   "[nombre] on"  /  "on [nombre]"   -> encender
//   "[nombre] off" /  "off [nombre]"  -> apagar
//   "encender [nombre]" / "apagar [nombre]"
//   "todo on" / "apagar todo"
// ================================================================
function procesarComandoVoz(texto) {
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
    return;
  }

  // Detectar accion
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
    mostrarFeedbackVoz('Dispositivo no reconocido en el comando.', 'error');
    return;
  }

  const dev            = cache_devs[idEncontrado];
  const nombre         = dev.nombre || idEncontrado;
  const quiereEncender = (accion === 'encender');

  if (quiereEncender === dev.estado) {
    mostrarFeedbackVoz(nombre + ' ya esta ' + (dev.estado ? 'encendido' : 'apagado') + '.', 'info');
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
}

function mostrarFeedbackVoz(texto, tipo) {
  const el = document.getElementById('voz-feedback');
  if (!el) return;
  el.textContent = texto;
  el.className   = 'voz-feedback voz-' + tipo;
  clearTimeout(el._timer);
  if (tipo !== 'escuchando' && tipo !== 'espera') {
    el._timer = setTimeout(() => {
      if (estadoYarwis === 'ESPERA_WAKE') {
        el.textContent = 'Di "Nova" para activar';
        el.className   = 'voz-feedback voz-espera';
      } else {
        el.className = 'voz-feedback oculto';
      }
    }, 3000);
  }
}

// ================================================================
// ASISTENTE YARWIS — WAKE WORD + MANOS LIBRES
//
// Wake words: "Nova" (recomendado), "Yarwis" y aliases
// Optimizacion: si el comando viene en la misma frase que el
// wake word se procesa de inmediato sin esperar segunda frase.
// Tambien dispara en resultados intermedios cuando detecta
// accion + dispositivo, reduciendo el delay percibido.
// ================================================================
const YARWIS_ALIASES = [
  'nova',    // recomendado: corto y claro para el reconocedor
  'yarwis',
  'jarvis', 'yarvis', 'yarwiz', 'yarbis', 'garvis'
];

let reconYarwis  = null;
let estadoYarwis = 'INACTIVO'; // INACTIVO | ESPERA_WAKE | ESPERA_COMANDO
let timerComando = null;
let yaEjecuto    = false; // evita doble disparo interim + final

function toggleYarwis() {
  if (estadoYarwis !== 'INACTIVO') apagarYarwis();
  else                             encenderYarwis();
}

function encenderYarwis() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { mostrarFeedbackVoz('Navegador sin soporte de voz.', 'error'); return; }
  estadoYarwis = 'ESPERA_WAKE';
  setEstiloYarwis('espera');
  mostrarFeedbackVoz('Di "Nova" para activar', 'espera');
  iniciarReconocimientoYarwis();
}

function apagarYarwis() {
  estadoYarwis = 'INACTIVO';
  clearTimeout(timerComando);
  setEstiloYarwis('inactivo');
  mostrarFeedbackVoz('Yarwis desactivado.', 'info');
  if (reconYarwis) {
    try { reconYarwis.stop(); } catch (e) {}
    reconYarwis = null;
  }
}

function iniciarReconocimientoYarwis() {
  if (estadoYarwis === 'INACTIVO') return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  reconYarwis = new SR();
  reconYarwis.lang            = 'es-ES';
  reconYarwis.continuous      = true;
  reconYarwis.interimResults  = true;
  reconYarwis.maxAlternatives = 3;

  reconYarwis.onresult = manejarResultadoYarwis;
  reconYarwis.onerror  = function(e) {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
  };
  reconYarwis.onend = function() {
    if (estadoYarwis !== 'INACTIVO') setTimeout(iniciarReconocimientoYarwis, 350);
  };
  try { reconYarwis.start(); } catch (e) {}
}

function manejarResultadoYarwis(evento) {
  for (let i = evento.resultIndex; i < evento.results.length; i++) {
    const resultado = evento.results[i];

    // Juntar alternativas para mayor tolerancia al wake word
    let textoTotal = '';
    for (let j = 0; j < resultado.length; j++) {
      textoTotal += ' ' + resultado[j].transcript.toLowerCase();
    }

    // --- FASE 1: esperando wake word ---
    if (estadoYarwis === 'ESPERA_WAKE') {
      const wakeAlias = YARWIS_ALIASES.find(a => textoTotal.includes(a));
      if (!wakeAlias) continue;

      // Extraer texto despues del wake word (posible comando inline)
      const pos          = textoTotal.indexOf(wakeAlias);
      const despuesWake  = textoTotal.substring(pos + wakeAlias.length).trim();
      const palabrasDW   = despuesWake.split(/\s+/);
      const tieneAccionDW = /encend|prend|activ|pon|apag|desactiv|quita|todo/.test(despuesWake) ||
                            palabrasDW.includes('on') || palabrasDW.includes('off');

      estadoYarwis = 'ESPERA_COMANDO';
      yaEjecuto    = false;
      setEstiloYarwis('escuchando');
      mostrarFeedbackVoz('Te escucho...', 'escuchando');
      clearTimeout(timerComando);

      if (tieneAccionDW && despuesWake.length > 2) {
        // Comando ya viene en la misma frase — procesar de inmediato
        yaEjecuto = true;
        mostrarFeedbackVoz('"' + despuesWake + '"', 'neutro');
        procesarComandoVoz(despuesWake);
        setTimeout(volverAEsperaWake, 2200);
      } else {
        // Esperar segunda frase (5 segundos)
        timerComando = setTimeout(volverAEsperaWake, 5000);
      }

    // --- FASE 2: esperando comando ---
    } else if (estadoYarwis === 'ESPERA_COMANDO' && !yaEjecuto) {
      const textoCheck = resultado[0].transcript.toLowerCase().trim();
      const palabras   = textoCheck.split(/\s+/);

      // Ignorar si es solo el wake word repetido
      if (YARWIS_ALIASES.some(a => textoCheck === a)) continue;

      const tieneAccion = /encend|prend|activ|pon|apag|desactiv|quita|todo/.test(textoCheck) ||
                          palabras.includes('on') || palabras.includes('off');
      const tieneDevice = /todo|todos/.test(textoCheck) ||
                          Object.keys(cache_devs).some(id => {
                            const n = (cache_devs[id].nombre || id).toLowerCase();
                            return textoCheck.includes(n) ||
                                   n.split(' ').some(p => p.length > 2 && textoCheck.includes(p));
                          });

      if (resultado.isFinal) {
        // Resultado final: procesar siempre
        clearTimeout(timerComando);
        yaEjecuto = true;
        mostrarFeedbackVoz('"' + textoCheck + '"', 'neutro');
        procesarComandoVoz(textoCheck);
        setTimeout(volverAEsperaWake, 2200);

      } else if (tieneAccion && tieneDevice) {
        // Resultado intermedio con accion + dispositivo = procesar ya (menos delay)
        clearTimeout(timerComando);
        yaEjecuto = true;
        mostrarFeedbackVoz('"' + textoCheck + '"', 'neutro');
        procesarComandoVoz(textoCheck);
        setTimeout(volverAEsperaWake, 2200);
      }
    }
  }
}

function volverAEsperaWake() {
  if (estadoYarwis === 'INACTIVO') return;
  estadoYarwis = 'ESPERA_WAKE';
  yaEjecuto    = false;
  setEstiloYarwis('espera');
  setTimeout(() => {
    if (estadoYarwis === 'ESPERA_WAKE')
      mostrarFeedbackVoz('Di "Nova" para activar', 'espera');
  }, 1600);
}

function setEstiloYarwis(estado) {
  const btn  = document.getElementById('btn-yarwis');
  const dot  = document.getElementById('yarwis-dot');
  const bars = document.getElementById('yarwis-bars');
  if (btn)  btn.className  = 'btn-yarwis yarwis-' + estado;
  if (dot)  dot.className  = 'yarwis-dot dot-' + estado;
  if (bars) bars.className = 'yarwis-bars' + (estado === 'escuchando' ? ' bars-activo' : '');
}
