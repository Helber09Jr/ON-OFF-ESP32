# Control de Foco IoT

Web App para controlar remotamente un foco de 220V AC mediante un ESP32 y Firebase.

**Curso:** Sistemas Electricos y Electronicos
**Carrera:** Ingenieria en Informatica y Sistemas

## Arquitectura

```
Usuario -> Web App -> Firebase Realtime DB -> ESP32 -> Rele -> Foco 220V AC
```

## Estructura del proyecto

```
web-control-foco/
|-- index.html              <- Pantalla de login
|-- panel.html              <- Panel de control del foco
|-- css/
|   `-- style.css           <- Estilos de toda la app
`-- js/
    |-- firebase-config.js  <- Configuracion de Firebase
    |-- login.js            <- Logica de autenticacion
    `-- panel.js            <- Logica de control del foco
```

## Configuracion de Firebase

### 1. Credenciales
Edita `js/firebase-config.js` y verifica que `databaseURL` coincida
con la URL que aparece en Firebase Console > Realtime Database > Datos.

### 2. Activar Authentication
- Firebase Console > Authentication > Sign-in method
- Activar: Correo electronico / Contrasena

### 3. Crear nodo en Realtime Database
En Firebase Console > Realtime Database > Datos, crear:
```json
{
  "foco": {
    "estado": false
  }
}
```

### 4. Reglas de seguridad
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Deploy en Vercel

1. Importar este repositorio en vercel.com
2. Root Directory -> `web-control-foco`
3. Framework Preset -> Other
4. Deploy
