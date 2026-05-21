# ON-OFF-ESP32

Proyecto IoT para control remoto de un foco de 220V AC con ESP32 y Firebase.

**Curso:** Sistemas Electricos y Electronicos
**Carrera:** Ingenieria en Informatica y Sistemas

## Contenido del repositorio

```
on-off-esp32/
|-- web-control-foco/   <- Web App (HTML/CSS/JS + Firebase)
`-- esp32/              <- Codigo para el ESP32 (proximo)
```

## Web App
Ver instrucciones completas en [web-control-foco/README.md](web-control-foco/README.md)

## Arquitectura
```
Usuario -> Web App -> Firebase Realtime DB -> ESP32 -> Rele -> Foco 220V AC
```
