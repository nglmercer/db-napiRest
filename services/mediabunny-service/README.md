# Mediabunny Service

Video processing service with HTTP, WebSocket, and IPC support for HLS streaming.

## Features

- **HTTP API**: RESTful endpoints for video processing
- **WebSocket**: Real-time streaming and job updates
- **IPC**: Inter-process communication with worker pool
- **HLS Support**: HTTP Live Streaming with adaptive bitrate
- **Job Management**: Track processing status and progress
- **Worker Pool**: Scalable processing with multiple workers

## Installation

```bash
cd services/mediabunny-service
bun install
```

## Usage

### Start the service

```bash
bun run dev
```

This starts:
- HTTP server on port 3002
- WebSocket server on port 3003
- IPC workers for processing

### HTTP API

#### Process video

```bash
curl -X POST http://localhost:3002/process \
  -H "Content-Type: application/json" \
  -d '{
    "inputUrl": "https://example.com/video.mp4",
    "outputFormat": "hls",
    "options": {
      "segmentDuration": 6,
      "playlistSize": 10
    }
  }'
```

#### Get job status

```bash
curl http://localhost:3002/status/:jobId
```

#### Stream HLS content

```bash
curl http://localhost:3002/hls/:jobId/playlist.m3u8
```

### WebSocket API

Connect to `ws://localhost:3003` and send messages:

#### Process video

```json
{
  "type": "process",
  "inputUrl": "https://example.com/video.mp4",
  "outputFormat": "hls",
  "options": {
    "segmentDuration": 6,
    "playlistSize": 10
  }
}
```

#### Subscribe to job updates

```json
{
  "type": "subscribe",
  "jobId": "job_123"
}
```

### IPC API

The IPC server manages a pool of workers for processing. Workers are automatically spawned and respawned if they crash.

```typescript
import { IPCServer } from "./src/ipc/server.js";

const ipc = new IPCServer();
await ipc.start();

const jobId = await ipc.processVideo(
  "https://example.com/video.mp4",
  "hls",
  { segmentDuration: 6 }
);
```

## Architecture

### HTTP Server (Hono)
- RESTful API for video processing
- Job status tracking
- HLS streaming endpoints

### WebSocket Server (ws)
- Real-time job updates
- Bidirectional communication
- Job subscription system

### IPC Server (child_process)
- Worker pool for parallel processing
- Process isolation for stability
- Automatic worker respawn

### Job Manager
- Centralized job state management
- Pub/sub notification system
- Progress tracking

## Configuration

Environment variables:

- `PORT`: HTTP server port (default: 3002)
- `WS_PORT`: WebSocket server port (default: 3003)
- `UPLOAD_DIR`: Upload directory (default: ./uploads)
- `OUTPUT_DIR`: Output directory (default: ./outputs)
- `HLS_SEGMENT_DURATION`: HLS segment duration in seconds (default: 6)
- `HLS_PLAYLIST_SIZE`: HLS playlist size (default: 10)
- `MAX_CONCURRENT_JOBS`: Maximum concurrent jobs (default: 3)

## Testing

```bash
bun test
```

## License

MIT
