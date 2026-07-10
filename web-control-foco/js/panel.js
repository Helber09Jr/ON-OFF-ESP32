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
  // Bloqueado mientras Yarwis esta activo
  if (estadoYarwis !== 'INACTIVO') {
    mostrarFeedbackVoz('Desactiva Yarwis primero.', 'info');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    mostrarFeedbackVoz('Tu navegador no soporta reconocimiento de voz.', 'error');
    return;
  }
  if (escuchandoVoz) { detenerVoz(); return; }

  reconocimientoVoz               = new SR();
  reconocimientoVoz.lang          = 'es-ES';
  reconocimientoVoz.interimResults = false;
  reconocimientoVoz.maxAlternatives = 1;
  reconocimientoVoz.continuous    = false;

  reconocimientoVoz.onresult = function(evento) {
    const texto = evento.results[0][0].transcript.toLowerCase().trim();
    mostrarFeedbackVoz('"' + texto + '"', 'neutro');
    procesarComandoVoz(texto, false);
  };
  reconocimientoVoz.onerror = function() {
    mostrarFeedbackVoz('No se entendio el comando.', 'error');
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
// ================================================================
function procesarComandoVoz(texto, conVoz) {
  // Comando: apagar/encender TODO
  if (/todo|todos/.test(texto)) {
    const quiereEncender = /encend|prend|activ/.test(texto);
    const ids = Object.keys(cache_devs);
    if (!ids.length) {
      mostrarFeedbackVoz('No hay dispositivos registrados.', 'info');
      if (conVoz) hablar('No hay dispositivos registrados');
      return;
    }
    ids.forEach(id => {
      db.ref('/dispositivos/' + id + '/estado').set(quiereEncender);
    });
    const msg = quiereEncender ? 'Encendiendo todo...' : 'Apagando todo...';
    mostrarFeedbackVoz(msg, 'exito');
    if (conVoz) hablar(quiereEncender ? 'Encendiendo todo' : 'Apagando todo');
    return;
  }

  // Detectar accion individual
  let accion = null;
  if (/encend|prend|activ|pon|ilumina/.test(texto)) accion = 'encender';
  else if (/apag|desactiv|quita/.test(texto))        accion = 'apagar';

  if (!accion) {
    mostrarFeedbackVoz('Di "encender" o "apagar" + nombre del dispositivo.', 'info');
    if (conVoz) hablar('No entendi el comando');
    return;
  }

  // Buscar dispositivo por nombre o ID
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

  if (!idEncontrado) {
    Object.keys(cache_devs).forEach(id => {
      if (texto.includes(id.toLowerCase())) idEncontrado = id;
    });
  }

  if (!idEncontrado) {
    mostrarFeedbackVoz('No se reconocio ningun dispositivo en el comando.', 'error');
    if (conVoz) hablar('Dispositivo no encontrado');
    return;
  }

  const dev            = cache_devs[idEncontrado];
  const nombre         = dev.nombre || idEncontrado;
  const quiereEncender = (accion === 'encender');

  if (quiereEncender === dev.estado) {
    mostrarFeedbackVoz(nombre + ' ya esta ' + (dev.estado ? 'encendido' : 'apagado') + '.', 'info');
    if (conVoz) hablar(nombre + ' ya esta ' + (dev.estado ? 'encendido' : 'apagado'));
    return;
  }

  cambiarEstadoDispositivo(idEncontrado);
  mostrarFeedbackVoz((quiereEncender ? 'Encendiendo ' : 'Apagando ') + nombre + '...', 'exito');
  if (conVoz) hablar(nombre + (quiereEncender ? ' encendido' : ' apagado'));
}

function mostrarFeedbackVoz(texto, tipo) {
  const el = document.getElementById('voz-feedback');
  if (!el) return;
  el.textContent = texto;
  el.className   = 'voz-feedback voz-' + tipo;
  clearTimeout(el._timer);
  if (tipo !== 'escuchando' && tipo !== 'espera') {
    el._timer = setTimeout(() => {
      // Al ocultar, restaurar mensaje de espera si Yarwis esta activo
      if (estadoYarwis === 'ESPERA_WAKE') {
        el.textContent = 'Di "Yarwis" para activar';
        el.className   = 'voz-feedback voz-espera';
      } else {
        el.className = 'voz-feedback oculto';
      }
    }, 3500);
  }
}

// ================================================================
// ASISTENTE YARWIS — MODO MANOS LIBRES CON WAKE WORD
// ================================================================
const YARWIS_ALIASES = ['yarwis', 'jarvis', 'yarvis', 'yarwiz', 'yarbis', 'garvis', 'harris'];

let reconYarwis   = null;
let estadoYarwis  = 'INACTIVO'; // INACTIVO | ESPERA_WAKE | ESPERA_COMANDO
let timerComando  = null;

function toggleYarwis() {
  if (estadoYarwis !== 'INACTIVO') {
    apagarYarwis();
  } else {
    encenderYarwis();
  }
}

function encenderYarwis() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    mostrarFeedbackVoz('Tu navegador no soporta reconocimiento de voz.', 'error');
    return;
  }
  estadoYarwis = 'ESPERA_WAKE';
  setEstiloYarwis('espera');
  mostrarFeedbackVoz('Di "Yarwis" para activar', 'espera');
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
  reconYarwis.interimResults  = true; // para detectar wake word antes de que termine la frase
  reconYarwis.maxAlternatives = 3;

  reconYarwis.onresult = manejarResultadoYarwis;

  reconYarwis.onerror = function(e) {
    // 'no-speech' y 'aborted' son normales, ignorar
    if (e.error === 'no-speech' || e.error === 'aborted') return;
  };

  reconYarwis.onend = function() {
    // Auto-reiniciar para mantener escucha continua
    if (estadoYarwis !== 'INACTIVO') {
      setTimeout(iniciarReconocimientoYarwis, 350);
    }
  };

  try { reconYarwis.start(); } catch (e) {}
}

function manejarResultadoYarwis(evento) {
  for (let i = evento.resultIndex; i < evento.results.length; i++) {
    const resultado = evento.results[i];

    // Juntar todas las alternativas para mayor tolerancia
    let textoTotal = '';
    for (let j = 0; j < resultado.length; j++) {
      textoTotal += ' ' + resultado[j].transcript.toLowerCase();
    }

    if (estadoYarwis === 'ESPERA_WAKE') {
      const wakeDetectado = YARWIS_ALIASES.some(alias => textoTotal.includes(alias));
      if (wakeDetectado) {
        estadoYarwis = 'ESPERA_COMANDO';
        setEstiloYarwis('escuchando');
        hablar('Te escucho');
        mostrarFeedbackVoz('Te escucho... di el comando', 'escuchando');
        clearTimeout(timerComando);
        // Si no habla en 5 segundos, volver a esperar wake word
        timerComando = setTimeout(volverAEsperaWake, 5000);
      }

    } else if (estadoYarwis === 'ESPERA_COMANDO' && resultado.isFinal) {
      clearTimeout(timerComando);
      const textoFinal = resultado[0].transcript.toLowerCase().trim();
      // Ignorar si el resultado es solo el wake word repetido
      const soloWake = YARWIS_ALIASES.some(a => textoFinal.trim() === a);
      if (soloWake) { return; }
      mostrarFeedbackVoz('"' + textoFinal + '"', 'neutro');
      procesarComandoVoz(textoFinal, true);
      setTimeout(volverAEsperaWake, 2000);
    }
  }
}

function volverAEsperaWake() {
  if (estadoYarwis === 'INACTIVO') return;
  estadoYarwis = 'ESPERA_WAKE';
  setEstiloYarwis('espera');
  setTimeout(() => {
    if (estadoYarwis === 'ESPERA_WAKE') {
      mostrarFeedbackVoz('Di "Yarwis" para activar', 'espera');
    }
  }, 1800);
}

function setEstiloYarwis(estado) {
  const btn = document.getElementById('btn-yarwis');
  const dot = document.getElementById('yarwis-dot');
  if (btn) btn.className = 'btn-yarwis yarwis-' + estado;
  if (dot) dot.className = 'yarwis-dot dot-' + estado;
}

// Sintesis de voz: la app habla en espanol
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
