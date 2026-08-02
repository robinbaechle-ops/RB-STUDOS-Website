const state = {
  file: null,
  img: null,
  naturalW: 460,
  naturalH: 320,
  fields: [],
  armedIndex: null,
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c]))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "produkt";
}

function fileExtension(file) {
  if (file.type === "image/png") return "png";
  return "jpg";
}

function canvasPointFromEvent(evt) {
  const canvas = document.getElementById("designer-canvas");
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

function addField(type) {
  const textCount = state.fields.filter((f) => f.type === "text").length;
  const imageCount = state.fields.filter((f) => f.type === "image").length;

  if (type === "text") {
    state.fields.push({
      type: "text",
      id: `text${textCount + 1}`,
      label: "Neues Textfeld",
      maxLength: 20,
      size: Math.round(state.naturalH * 0.09),
      align: "center",
      x: 0.5,
      y: 0.5,
    });
  } else {
    state.fields.push({
      type: "image",
      id: imageCount === 0 ? "photo" : `photo${imageCount + 1}`,
      label: "Neues Foto-Feld",
      hint: "",
      x: Math.round(state.naturalW * 0.15),
      y: Math.round(state.naturalH * 0.15),
      w: Math.round(state.naturalW * 0.7),
      h: Math.round(state.naturalH * 0.6),
    });
  }
  renderFieldsList();
  redraw();
}

function removeField(index) {
  state.fields.splice(index, 1);
  if (state.armedIndex === index) state.armedIndex = null;
  renderFieldsList();
  redraw();
}

function armField(index) {
  state.armedIndex = state.armedIndex === index ? null : index;
  updateHint();
  renderFieldsList();
}

function updateHint() {
  const hint = document.getElementById("designer-hint");
  if (state.armedIndex !== null) {
    hint.textContent = `Klicke auf das Foto, um „${state.fields[state.armedIndex].label}“ zu platzieren.`;
    hint.classList.add("armed");
  } else {
    hint.textContent = "Foto hochladen, dann unten Felder hinzufügen und auf dem Foto platzieren.";
    hint.classList.remove("armed");
  }
}

function renderFieldsList() {
  const list = document.getElementById("fields-list");
  list.innerHTML = "";

  state.fields.forEach((field, index) => {
    const card = document.createElement("div");
    card.className = "field-card";

    const labelRow = document.createElement("div");
    labelRow.className = "field";
    labelRow.innerHTML = `<label>Label</label><input type="text" data-role="label" value="${field.label}">`;

    card.appendChild(labelRow);

    if (field.type === "text") {
      const row = document.createElement("div");
      row.className = "row3";
      row.innerHTML = `
        <div class="field"><label>Maxlänge</label><input type="text" data-role="maxLength" value="${field.maxLength}"></div>
        <div class="field"><label>Schriftgröße</label><input type="text" data-role="size" value="${field.size}"></div>
        <div class="field"><label>Ausrichtung</label>
          <select data-role="align">
            <option value="left" ${field.align === "left" ? "selected" : ""}>Links</option>
            <option value="center" ${field.align === "center" ? "selected" : ""}>Mitte</option>
            <option value="right" ${field.align === "right" ? "selected" : ""}>Rechts</option>
          </select>
        </div>
      `;
      card.appendChild(row);
    } else {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div class="field"><label>Breite (px)</label><input type="text" data-role="w" value="${field.w}"></div>
        <div class="field"><label>Höhe (px)</label><input type="text" data-role="h" value="${field.h}"></div>
      `;
      card.appendChild(row);
      const hintRow = document.createElement("div");
      hintRow.className = "field";
      hintRow.innerHTML = `<label>Hinweistext (optional)</label><input type="text" data-role="hint" value="${field.hint}">`;
      card.appendChild(hintRow);
    }

    const actions = document.createElement("div");
    actions.className = "field-actions";
    const placeBtn = document.createElement("button");
    placeBtn.type = "button";
    placeBtn.className = "btn small";
    placeBtn.textContent = state.armedIndex === index ? "Klicke auf das Foto…" : "Auf Foto platzieren";
    placeBtn.addEventListener("click", () => armField(index));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn small danger";
    removeBtn.textContent = "Entfernen";
    removeBtn.addEventListener("click", () => removeField(index));

    actions.appendChild(placeBtn);
    actions.appendChild(removeBtn);
    card.appendChild(actions);

    card.querySelectorAll("[data-role]").forEach((input) => {
      input.addEventListener("input", () => {
        const role = input.dataset.role;
        const numeric = ["maxLength", "size", "w", "h"];
        field[role] = numeric.includes(role) ? Number(input.value) || 0 : input.value;
        redraw();
      });
    });

    list.appendChild(card);
  });
}

function redraw() {
  const canvas = document.getElementById("designer-canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  if (state.img) {
    ctx.drawImage(state.img, 0, 0, w, h);
  } else {
    ctx.fillStyle = "#E4DFD2";
    ctx.fillRect(0, 0, w, h);
  }

  state.fields.forEach((field, index) => {
    const active = index === state.armedIndex;
    ctx.strokeStyle = active ? "#B3492A" : "rgba(46,45,42,0.7)";
    ctx.fillStyle = active ? "#B3492A" : "rgba(46,45,42,0.85)";
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.setLineDash([6, 4]);

    if (field.type === "text") {
      const x = field.x * w, y = field.y * h;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
      ctx.font = `600 ${field.size}px Fraunces, Georgia, serif`;
      ctx.textAlign = field.align;
      ctx.textBaseline = "middle";
      ctx.fillText(field.label, x, y);
    } else {
      ctx.strokeRect(field.x, field.y, field.w, field.h);
      ctx.setLineDash([]);
      ctx.font = "600 14px Archivo, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(field.label, field.x + 8, field.y + 8);
    }
    ctx.setLineDash([]);
  });
}

function generateCode() {
  const name = document.getElementById("p-name").value.trim() || "Neues Produkt";
  const price = parseFloat(document.getElementById("p-price").value.replace(",", ".")) || 0;
  const desc = document.getElementById("p-desc").value.trim();
  const slug = slugify(name);
  const ext = state.file ? fileExtension(state.file) : "jpg";
  const imagePath = state.file ? `assets/products/${slug}.${ext}` : "null";

  const fieldsText = state.fields
    .map((f) => {
      if (f.type === "text") {
        return `      { id: "${f.id}", type: "text", label: "${f.label}", maxLength: ${f.maxLength}, x: ${f.x.toFixed(2)}, y: ${f.y.toFixed(2)}, size: ${f.size}, align: "${f.align}" }`;
      }
      return `      { id: "${f.id}", type: "image", label: "${f.label}", hint: "${f.hint || ""}", x: ${Math.round(f.x)}, y: ${Math.round(f.y)}, w: ${Math.round(f.w)}, h: ${Math.round(f.h)} }`;
    })
    .join(",\n");

  const category = document.getElementById("p-category").value;

  const code = `  ${slug}: {
    id: "${slug}",
    name: "${name}",
    price: ${price},
    desc: "${desc}",
    category: "${category}",
    folder: null,
    image: ${imagePath === "null" ? "null" : `"${imagePath}"`},
    bgColor: "#E4DFD2",
    canvas: { width: ${state.naturalW}, height: ${state.naturalH} },
    fields: [
${fieldsText}
    ]
  },`;

  document.getElementById("code-output").value = code;
}

function init() {
  const canvas = document.getElementById("designer-canvas");

  document.getElementById("photo-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.file = file;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.img = img;
        state.naturalW = img.naturalWidth;
        state.naturalH = img.naturalHeight;
        canvas.width = state.naturalW;
        canvas.height = state.naturalH;
        redraw();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  canvas.addEventListener("click", (evt) => {
    if (state.armedIndex === null) return;
    const point = canvasPointFromEvent(evt);
    const field = state.fields[state.armedIndex];
    if (field.type === "text") {
      field.x = Math.min(1, Math.max(0, point.x / canvas.width));
      field.y = Math.min(1, Math.max(0, point.y / canvas.height));
    } else {
      field.x = Math.round(point.x);
      field.y = Math.round(point.y);
    }
    state.armedIndex = null;
    updateHint();
    renderFieldsList();
    redraw();
  });

  document.getElementById("add-text-field").addEventListener("click", () => addField("text"));
  document.getElementById("add-image-field").addEventListener("click", () => addField("image"));
  document.getElementById("generate-code-btn").addEventListener("click", generateCode);

  document.getElementById("copy-code-btn").addEventListener("click", () => {
    const output = document.getElementById("code-output");
    output.select();
    navigator.clipboard.writeText(output.value);
  });

  document.getElementById("download-photo-btn").addEventListener("click", () => {
    if (!state.file) {
      alert("Bitte zuerst ein Foto hochladen.");
      return;
    }
    const name = document.getElementById("p-name").value.trim() || "produkt";
    const slug = slugify(name);
    const ext = fileExtension(state.file);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(state.file);
    a.download = `${slug}.${ext}`;
    a.click();
  });

  redraw();
}

document.addEventListener("DOMContentLoaded", init);
