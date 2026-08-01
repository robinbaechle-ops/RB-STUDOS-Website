const uploadedImages = {};

function getProductFromUrl() {
  const id = new URLSearchParams(window.location.search).get("product");
  return PRODUCTS[id] || null;
}

function renderFields(product) {
  const container = document.getElementById("fields");
  product.fields.forEach((field) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    if (field.type === "text") {
      wrap.innerHTML = `
        <label for="${field.id}">${field.label}</label>
        <input type="text" id="${field.id}" maxlength="${field.maxLength}" placeholder="${field.label}">
      `;
    } else if (field.type === "image") {
      wrap.innerHTML = `
        <label for="${field.id}">${field.label}</label>
        <input type="file" id="${field.id}" accept="image/png, image/jpeg">
        ${field.hint ? `<span class="hint">${field.hint}</span>` : ""}
      `;
    }

    container.appendChild(wrap);
  });
}

function loadImageField(field) {
  return new Promise((resolve) => {
    const input = document.getElementById(field.id);
    const file = input.files[0];
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function drawText(ctx, field, value, w, h) {
  if (!value) return;
  ctx.fillStyle = "#1A1815";
  ctx.font = `600 ${field.size}px Fraunces, Georgia, serif`;
  ctx.textAlign = field.align;
  ctx.textBaseline = "middle";
  ctx.fillText(value, field.x * w, field.y * h);
}

function applyEngravePreview(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    const value = gray > 150 ? 235 : 30;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
}

async function drawPreview(product) {
  const canvas = document.getElementById("preview-canvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = product.canvas;

  ctx.clearRect(0, 0, w, h);
  product.drawTemplate(ctx, w, h);

  for (const field of product.fields) {
    if (field.type === "text") {
      const value = document.getElementById(field.id).value.trim();
      drawText(ctx, field, value, w, h);
    } else if (field.type === "image") {
      const img = await loadImageField(field);
      if (img) {
        uploadedImages[field.id] = img;
      }
      const toDraw = uploadedImages[field.id];
      if (toDraw) {
        ctx.drawImage(toDraw, field.x, field.y, field.w, field.h);
      }
    }
  }

  if (document.getElementById("engrave-toggle").checked) {
    applyEngravePreview(ctx, w, h);
  }
}

function initProductPage() {
  const product = getProductFromUrl();
  const notFound = document.getElementById("not-found");
  const layout = document.getElementById("product-layout");

  if (!product) {
    notFound.hidden = false;
    layout.hidden = true;
    return;
  }

  document.title = `${product.name} individualisieren`;
  document.getElementById("product-name").textContent = product.name;
  document.getElementById("product-price").textContent =
    product.price.toFixed(2).replace(".", ",") + " €";

  const canvas = document.getElementById("preview-canvas");
  canvas.width = product.canvas.width;
  canvas.height = product.canvas.height;

  renderFields(product);
  document.fonts.ready.then(() => drawPreview(product));

  document.getElementById("generate-btn").addEventListener("click", () => drawPreview(product));
  document.getElementById("engrave-toggle").addEventListener("change", () => drawPreview(product));
}

document.addEventListener("DOMContentLoaded", initProductPage);
