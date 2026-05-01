import { createAdminClient } from "@/lib/supabase/admin";

const TG = "https://api.telegram.org";

interface TgFileResponse {
  ok: boolean;
  result?: { file_path: string; file_size?: number };
}

export async function getTelegramFileMeta(
  botToken: string,
  fileId: string,
): Promise<{ url: string; size: number; path: string } | null> {
  const r = await fetch(`${TG}/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
  if (!r.ok) return null;
  const data = (await r.json()) as TgFileResponse;
  if (!data.ok || !data.result) return null;
  return {
    url: `${TG}/file/bot${botToken}/${data.result.file_path}`,
    size: data.result.file_size ?? 0,
    path: data.result.file_path,
  };
}

export async function downloadTelegramFile(
  botToken: string,
  fileId: string,
): Promise<{ buffer: ArrayBuffer; mime: string; ext: string } | null> {
  const meta = await getTelegramFileMeta(botToken, fileId);
  if (!meta) return null;
  const resp = await fetch(meta.url);
  if (!resp.ok) return null;
  const buffer = await resp.arrayBuffer();
  const mime = resp.headers.get("content-type") || guessMime(meta.path);
  const ext = (meta.path.split(".").pop() || guessExt(mime)).toLowerCase();
  return { buffer, mime, ext };
}

function guessMime(path: string): string {
  const ext = (path.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "ogg" || ext === "oga") return "audio/ogg";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "wav") return "audio/wav";
  return "application/octet-stream";
}

function guessExt(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "bin";
}

export async function uploadToFamilyBucket(
  userId: string,
  buffer: ArrayBuffer,
  mime: string,
  ext: string,
  prefix: "tg-photo" | "tg-voice",
): Promise<string | null> {
  const sb = createAdminClient();
  const path = `${prefix}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage
    .from("family-uploads")
    .upload(path, new Uint8Array(buffer), {
      contentType: mime,
      upsert: false,
    });
  if (error) return null;
  return sb.storage.from("family-uploads").getPublicUrl(path).data.publicUrl;
}
