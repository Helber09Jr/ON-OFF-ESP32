function iniciarSesion() {
  const correo = document.getElementById('correo').value.trim();
  const clave  = document.getElementById('clave').value;

  if (!correo || !clave) {
    mostrarMensaje('Completa todos los campos.', 'error');
    return;
  }

  auth.signInWithEmailAndPassword(correo, clave)
    .then(() => {
      window.location.href = 'panel.html';
    })
    .catch(() => {
      mostrarMensaje('Correo o contrasena incorrectos.', 'error');
    });
}

function crearCuenta() {
  const correo = document.getElementById('correo').value.trim();
  const clave  = document.getElementById('clave').value;

  if (!correo || !clave) {
    mostrarMensaje('Completa todos los campos.', 'error');
    return;
  }

  if (clave.length < 6) {
    mostrarMensaje('La contrasena debe tener al menos 6 caracteres.', 'error');
    return;
  }

  auth.createUserWithEmailAndPassword(correo, clave)
    .then(() => {
      mostrarMensaje('Cuenta creada. Redirigiendo...', 'exito');
      setTimeout(() => { window.location.href = 'panel.html'; }, 1200);
    })
    .catch(err => {
      if (err.code === 'auth/email-already-in-use') {
        mostrarMensaje('Este correo ya esta registrado.', 'error');
      } else {
        mostrarMensaje('Error al crear la cuenta.', 'error');
      }
    });
}

function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById('mensaje');
  msg.textContent = texto;
  msg.className = 'mensaje ' + tipo;
}
