// KI-Bildvorschau: Foto-Upload oder Textangaben -> Cloudflare Worker ->
// Google Gemini -> generiertes Vorschaubild. Der API-Key steckt nur im
// Worker, nie hier im Browser-Code.
//
// Für ein realistisches Ergebnis wird zusätzlich immer das echte,
// unbedruckte Produktfoto (product.image, aus dem Bildname-Ordner) als
// Referenzbild mitgeschickt, sofern vorhanden.

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

function urlToBase64(url) {
  return fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const match = /^data:(.+);base64,(.+)$/.exec(reader.result || "");
            resolve(match ? { mimeType: match[1], base64: match[2] } : null);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);
}

function buildAiPrompt(product, values, hasReference, hasUpload) {
  const parts = [
    product.aiPrompt ||
      `Erzeuge ein fotorealistisches Produktfoto von "${product.name}" (${product.desc || "personalisiertes Unikat"}), wie es nach der Fertigung aussehen würde.`
  ];

  const texts = Object.values(values).filter((v) => v && typeof v === "string");

  if (hasReference && hasUpload) {
    parts.push("Das erste beigefügte Bild zeigt das echte, unbedruckte Produkt (Material, Form, Farbe) — nutze es als exakte Grundlage für das Ergebnis. Das zweite beigefügte Bild ist die Vorlage des Kunden: das kann entweder eine komplette Vorstellung des gewünschten Endprodukts sein oder nur ein einzelnes Motiv/Logo/Schriftzug, der auf das Produkt aus dem ersten Bild übertragen werden soll — erkenne selbst, welcher Fall vorliegt, und setze es entsprechend sinnvoll um.");
  } else if (hasReference) {
    parts.push("Das beigefügte Bild zeigt das echte Produkt — es kann bereits einen Beispieltext oder ein Beispielmotiv zeigen. Übernimm Material, Form, Farbe, Hintergrund, Layout, Schriftart, Schriftgröße und alle sonstigen Gestaltungselemente exakt unverändert. Ändere ausschließlich den unten angegebenen Personalisierungstext bzw. das Motiv — an derselben Position, in derselben Schriftart und Größe wie im Referenzbild. Sonst darf sich nichts am Bild ändern.");
  } else if (hasUpload) {
    parts.push("Das beigefügte Bild ist die Vorlage des Kunden: das kann entweder eine komplette Vorstellung des gewünschten Endprodukts sein oder nur ein einzelnes Motiv/Logo/Schriftzug, der auf dem Produkt angebracht werden soll — erkenne selbst, welcher Fall vorliegt, und setze es entsprechend sinnvoll um.");
  }

  if (texts.length) {
    parts.push("Der vom Kunden gewünschte Personalisierungstext lautet: " + texts.map((v) => `"${v}"`).join(", ") + ". Bringe genau diesen Text an — keinen anderen, keine zusätzlichen oder abweichenden Textzeilen.");
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

  // Referenzfoto für die KI: das in der Galerie ausgewählte Motiv (falls der
  // Kunde eines gewählt hat), sonst das Standard-Produktfoto. Wird bei jeder
  // Generierung neu ermittelt, damit ein Wechsel der Galerie-Auswahl greift.
  function getReferenceImageUrl() {
    if (typeof getSelectedGalleryImage === "function") {
      const selected = getSelectedGalleryImage();
      if (selected) return selected;
    }
    return product.image || null;
  }

  function setStatus(text, isError) {
    statusEl.hidden = !text;
    statusEl.textContent = text || "";
    statusEl.classList.toggle("error", !!isError);
  }

  function setBusy(busy) {
    generateBtn.disabled = busy;
    refineSubmit.disabled = busy;
  }

  async function generate(prompt, images) {
    if (aiGenerationsUsed() >= AI_SESSION_LIMIT) {
      setStatus(`Du hast das Limit von ${AI_SESSION_LIMIT} KI-Vorschauen für diese Sitzung erreicht. Lade die Seite neu oder bestelle direkt mit deinen Angaben.`, true);
      return;
    }

    setBusy(true);
    setStatus("KI-Vorschau wird erzeugt … das kann einen Moment dauern.");
    resultBox.hidden = true;
    refineBox.hidden = true;

    try {
      const data = await callAiWorker({ prompt, images: images.filter(Boolean) });
      aiRegisterGeneration();
      lastImage = { base64: data.imageBase64, mimeType: data.mimeType || "image/png" };
      resultImg.src = `data:${lastImage.mimeType};base64,${lastImage.base64}`;
      resultImg.hidden = false;
      document.getElementById("preview-panel").hidden = false;
      document.getElementById("preview-caption").hidden = false;
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
    const referenceUrl = getReferenceImageUrl();
    const [referenceImage, uploaded] = await Promise.all([
      referenceUrl ? urlToBase64(referenceUrl) : Promise.resolve(null),
      file ? fileToBase64(file) : Promise.resolve(null)
    ]);

    const values = {};
    product.fields.forEach((field) => {
      if (field.type === "text") {
        const el = document.getElementById(field.id);
        if (el) values[field.id] = el.value.trim();
      }
    });

    const prompt = buildAiPrompt(product, values, !!referenceImage, !!uploaded);
    generate(prompt, [referenceImage, uploaded]);
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
    generate(`Bearbeite das vorherige Bild wie folgt: ${instruction}`, [lastImage]);
  });
}
