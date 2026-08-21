const uploadedImages = {};
const backgroundCache = {};
const DEFAULT_CANVAS = { width: 480, height: 360 };

async function getProductFromUrl() {
  const id = new URLSearchParams(window.location.search).get("product");
  const products = await loadProducts();
  return products[id] || null;
}

function loadImageSrc(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

async function getBackground(product) {
  if (!product.image) return null;
  if (!backgroundCache[product.id]) {
    backgroundCache[product.id] = await loadImageSrc(product.image);
  }
  return backgroundCache[product.id];
}

function drawBackground(ctx, w, h, product, bgImage) {
  if (bgImage) {
    const scale = Math.max(w / bgImage.width, h / bgImage.height);
    const sw = w / scale, sh = h / scale;
    const sx = (bgImage.width - sw) / 2, sy = (bgImage.height - sh) / 2;
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.fillStyle = product.bgColor || "#E4DFD2";
    ctx.fillRect(0, 0, w, h);
  }
}

function renderGallery(images, aiEnabled) {
  const gallery = document.getElementById("product-gallery");
  const main = document.getElementById("gallery-main");
  const thumbs = document.getElementById("gallery-thumbs");
  const hint = document.getElementById("gallery-hint");
  if (!gallery) return;

  if (!images.length) {
    gallery.hidden = true;
    return;
  }

  gallery.hidden = false;
  main.src = images[0];
  main.alt = "";
  thumbs.innerHTML = "";

  if (images.length === 1) {
    thumbs.hidden = true;
    if (hint) hint.hidden = true;
    return;
  }

  thumbs.hidden = false;
  if (hint) hint.hidden = !aiEnabled;
  images.forEach((src, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery-thumb" + (i === 0 ? " active" : "");
    btn.innerHTML = `<img src="${src}" alt="">`;
    btn.addEventListener("click", () => {
      main.src = src;
      thumbs.querySelectorAll(".gallery-thumb").forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
    });
    thumbs.appendChild(btn);
  });
}

// Liefert das aktuell in der Galerie ausgewählte Foto (Motiv), das die
// KI-Vorschau als Ausgangspunkt nutzen soll — oder null, wenn keine Galerie
// vorhanden ist (dann greift in ai-preview.js der Fallback product.image).
function getSelectedGalleryImage() {
  const gallery = document.getElementById("product-gallery");
  const main = document.getElementById("gallery-main");
  if (!gallery || gallery.hidden || !main) return null;
  return main.getAttribute("src") || null;
}

function renderTierTable(product) {
  const table = document.getElementById("tier-table");
  if (!table) return;
  if (product.tiers.length <= 1) {
    table.hidden = true;
    return;
  }
  table.hidden = false;
  table.innerHTML = product.tiers.map((tier) => `
    <li><span>${tier.qty === 1 ? "1 Stück" : tier.qty + " Stück"}</span><span>${tier.price.toFixed(2).replace(".", ",")} € / Stück</span></li>
  `).join("");
}

function renderStockNote(product) {
  const note = document.getElementById("stock-note");
  const qtyInput = document.getElementById("qty");
  if (!note || !qtyInput) return;

  if (product.stock === null) {
    note.hidden = true;
    return;
  }

  note.hidden = false;
  if (product.stock > 0) {
    note.textContent = `Kurzfristig verfügbar: ${product.stock} Stück`;
    note.classList.remove("out");
    qtyInput.max = String(product.stock);
  } else {
    note.textContent = "Aktuell ausverkauft — melde dich gerne über die Kontaktseite.";
    note.classList.add("out");
    qtyInput.max = "1";
  }
}

function renderRelated(product) {
  const section = document.getElementById("related-products");
  const list = document.getElementById("related-list");
  if (!section || !list) return;

  if (!product.related || !product.related.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  list.innerHTML = product.related
    .map((r) => {
      if (!r.href) return `<li>${r.label}</li>`;
      const attrs = r.external ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `<li><a href="${r.href}"${attrs}>${r.label}</a></li>`;
    })
    .join("");
}

function currentQty() {
  const qtyInput = document.getElementById("qty");
  const qty = parseInt(qtyInput.value, 10);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function updatePriceDisplay(product) {
  const qty = currentQty();
  const unitPrice = priceForQty(product, qty);
  const priceEl = document.getElementById("product-price");
  if (qty > 1) {
    const total = unitPrice * qty;
    priceEl.textContent = `${unitPrice.toFixed(2).replace(".", ",")} € / Stück · Gesamt ${total.toFixed(2).replace(".", ",")} €`;
  } else {
    priceEl.textContent = `${unitPrice.toFixed(2).replace(".", ",")} €`;
  }
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

async function drawPreview(product) {
  const canvas = document.getElementById("preview-canvas");
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = product.canvas;
  const bgImage = await getBackground(product);

  ctx.clearRect(0, 0, w, h);
  drawBackground(ctx, w, h, product, bgImage);

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
}

function collectOrder(product) {
  const values = {};
  for (const field of product.fields) {
    if (field.type === "text") {
      values[field.id] = document.getElementById(field.id).value.trim();
    } else if (field.type === "image") {
      const img = uploadedImages[field.id];
      values[field.id] = img ? img.src : null;
    }
  }
  const qty = currentQty();
  const unitPrice = priceForQty(product, qty);
  return {
    productId: product.id,
    values,
    qty,
    unitPrice,
    totalPrice: unitPrice * qty,
    aiPreviewImage: getConfirmedAiPreview(),
    createdAt: Date.now()
  };
}

async function initProductPage() {
  const product = await getProductFromUrl();
  const notFound = document.getElementById("not-found");
  const layout = document.getElementById("product-layout");

  if (!product) {
    notFound.hidden = false;
    layout.hidden = true;
    return;
  }

  document.title = `${product.name} individualisieren`;
  document.getElementById("product-name").textContent = product.name;
  const descEl = document.getElementById("product-desc");
  if (product.desc) {
    descEl.textContent = product.desc;
    descEl.hidden = false;
  }
  renderTierTable(product);
  renderStockNote(product);
  updatePriceDisplay(product);
  document.getElementById("qty").addEventListener("input", () => updatePriceDisplay(product));

  if (product.folder) {
    loadProductGallery(product.folder).then((images) => renderGallery(images, product.aiEnabled));
  }

  renderFields(product);
  renderRelated(product);

  if (product.aiEnabled) {
    // Vorschau-Panel bleibt zunächst leer: ein generisches Text-Overlay auf
    // dem Referenzfoto würde bei den meisten Produkten (Position, Schriftart,
    // Layout des echten Motivs) ohnehin nicht zum tatsächlichen Design
    // passen. Es zeigt erst etwas, sobald eine KI-Vorschau erzeugt wurde
    // (siehe ai-preview.js).
    initAiPreview(product);
  } else {
    document.getElementById("ai-preview").hidden = true;

    // Fester 4:3-Rahmen — drawBackground() croppt jedes Foto per "cover"
    // hinein, egal welches Seitenverhältnis das Original hat.
    if (!product.canvas) {
      product.canvas = DEFAULT_CANVAS;
    }
    const canvas = document.getElementById("preview-canvas");
    canvas.width = product.canvas.width;
    canvas.height = product.canvas.height;
    canvas.hidden = false;
    document.getElementById("preview-panel").hidden = false;
    document.fonts.ready.then(() => drawPreview(product));
  }

  document.getElementById("order-btn").addEventListener("click", () => {
    sessionStorage.setItem("rbstudio-order", JSON.stringify(collectOrder(product)));
    window.location.href = "checkout.html";
  });
}

document.addEventListener("DOMContentLoaded", initProductPage);
