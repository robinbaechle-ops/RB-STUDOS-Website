// Cloudflare Worker mit zwei Funktionen, beide halten ihre Secrets nur
// hier serverseitig, nie im Browser-Code:
//
// 1. "/" (Standard): KI-Bildvorschau — nimmt Bild(er) + Prompt entgegen,
//    ruft Google Gemini auf, gibt das generierte Bild zurück.
// 2. "/print-request": 3D-Druck-Preisanfrage — nimmt Kontaktdaten + eine
//    hochgeladene 3D-Datei entgegen und leitet sie per E-Mail (Resend) an
//    robinbaechle@googlemail.com weiter.

const ALLOWED_ORIGIN = "https://studio-rb.net";
const NOTIFY_EMAIL = "robinbaechle@googlemail.com";

const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_PROMPT_LENGTH = 2000;
const MAX_IMAGES = 3;
const MAX_IMAGE_LENGTH = 8_000_000;

const RESEND_URL = "https://api.resend.com/emails";
const MAX_PRINT_FILE_LENGTH = 20_000_000; // Base64-Zeichen, entspricht ca. 15 MB Originaldatei
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function handleAiGenerate(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Methode nicht erlaubt." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungültige Anfrage." }, 400);
  }

  const { prompt, images } = body || {};

  if (!prompt || typeof prompt !== "string" || prompt.length > MAX_PROMPT_LENGTH) {
    return jsonResponse({ error: "Prompt fehlt oder ist zu lang." }, 400);
  }

  const imageList = Array.isArray(images) ? images.filter(Boolean).slice(0, MAX_IMAGES) : [];
  const parts = [{ text: prompt }];
  for (const img of imageList) {
    if (!img || typeof img.base64 !== "string" || img.base64.length > MAX_IMAGE_LENGTH) {
      return jsonResponse({ error: "Bild ist ungültig oder zu groß." }, 400);
    }
    parts.push({
      inline_data: {
        mime_type: img.mimeType || "image/jpeg",
        data: img.base64,
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
    console.error("Gemini fetch fehlgeschlagen:", err);
    return jsonResponse({ error: "KI-Dienst nicht erreichbar." }, 502);
  }

  if (!geminiResponse.ok) {
    const errText = await geminiResponse.text();
    console.error("Gemini-Fehlerantwort:", geminiResponse.status, errText);
    return jsonResponse({ error: "KI-Dienst hat einen Fehler gemeldet." }, 502);
  }

  const data = await geminiResponse.json();
  const responseParts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = responseParts.find((p) => p.inline_data || p.inlineData);
  const inline = imagePart?.inline_data || imagePart?.inlineData;

  if (!inline) {
    console.error("Keine Bilddaten in Gemini-Antwort:", JSON.stringify(data));
    return jsonResponse({ error: "Die KI hat kein Bild zurückgegeben." }, 502);
  }

  return jsonResponse({ imageBase64: inline.data, mimeType: inline.mime_type || inline.mimeType || "image/png" });
}

async function handlePrintRequest(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Methode nicht erlaubt." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungültige Anfrage." }, 400);
  }

  const { name, email, message, fileName, fileBase64 } = body || {};

  if (!name || typeof name !== "string" || name.length > 200) {
    return jsonResponse({ error: "Name fehlt oder ist zu lang." }, 400);
  }
  if (!email || typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return jsonResponse({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, 400);
  }
  if (message && (typeof message !== "string" || message.length > 3000)) {
    return jsonResponse({ error: "Nachricht ist zu lang." }, 400);
  }
  if (!fileName || typeof fileName !== "string" || fileName.length > 200) {
    return jsonResponse({ error: "Dateiname fehlt." }, 400);
  }
  if (!fileBase64 || typeof fileBase64 !== "string" || fileBase64.length > MAX_PRINT_FILE_LENGTH) {
    return jsonResponse({ error: "Datei fehlt oder ist zu groß (max. ca. 15 MB)." }, 400);
  }

  const textBody = [
    "Neue 3D-Druck-Preisanfrage über die Website",
    "",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    "",
    "Nachricht:",
    message || "(keine Nachricht)",
    "",
    `Angehängte Datei: ${fileName}`,
  ].join("\n");

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Studio RB Website <anfrage@studio-rb.net>",
        to: [NOTIFY_EMAIL],
        reply_to: email,
        subject: `Neue 3D-Druck-Anfrage von ${name}`,
        text: textBody,
        attachments: [{ filename: fileName, content: fileBase64 }],
      }),
    });
  } catch {
    return jsonResponse({ error: "E-Mail-Versand nicht erreichbar." }, 502);
  }

  if (!resendResponse.ok) {
    return jsonResponse({ error: "E-Mail-Versand ist fehlgeschlagen." }, 502);
  }

  return jsonResponse({ success: true });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname === "/print-request") {
      return handlePrintRequest(request, env);
    }
    return handleAiGenerate(request, env);
  },
};
