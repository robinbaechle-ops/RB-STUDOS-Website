// KI-Bildvorschau: Foto-Upload oder Textangaben -> Cloudflare Worker ->
// Google Gemini API -> generiertes Vorschaubild. Der API-Key steckt nur
// im Worker, nie hier im Browser-Code.

const AI_WORKER_URL = "https://ai.studio-rb.net/";
const AI_SESSION_LIMIT = 5;
const AI_SESSION_KEY = "rbstudio-ai-count";

let aiConfirmedPreview = null; // von collectOrder() in customizer.js gelesen

function getConfirmedAiPreview() {
  return aiConfirmedPreview;
}

function aiGenerationsUsed() {
  return parseInt(sessionStorage.getItem(AI_SESSION_KEY) || "0", 10);
}

function aiRegisterGeneration() {
  sessionStorage.setItem(AI_SESSION_KEY, String(aiGenerationsUsed() + 1));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const match = /^data:(.+);base64,(.+)$/.exec(reader.result || "");
      resolve(match ? { mimeType: match[1], base64: match[2] } : null);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildAiPrompt(product, values) {
  const parts = [
    product.aiPrompt ||
      `Erzeuge ein fotorealistisches Produktfoto von "${product.name}" (${product.desc || "personalisiertes Unikat"}), wie es nach der Fertigung aussehen würde.`
  ];
  const texts = Object.values(values).filter((v) => v && typeof v === "string");
  if (texts.length) {
    parts.push("Bringe folgenden vom Kunden gewünschten Text gut lesbar auf dem Produkt an: " + texts.map((v) => `"${v}"`).join(", ") + ".");
  }
  return parts.join(" ");
}

async function callAiWorker(payload) {
  const res = await fetch(AI_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Unbekannter Fehler bei der KI-Vorschau.");
  }
  return data;
}

function initAiPreview(product) {
  const section = document.getElementById("ai-preview");
  if (!section) return;

  const photoInput = document.getElementById("ai-photo-input");
  const generateBtn = document.getElementById("ai-generate-btn");
  const statusEl = document.getElementById("ai-status");
  const resultBox = document.getElementById("ai-result");
  const resultImg = document.getElementById("ai-result-img");
  const goodBtn = document.getElementById("ai-good-btn");
  const refineBtn = document.getElementById("ai-refine-btn");
  const refineBox = document.getElementById("ai-refine");
  const refineText = document.getElementById("ai-refine-text");
  const refineSubmit = document.getElementById("ai-refine-submit");

  let lastImage = null; // { base64, mimeType } — letztes generiertes Bild, Basis für "Nochmals anpassen"

  function setStatus(text, isError) {
    statusEl.hidden = !text;
    statusEl.textContent = text || "";
    statusEl.classList.toggle("error", !!isError);
  }

  function setBusy(busy) {
    generateBtn.disabled = busy;
    refineSubmit.disabled = busy;
  }

  async function generate(prompt, baseImage) {
    if (aiGenerationsUsed() >= AI_SESSION_LIMIT) {
      setStatus(`Du hast das Limit von ${AI_SESSION_LIMIT} KI-Vorschauen für diese Sitzung erreicht. Lade die Seite neu oder bestelle direkt mit deinen Angaben.`, true);
      return;
    }

    setBusy(true);
    setStatus("KI-Vorschau wird erzeugt … das kann einen Moment dauern.");
    resultBox.hidden = true;
    refineBox.hidden = true;

    try {
      const payload = { prompt };
      if (baseImage) {
        payload.imageBase64 = baseImage.base64;
        payload.imageMimeType = baseImage.mimeType;
      }
      const data = await callAiWorker(payload);
      aiRegisterGeneration();
      lastImage = { base64: data.imageBase64, mimeType: data.mimeType || "image/png" };
      resultImg.src = `data:${lastImage.mimeType};base64,${lastImage.base64}`;
      resultBox.hidden = false;
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Die KI-Vorschau konnte gerade nicht erzeugt werden. Bitte versuch es später erneut oder bestelle direkt mit deinen Angaben.", true);
    } finally {
      setBusy(false);
    }
  }

  generateBtn.addEventListener("click", async () => {
    const file = photoInput.files[0];
    const uploaded = file ? await fileToBase64(file) : null;

    const values = {};
    product.fields.forEach((field) => {
      if (field.type === "text") {
        const el = document.getElementById(field.id);
        if (el) values[field.id] = el.value.trim();
      }
    });

    generate(buildAiPrompt(product, values), uploaded);
  });

  goodBtn.addEventListener("click", () => {
    aiConfirmedPreview = lastImage ? `data:${lastImage.mimeType};base64,${lastImage.base64}` : null;
    refineBox.hidden = true;
    setStatus("Vorschau übernommen — sie wird deiner Bestellung beigelegt.");
  });

  refineBtn.addEventListener("click", () => {
    refineBox.hidden = false;
    refineText.value = "";
    refineText.focus();
  });

  refineSubmit.addEventListener("click", () => {
    const instruction = refineText.value.trim();
    if (!instruction) {
      refineText.focus();
      return;
    }
    generate(`Bearbeite das vorherige Bild wie folgt: ${instruction}`, lastImage);
  });
}
