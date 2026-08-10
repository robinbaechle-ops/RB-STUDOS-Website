// Cloudflare Worker: nimmt Bild + Prompt vom Browser entgegen, ruft die
// Google-Gemini-API mit dem geheimen API-Key auf und gibt das generierte
// Bild zurück. Der Key steckt nur hier (als Worker-Secret), nie im Browser.

const ALLOWED_ORIGIN = "https://studio-rb.net";
const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_PROMPT_LENGTH = 2000;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Methode nicht erlaubt." }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Ungültige Anfrage." }, 400);
    }

    const { prompt, imageBase64, imageMimeType } = body || {};

    if (!prompt || typeof prompt !== "string" || prompt.length > MAX_PROMPT_LENGTH) {
      return jsonResponse({ error: "Prompt fehlt oder ist zu lang." }, 400);
    }

    const parts = [{ text: prompt }];
    if (imageBase64) {
      if (typeof imageBase64 !== "string" || imageBase64.length > 8_000_000) {
        return jsonResponse({ error: "Bild ist ungültig oder zu groß." }, 400);
      }
      parts.push({
        inline_data: {
          mime_type: imageMimeType || "image/jpeg",
          data: imageBase64,
        },
      });
    }

    let geminiResponse;
    try {
      geminiResponse = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      });
    } catch (err) {
      return jsonResponse({ error: "KI-Dienst nicht erreichbar." }, 502);
    }

    if (!geminiResponse.ok) {
      return jsonResponse({ error: "KI-Dienst hat einen Fehler gemeldet." }, 502);
    }

    const data = await geminiResponse.json();
    const responseParts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find((p) => p.inline_data || p.inlineData);
    const inline = imagePart?.inline_data || imagePart?.inlineData;

    if (!inline) {
      return jsonResponse({ error: "Die KI hat kein Bild zurückgegeben." }, 502);
    }

    return jsonResponse({ imageBase64: inline.data, mimeType: inline.mime_type || inline.mimeType || "image/png" });
  },
};
