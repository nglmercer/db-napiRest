import { Router } from "napi-router/adapter/router";
import { client } from "../db";
import { verify } from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const MEDIABUNNY_URL = process.env.MEDIABUNNY_URL || "http://localhost:3002";

interface JobResponse {
  jobId: string;
  status: string;
  message?: string;
}

interface JobStatus {
  status: string;
  outputUrl?: string;
  error?: string;
  [key: string]: any;
}

function verifyToken(token: string): Record<string, unknown> {
  return verify(token, AUTH_SECRET) as Record<string, unknown>;
}

const videoProcessingRouter = new Router();

// Middleware de autenticación
videoProcessingRouter.use("*", "/", async (c) => {
  const authHeader = c.req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    c.set("userId", Number(payload.sub));
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Obtener uploads por usuario
videoProcessingRouter.get("/user/:userId/uploads", async (c) => {
  const userId = c.req.pathParam("userId").int(0);
  if (!userId) {
    return c.json({ error: "Invalid userId" }, 400);
  }
  
  const currentUserId = c.get<number>("userId");
  if (!currentUserId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // Solo permitir ver tus propios uploads o si eres admin
  if (userId !== currentUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const result = await client.execute({
    sql: `
      SELECT r.*, 
        u.name as user_name,
        u.email as user_email
      FROM reels r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `,
    args: [userId],
  });

  return c.json({
    data: result.rows,
    total: result.rows.length,
  });
});

// Verificar si un usuario tiene uploads
videoProcessingRouter.get("/user/:userId/has-uploads", async (c) => {
  const userId = c.req.pathParam("userId").int(0);
  if (!userId) {
    return c.json({ error: "Invalid userId" }, 400);
  }
  
  const currentUserId = c.get<number>("userId");
  if (!currentUserId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  if (userId !== currentUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const result = await client.execute({
    sql: `SELECT COUNT(*) as count FROM reels WHERE user_id = ?`,
    args: [userId],
  });

  const count = Number((result.rows[0] as any).count);

  return c.json({
    hasUploads: count > 0,
    totalUploads: count,
  });
});

// Iniciar procesamiento de video con mediabunny-service
videoProcessingRouter.post("/process/:reelId", async (c) => {
  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) {
    return c.json({ error: "Invalid reelId" }, 400);
  }
  
  const userId = c.get<number>("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const body = (await c.req.json()) as any;

  // Verificar que el reel existe y pertenece al usuario
  const reel = await client.execute({
    sql: `SELECT * FROM reels WHERE id = ? AND user_id = ?`,
    args: [reelId, userId],
  });

  if (reel.rows.length === 0) {
    return c.json({ error: "Reel not found or access denied" }, 404);
  }

  const reelData = reel.rows[0] as any;

  // Enviar al servicio mediabunny para procesamiento
  try {
    const response = await fetch(`${MEDIABUNNY_URL}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputUrl: reelData.video_url,
        outputFormat: body.outputFormat || "hls",
        options: {
          segmentDuration: body.segmentDuration || 6,
          playlistSize: body.playlistSize || 10,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Mediabunny service error: ${response.statusText}`);
    }

    const jobData = await response.json() as JobResponse;

    // Actualizar el reel con el jobId
    await client.execute({
      sql: `UPDATE reels SET processing_job_id = ? WHERE id = ?`,
      args: [jobData.jobId, reelId],
    });

    return c.json({
      success: true,
      jobId: jobData.jobId,
      status: "processing",
      message: "Video processing started",
    });
  } catch (error: any) {
    console.error("Failed to start video processing:", error);
    return c.json({ error: "Failed to start video processing", details: error.message }, 500);
  }
});

// Consultar estado de procesamiento
videoProcessingRouter.get("/status/:jobId", async (c) => {
  const jobId = c.req.pathParam("jobId").require("jobId");
  if (!jobId) {
    return c.json({ error: "Invalid jobId" }, 400);
  }
  
  const userId = c.get<number>("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verificar que el job pertenece a un reel del usuario
  const reel = await client.execute({
    sql: `SELECT * FROM reels WHERE processing_job_id = ? AND user_id = ?`,
    args: [jobId, userId],
  });

  if (reel.rows.length === 0) {
    return c.json({ error: "Job not found or access denied" }, 404);
  }

  try {
    const response = await fetch(`${MEDIABUNNY_URL}/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Mediabunny service error: ${response.statusText}`);
    }

    const jobStatus = await response.json() as JobStatus;

    // Si el job está completado, actualizar el reel con las URLs procesadas
    if (jobStatus.status === "completed" && jobStatus.outputUrl) {
      await client.execute({
        sql: `UPDATE reels SET 
          hls_url = ?,
          processing_status = 'completed',
          processed_at = datetime('now')
          WHERE processing_job_id = ?`,
        args: [jobStatus.outputUrl, jobId],
      });
    } else if (jobStatus.status === "failed" && jobStatus.error) {
      await client.execute({
        sql: `UPDATE reels SET 
          processing_status = 'failed',
          processing_error = ?
          WHERE processing_job_id = ?`,
        args: [jobStatus.error, jobId],
      });
    }

    return c.json(jobStatus);
  } catch (error: any) {
    console.error("Failed to get job status:", error);
    return c.json({ error: "Failed to get job status", details: error.message }, 500);
  }
});

// Obtener HLS procesado
videoProcessingRouter.get("/hls/:reelId/:filename", async (c) => {
  const reelId = c.req.pathParam("reelId").int(0);
  const filename = c.req.pathParam("filename").require("filename");
  
  if (!reelId || !filename) {
    return c.json({ error: "Invalid reelId or filename" }, 400);
  }
  const userId = c.get<number>("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verificar que el reel pertenece al usuario
  const reel = await client.execute({
    sql: `SELECT * FROM reels WHERE id = ? AND user_id = ?`,
    args: [reelId, userId],
  });

  if (reel.rows.length === 0) {
    return c.json({ error: "Reel not found or access denied" }, 404);
  }

  const reelData = reel.rows[0] as any;

  if (!reelData.processing_job_id) {
    return c.json({ error: "Video not processed yet" }, 400);
  }

  try {
    const response = await fetch(`${MEDIABUNNY_URL}/hls/${reelData.processing_job_id}/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Mediabunny service error: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = filename.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : filename.endsWith(".ts")
      ? "video/mp2t"
      : "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Failed to stream HLS:", error);
    return c.json({ error: "Failed to stream HLS content", details: error.message }, 500);
  }
});

// Procesamiento vía WebSocket (endpoint informativo)
videoProcessingRouter.post("/process-ws/:reelId", async (c) => {
  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) {
    return c.json({ error: "Invalid reelId" }, 400);
  }
  
  const userId = c.get<number>("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const body = (await c.req.json()) as any;

  // Verificar que el reel existe y pertenece al usuario
  const reel = await client.execute({
    sql: `SELECT * FROM reels WHERE id = ? AND user_id = ?`,
    args: [reelId, userId],
  });

  if (reel.rows.length === 0) {
    return c.json({ error: "Reel not found or access denied" }, 404);
  }

  const reelData = reel.rows[0] as any;

  return c.json({
    success: true,
    message: "WebSocket processing endpoint available at ws://localhost:3003",
    reelId,
    videoUrl: reelData.video_url,
    instructions: "Connect to WebSocket and send: { type: 'process', inputUrl: '" + reelData.video_url + "', outputFormat: 'hls' }"
  });
});

export default videoProcessingRouter;
