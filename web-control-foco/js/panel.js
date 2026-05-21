const ref_foco = db.ref('/foco/estado');

// Proteger la pagina: redirigir si no hay sesion activa
auth.onAuthStateChanged(usuario => {
  if (!usuario) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('email-usuario').textContent = usuario.email;
  escucharEstado();
});

// Escuchar cambios en tiempo real desde Firebase
function escucharEstado() {
  ref_foco.on('value', snap => {
    const estado = snap.val() === true;
    actualizarUI(estado);
  });
}

function encender() {
  ref_foco.set(true);
}

function apagar() {
  ref_foco.set(false);
}

function cerrarSesion() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

function actualizarUI(estado) {
  const tarjeta = document.getElementById('tarjeta');
  const foco    = document.getElementById('foco-contenedor');
  const badge   = document.getElementById('estado-badge');
  const texto   = document.getElementById('texto-estado');

  if (estado) {
    tarjeta.classList.add('encendido');
    foco.classList.add('foco-on');
    badge.className = 'estado-badge badge-on';
    texto.textContent = 'ENCENDIDO';
  } else {
    tarjeta.classList.remove('encendido');
    foco.classList.remove('foco-on');
    badge.className = 'estado-badge badge-off';
    texto.textContent = 'APAGADO';
  }
}
