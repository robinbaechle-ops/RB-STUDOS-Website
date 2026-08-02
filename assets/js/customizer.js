const uploadedImages = {};
const backgroundCache = {};
const DEFAULT_CANVAS = { width: 460, height: 320 };

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

function renderGallery(images) {
  const gallery = document.getElementById("product-gallery");
  const main = document.getElementById("gallery-main");
  const thumbs = document.getElementById("gallery-thumbs");
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
    return;
  }

  thumbs.hidden = false;
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

  if (document.getElementById("engrave-toggle").checked) {
    applyEngravePreview(ctx, w, h);
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
  return {
    productId: product.id,
    values,
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
  document.getElementById("product-price").textContent =
    product.price.toFixed(2).replace(".", ",") + " €";

  if (!product.canvas) {
    const bgImage = await getBackground(product);
    product.canvas = bgImage
      ? { width: bgImage.width, height: bgImage.height }
      : DEFAULT_CANVAS;
  }

  const canvas = document.getElementById("preview-canvas");
  canvas.width = product.canvas.width;
  canvas.height = product.canvas.height;

  if (product.folder) {
    loadProductGallery(product.folder).then(renderGallery);
  }

  renderFields(product);
  document.fonts.ready.then(() => drawPreview(product));

  document.getElementById("generate-btn").addEventListener("click", () => drawPreview(product));
  document.getElementById("engrave-toggle").addEventListener("change", () => drawPreview(product));

  document.getElementById("order-btn").addEventListener("click", () => {
    sessionStorage.setItem("rbstudio-order", JSON.stringify(collectOrder(product)));
    window.location.href = "checkout.html";
  });
}

document.addEventListener("DOMContentLoaded", initProductPage);
