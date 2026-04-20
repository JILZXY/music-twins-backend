# MusicTwins API

MusicTwins es una plataforma social para compartir y descubrir contenido musical asincrono en base a bibliotecas de streaming, operando mediante interacciones en tiempo real. 

Este backend esta construido sobre NestJS utilizando Arquitectura Hexagonal.

---

## Infraestructura del Proyecto

El sistema se basa en un modelo hibrido de persistencia gobernado por clientes nativos a base de datos (sin el uso de ORMs), separando las responsabilidades de almacenamiento segun el dominio de datos.

- PostgreSQL: Administra los metadatos estructurados operando bajo relaciones y controles estrictos DDL. Aqui residen dominios como Usuarios, Cuentas de Streaming, Amigos, Reacciones, Notas y Conversaciones (Threads).
- MongoDB: Administra el historico de mensajeria masiva, dado que no requiere mapeo estricto, actuando eficientemente como motor de busqueda y carga para chats.
- WebSocket / Socket.io: Instanciado en NestJS para sostener el flujo de mensajeria e interacciones conectadas en tiempo real.
- JWT & OAuth2: Mecanismos que unifican el control de acceso desde cuentas de Spotify.

---

## Endpoints de la API

A continuacion, la lista de rutas REST disponibles en la plataforma (Cuentan con guardias de seguridad JWT exceptuando las rutas de login publicas o health testing):

### Sistema (Health check)
- GET /health : Evalua la conexion integra y pura hacia PostgreSQL y MongoDB.

### Autenticacion (Spotify Auth)
- GET /auth/spotify/login : Inicia el flujo OAuth PKCE y redirecciona.
- GET /auth/spotify/callback : Recibe la confirmacion, guarda tokens y emite el JWT de session.
- GET /auth/me : Retorna el perfil local autenticado.
- POST /auth/logout : Limpia la session.

### Usuarios y Amigos
- GET /users/search?q=texto : Busca usuarios disponibles e indica conexion reciproca.
- GET /friends : Obtiene la lista de amistades.
- GET /friends/requests : Lista las invitaciones pendientes enviadas por otros usuarios.
- POST /friends/requests : Envia una peticion de amistad.
- PATCH /friends/requests/:id : Responde a una peticion (Aceptada / Rechazada).

### Spotify y Reproduccion (Playback)
- GET /spotify/now-playing : Solicita via Music Provider Port local la pista actual directa de Spotify.
- GET /spotify/recent : Solicita via Music Provider Port local el historial resiente.
- POST /playback/sync : Evento offline para grabar asincronamente un "Playback Event".

### Interacciones (Reacciones y Notas)
- POST /reactions : Agrega un emoji y lo asocia a una reproduccion escuchada.
- GET /reactions/:playbackEventId : Retorna las agregaciones json de todos los emojis reaccionados.
- POST /notes : Asocia una nota/comentario a una reproduccion escuchada.
- GET /notes/:playbackEventId : Retorna el historico cronologico local.

### Cronologia (Feed)
- GET /feed?limit=20 : Llama el Join SQL unificado agregando conteo y arreglos de notas, reacciones, y el propio historico iterado tuyo y de amigos aceptados en un formato listo para renderizar.

### Mensajeria Web y WebSockets
- GET /conversations : Obtiene las conversaciones genericas del usuario.
- POST /conversations : Inicializa una conversacion o vincula un "contexto" a partir de un reproductor.
- GET /conversations/:id/messages : Descarga desde MongoDB el payload offline de un trhead.
- POST /messages/read : Acuse de recibo transaccional actualizando los objetos de MongoDB.
- WS / : (Websockets) Escucha el auth por token para crear rooms, intercepta `MESSAGE_SEND` y dispara `MESSAGE_RECEIVED`.

---

## Inicializar el Entorno (Docker)

La manera mas sencilla de desplegar el entorno en desarrollo es mediante Docker. El archivo docker-compose.yml preconfigurara de manera orquestada:
- La API configurada en el puerto 3000
- Contenedor con postgres 15 en 5432
- Contenedor con mongo 6 en 27017

### 1. Preparar las Variables de Entorno

Asegurate de que el archivo .env existe en la raiz del proyecto. Si no existe, puedes crearlo tomando base en este ejemplo de variables requeridas obligatorias:

```env
# Ambiente de Ejecucion (development, production)
NODE_ENV=development
PORT=3000

# Base de Datos PostgreSQL (Transaccional, Usuarios, Amigos, Reacciones)
PG_HOST=postgres
PG_PORT=5432
PG_USER=musictwins_user
PG_PASSWORD=musictwins_pw
PG_DATABASE=musictwins_db

# Base de Datos MongoDB (Offline y Messaging history)
MONGO_URI=mongodb://mongo:27017/musictwins_db
MONGO_DATABASE=musictwins_db

# Seguridad de Tokens
JWT_SECRET=super_secret_music_twins_key_2026

# Credenciales de Proveedores - Spotify
SPOTIFY_CLIENT_ID=tu_client_id_obtenido_en_spotify_dev
SPOTIFY_CLIENT_SECRET=tu_client_secret_obtenido_en_spotify_dev
SPOTIFY_CALLBACK_URL=http://localhost:3000/auth/spotify/callback
```

### 2. Levantar los Servicios

Para levantar la estructura completa abre una terminal, situate en la carpeta raiz del proyecto y corre:

```bash
docker-compose up -d --build
```

Si deseas probar el entorno de desarrollo compilando solamente las bases de datos externas y corriendo NestJS de manera local en tu equipo para aprovechar el Hot-Reload (Modifica tus variables locales de entorno si corres local):

```bash
# Iniciar las bases de datos omitiendo el servicio de la API
docker-compose up -d postgres mongo

# Instalar los paquetes node locales
npm install

# Correr el proyecto
npm run start:dev
```

---

## Comandos de Desarrollo (Sin Docker para la API)

```bash
# Instalar dependencias
$ npm install

# Desarrollo base
$ npm run start

# Desarrollo continuo (Hot reload)
$ npm run start:dev

# Produccion empaquetada
$ npm run start:prod

# Analisis base
$ npm run build
```
