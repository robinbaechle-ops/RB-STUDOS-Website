// Cloudflare Worker mit drei Funktionen, alle halten ihre Zugangsdaten nur
// hier serverseitig, nie im Browser-Code:
//
// 1. "/" (Standard): KI-Bildvorschau — nimmt Bild(er) + Prompt entgegen,
//    ruft den kostenlosen Pollinations.ai-Bilddienst (Modell "kontext",
//    Open-Source-Basis FLUX) auf und gibt das generierte Bild zurück.
//    Pollinations braucht öffentlich erreichbare Bild-URLs statt Uploads,
//    darum werden hochgeladene bzw. bereits generierte Bilder kurzzeitig
//    (10 Minuten) im KV-Namespace AI_TMP zwischengespeichert und über
//    Route 2 wieder ausgeliefert. Das echte, unbedruckte Produktfoto
//    braucht keine Zwischenspeicherung, da es schon öffentlich unter
//    studio-rb.net liegt — dessen URL wird direkt durchgereicht.
// 2. "/tmp/<id>": liefert ein zwischengespeichertes Bild aus AI_TMP aus,
//    damit Pollinations.ai es abrufen kann.
// 3. "/print-request": 3D-Druck-Preisanfrage — nimmt Kontaktdaten + eine
//    hochgeladene 3D-Datei entgegen und leitet sie per E-Mail (Resend) an
//    info@studio-rb.net weiter.

const ALLOWED_ORIGIN = "https://studio-rb.net";
const NOTIFY_EMAIL = "info@studio-rb.net";

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";
const MAX_PROMPT_LENGTH = 2000;
const MAX_IMAGES = 3;
const MAX_IMAGE_LENGTH = 8_000_000; // Base64-Zeichen für Uploads/Zwischenspeicherung
const TMP_TTL_SECONDS = 600; // 10 Minuten, reicht für einen Generierungs-Durchlauf

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

function randomId() {
  return crypto.randomUUID().replace(/-/g, "");
}

function base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function storeTempImage(env, base64, mimeType) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const id = randomId();
  await env.AI_TMP.put(id, bytes, {
    expirationTtl: TMP_TTL_SECONDS,
    metadata: { mimeType: mimeType || "image/jpeg" },
  });
  return `https://ai.studio-rb.net/tmp/${id}`;
}

// Ein Bild-Eintrag aus dem Request ist entweder { url } (bereits öffentlich
// erreichbar, z. B. unser eigenes Produktfoto) oder { base64, mimeType }
// (Kunden-Upload oder vorheriges KI-Ergebnis) — Letzteres wird kurzzeitig
// zwischengespeichert, um eine abrufbare URL dafür zu bekommen.
async function resolveImageUrl(env, img) {
  if (typeof img.url === "string") {
    if (!img.url.startsWith(ALLOWED_ORIGIN + "/")) return null;
    return img.url;
  }
  if (typeof img.base64 === "string" && img.base64.length > 0 && img.base64.length <= MAX_IMAGE_LENGTH) {
    return storeTempImage(env, img.base64, img.mimeType);
  }
  return null;
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

  const urls = [];
  for (const img of imageList) {
    const url = await resolveImageUrl(env, img);
    if (!url) {
      return jsonResponse({ error: "Bild ist ungültig oder zu groß." }, 400);
    }
    urls.push(url);
  }

  // Das "kontext"-Modell (Bild-zu-Bild) erfordert seit Kurzem einen
  // kostenlosen API-Key von enter.pollinations.ai (wöchentliches
  // Freikontingent, keine Kreditkarte nötig). Der Key wird sowohl als
  // Header als auch als Query-Parameter mitgeschickt, da nicht dokumentiert
  // ist, welche der beiden Varianten der Bild-Endpunkt tatsächlich prüft.
  const pollinationsUrl =
    POLLINATIONS_URL +
    encodeURIComponent(prompt) +
    "?model=kontext" +
    (urls.length ? "&image=" + encodeURIComponent(urls.join("|")) : "") +
    "&width=1024&height=768&nologo=true&referrer=studio-rb.net" +
    (env.POLLINATIONS_API_KEY ? "&key=" + encodeURIComponent(env.POLLINATIONS_API_KEY) : "");

  const pollinationsHeaders = env.POLLINATIONS_API_KEY
    ? { Authorization: `Bearer ${env.POLLINATIONS_API_KEY}` }
    : {};

  console.log("POLLINATIONS_API_KEY gesetzt:", !!env.POLLINATIONS_API_KEY, "Länge:", (env.POLLINATIONS_API_KEY || "").length);

  let imgResponse;
  try {
    imgResponse = await fetch(pollinationsUrl, { headers: pollinationsHeaders });
  } catch (err) {
    console.error("Pollinations-Aufruf fehlgeschlagen:", err);
    return jsonResponse({ error: "KI-Dienst nicht erreichbar." }, 502);
  }

  if (!imgResponse.ok) {
    const errText = await imgResponse.text().catch(() => "");
    console.error("Pollinations-Fehlerantwort:", imgResponse.status, errText);
    return jsonResponse({ error: "KI-Dienst hat einen Fehler gemeldet." }, 502);
  }

  const mimeType = imgResponse.headers.get("Content-Type") || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    const errText = await imgResponse.text().catch(() => "");
    console.error("Unerwartete Pollinations-Antwort (kein Bild):", errText);
    return jsonResponse({ error: "Die KI hat kein Bild zurückgegeben." }, 502);
  }

  const buffer = await imgResponse.arrayBuffer();
  const imageBase64 = base64FromArrayBuffer(buffer);

  return jsonResponse({ imageBase64, mimeType });
}

async function handleTempImage(request, env) {
  if (request.method !== "GET") {
    return new Response("Methode nicht erlaubt.", { status: 405 });
  }

  const id = new URL(request.url).pathname.replace("/tmp/", "");
  if (!/^[a-f0-9]{32}$/.test(id)) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const { value, metadata } = await env.AI_TMP.getWithMetadata(id, { type: "arrayBuffer" });
  if (!value) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  return new Response(value, {
    headers: {
      "Content-Type": (metadata && metadata.mimeType) || "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
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
    if (url.pathname.startsWith("/tmp/")) {
      return handleTempImage(request, env);
    }
    if (url.pathname === "/print-request") {
      return handlePrintRequest(request, env);
    }
    return handleAiGenerate(request, env);
  },
};
