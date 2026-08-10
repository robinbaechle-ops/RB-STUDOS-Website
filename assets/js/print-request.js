// 3D-Druck-Preisanfrage: Name/E-Mail/Nachricht + eigene 3D-Datei werden an
// den Cloudflare Worker geschickt, der sie per E-Mail an Studio RB
// weiterleitet. Der E-Mail-Versand-Key steckt nur im Worker, nie hier.

const PRINT_REQUEST_URL = "https://ai.studio-rb.net/print-request";
const PRINT_REQUEST_MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

function fileToBase64Payload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const match = /^data:(.+);base64,(.+)$/.exec(reader.result || "");
      resolve(match ? match[2] : null);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function initPrintRequestForm() {
  const form = document.getElementById("print-request-form");
  if (!form) return;

  const nameInput = document.getElementById("pr-name");
  const emailInput = document.getElementById("pr-email");
  const fileInput = document.getElementById("pr-file");
  const messageInput = document.getElementById("pr-message");
  const submitBtn = document.getElementById("pr-submit");
  const statusEl = document.getElementById("pr-status");

  function setStatus(text, isError) {
    statusEl.hidden = !text;
    statusEl.textContent = text || "";
    statusEl.classList.toggle("error", !!isError);
  }

  submitBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    const file = fileInput.files[0];

    if (!name || !email || !file) {
      setStatus("Bitte Name, E-Mail und eine Datei angeben.", true);
      return;
    }
    if (file.size > PRINT_REQUEST_MAX_FILE_SIZE) {
      setStatus("Datei ist zu groß (max. 15 MB). Bitte kleinere Datei wählen oder uns über das Kontaktformular einen Cloud-Link schicken.", true);
      return;
    }

    submitBtn.disabled = true;
    setStatus("Anfrage wird gesendet …");

    try {
      const fileBase64 = await fileToBase64Payload(file);
      const res = await fetch(PRINT_REQUEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          fileName: file.name,
          fileBase64
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Unbekannter Fehler.");
      }
      setStatus("Danke! Wir melden uns mit einem Preisangebot.");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Anfrage konnte gerade nicht gesendet werden. Bitte versuch es später erneut oder schreib uns direkt über das Kontaktformular.", true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", initPrintRequestForm);
