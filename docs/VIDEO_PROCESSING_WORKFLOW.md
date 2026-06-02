# Video Processing Workflow

## Descripción General

El backend ahora integra **mediabunny-service** para procesamiento automático de videos con soporte HLS (HTTP Live Streaming).

## Nuevo Workflow

### 1. Upload de Video
Cuando un usuario sube un video (vía `/api/v1/upload/video`):
- Se guarda el archivo en `uploads/` o se registra la URL externa
- Se crea el registro en la tabla `reels` con `processing_status = 'pending'`
- **Automáticamente** se envía al servicio mediabunny para procesamiento HLS
- Se actualiza con `processing_job_id` y `processing_status = 'processing'`

### 2. Procesamiento (mediabunny-service)
El servicio mediabunny:
- Recibe la URL del video
- Genera HLS (segmentos .ts y playlist .m3u8)
- Actualiza el estado del job en tiempo real
- Notifica via WebSocket o IPC cuando completa

### 3. Consulta de Estado
Endpoint: `GET /api/v1/video/status/:jobId`
- Devuelve el progreso del procesamiento
- Si está completado, actualiza automáticamente el reel con:
  - `hls_url`: URL del playlist HLS
  - `processing_status = 'completed'`
  - `processed_at`: timestamp de completion

### 4. Streaming HLS
Endpoint: `GET /api/v1/video/hls/:reelId/:filename`
- Sirve los archivos HLS procesados
- Soporta playlists (.m3u8) y segmentos (.ts)

## Nuevas Columnas en Tabla `reels`

- `processing_job_id` (TEXT): ID del job en mediabunny-service
- `hls_url` (TEXT): URL del playlist HLS procesado
- `processing_status` (TEXT): Estado ('pending', 'processing', 'completed', 'failed')
- `processing_error` (TEXT): Mensaje de error si falla
- `processed_at` (TEXT): Timestamp de cuando se completó el procesamiento

## Endpoints Nuevos

### Video Processing Router (`/api/v1/video`)

#### `GET /user/:userId/uploads`
Obtiene todos los uploads de un usuario (solo propio o admin).

**Response:**
```json
{
  "data": [...],
  "total": 6
}
```

#### `GET /user/:userId/has-uploads`
Verifica si un usuario tiene uploads.

**Response:**
```json
{
  "hasUploads": true,
  "totalUploads": 6
}
```

#### `POST /process/:reelId`
Inicia procesamiento manual de un reel.

**Body:**
```json
{
  "outputFormat": "hls",
  "segmentDuration": 6,
  "playlistSize": 10
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "status": "processing",
  "message": "Video processing started"
}
```

#### `GET /status/:jobId`
Consulta el estado de un job de procesamiento.

**Response:**
```json
{
  "jobId": "job_1234567890_abc123",
  "status": "completed",
  "progress": 100,
  "outputUrl": "/hls/job_1234567890_abc123/playlist.m3u8"
}
```

#### `GET /hls/:reelId/:filename`
Sirve archivos HLS procesados.

**Ejemplo:**
```
GET /api/v1/video/hls/123/playlist.m3u8
GET /api/v1/video/hls/123/segment_0.ts
```

#### `POST /process-ipc/:reelId`
Procesamiento directo via IPC (alternativa sin HTTP).

## Configuración

Variables de entorno:
- `MEDIABUNNY_URL`: URL del servicio mediabunny (default: `http://localhost:3002`)

## Flujo Completo

```
1. Usuario sube video
   ↓
2. POST /api/v1/upload/video
   ↓
3. Se guarda en DB (processing_status = 'pending')
   ↓
4. Auto-envío a mediabunny-service
   ↓
5. mediabunny procesa (genera HLS)
   ↓
6. Frontend consulta GET /api/v1/video/status/:jobId
   ↓
7. Cuando status = 'completed', se actualiza hls_url
   ↓
8. Frontend reproduce via GET /api/v1/video/hls/:reelId/playlist.m3u8
```

## Ejemplo de Uso

### Subir video
```bash
curl -X POST http://localhost:3000/api/v1/upload/video \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi video",
    "video_url": "https://example.com/video.mp4"
  }'
```

### Verificar uploads del usuario
```bash
curl http://localhost:3000/api/v1/video/user/1/has-uploads \
  -H "Authorization: Bearer <token>"
```

### Consultar estado de procesamiento
```bash
curl http://localhost:3000/api/v1/video/status/job_1234567890_abc123 \
  -H "Authorization: Bearer <token>"
```

### Reproducir HLS
```bash
curl http://localhost:3000/api/v1/video/hls/123/playlist.m3u8 \
  -H "Authorization: Bearer <token>"
```

## Estado Actual

✅ **Base de datos:** 6 reels existentes (2 por cada uno de los 3 usuarios)
- Todos son URLs externas (Google Cloud Storage)
- Directorio `uploads/` vacío

✅ **Migración:** Nuevas columnas agregadas automáticamente
✅ **Workflow:** Auto-procesamiento al subir
✅ **Endpoints:** 6 nuevos endpoints para video processing
✅ **Integración:** Conectado con mediabunny-service via HTTP e IPC
