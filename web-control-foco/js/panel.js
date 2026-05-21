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
  // Valores por defecto para nodos creados manualmente en Firebase
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
      onclick="toggleDispositivo('${id}')">
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

function toggleDispositivo(id) {
  const ref = db.ref('/dispositivos/' + id + '/estado');
  ref.once('value', snap => {
    ref.set(!snap.val()).catch(() => {
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
