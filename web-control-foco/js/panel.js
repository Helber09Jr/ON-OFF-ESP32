const ref_foco = db.ref('/foco/estado');
let estado_actual = false;
let primer_carga  = true;

auth.onAuthStateChanged(usuario => {
  if (!usuario) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('email-usuario').textContent = usuario.email;
  escucharEstado();
});

function escucharEstado() {
  ref_foco.on('value', snap => {
    const estado = snap.val() === true;

    if (estado && !estado_actual && !primer_carga) {
      flashEncendido();
    }

    estado_actual = estado;
    primer_carga  = false;
    actualizarUI(estado);
  });
}

function toggleFoco() {
  ref_foco.set(!estado_actual);
}

function cerrarSesion() {
  ref_foco.off();
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
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

function flashEncendido() {
  const foco = document.getElementById('foco-contenedor');
  foco.classList.remove('flash');
  void foco.offsetWidth;
  foco.classList.add('flash');
  setTimeout(() => foco.classList.remove('flash'), 650);
}

function actualizarUI(estado) {
  const tarjeta = document.getElementById('tarjeta');
  const foco    = document.getElementById('foco-contenedor');
  const badge   = document.getElementById('estado-badge');
  const texto   = document.getElementById('texto-estado');
  const btn     = document.getElementById('btn-toggle');

  if (estado) {
    tarjeta.classList.add('encendido');
    foco.classList.add('foco-on');
    badge.className = 'estado-badge badge-on';
    texto.textContent = 'ENCENDIDO';
    btn.textContent   = 'APAGAR';
    btn.className     = 'btn-toggle btn-apagar-mode';
  } else {
    tarjeta.classList.remove('encendido');
    foco.classList.remove('foco-on');
    badge.className = 'estado-badge badge-off';
    texto.textContent = 'APAGADO';
    btn.textContent   = 'ENCENDER';
    btn.className     = 'btn-toggle btn-encender-mode';
  }
}
