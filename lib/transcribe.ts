// Транскрипция голосовых сообщений через OpenAI Whisper.
// Дешёвый и точный путь — Anthropic API пока не принимает audio напрямую.
// Если OPENAI_API_KEY не выставлен — возвращаем null, caller сам решит как
// сообщить пользователю.

export async function transcribeAudio(
  buffer: ArrayBuffer,
  mime: string,
  ext: string,
  language?: string,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const blob = new Blob([buffer], { type: mime });
  const form = new FormData();
  form.append("file", blob, `voice.${ext}`);
  form.append("model", "whisper-1");
  if (language) form.append("language", language);

  try {
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { text?: string };
    return (data.text ?? "").trim() || null;
  } catch {
    return null;
  }
}
