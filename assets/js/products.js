/* Beispiel-Produktkatalog. Bilder sind Platzhalter-SVGs, bis echte Produktfotos vorliegen. */

function woodThumb(label) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#C89666"/>
          <stop offset="1" stop-color="#9C6B3E"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#g)"/>
      <text x="200" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#3A2414">${label}</text>
    </svg>
  `);
}

const PRODUCTS = {
  keychain: {
    id: "keychain",
    name: "Schlüsselanhänger Holz",
    price: 9.9,
    desc: "Gravierter Anhänger aus Birkensperrholz, mit Name oder Spruch.",
    thumb: woodThumb("Schlüsselanhänger"),
    canvas: { width: 460, height: 320 },
    drawTemplate(ctx, w, h) {
      ctx.fillStyle = "#C89666";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, r = 110;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#D8AE7C";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.62 - 14, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "#5C3B20";
      ctx.lineWidth = 3;
      ctx.stroke();
    },
    fields: [
      { id: "text1", type: "text", label: "Name oder Spruch", maxLength: 14, x: 0.5, y: 0.5, size: 30, align: "center" }
    ]
  },

  nameplate: {
    id: "nameplate",
    name: "Namensschild Acryl",
    price: 16.5,
    desc: "Zweizeiliges Türschild aus mattem Acrylglas.",
    thumb: woodThumb("Namensschild"),
    canvas: { width: 460, height: 320 },
    drawTemplate(ctx, w, h) {
      ctx.fillStyle = "#EDEAE0";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#B8451E";
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, w - 56, h - 56);
    },
    fields: [
      { id: "text1", type: "text", label: "Name", maxLength: 20, x: 0.5, y: 0.42, size: 34, align: "center" },
      { id: "text2", type: "text", label: "Untertitel (optional)", maxLength: 26, x: 0.5, y: 0.6, size: 18, align: "center" }
    ]
  },

  photoengraving: {
    id: "photoengraving",
    name: "Foto-Gravur Holzbild",
    price: 24.0,
    desc: "Dein Foto als Gravur auf einer Holzplatte, mit optionaler Bildunterschrift.",
    thumb: woodThumb("Foto-Gravur"),
    canvas: { width: 460, height: 320 },
    drawTemplate(ctx, w, h) {
      ctx.fillStyle = "#9C6B3E";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#EDEAE0";
      ctx.fillRect(30, 24, w - 60, h - 90);
    },
    fields: [
      {
        id: "photo", type: "image", label: "Foto hochladen",
        hint: "JPG oder PNG, wird auf die Holzplatte gesetzt.",
        x: 30, y: 24, w: 400, h: 206
      },
      { id: "caption", type: "text", label: "Bildunterschrift (optional)", maxLength: 30, x: 0.5, y: 0.92, size: 18, align: "center" }
    ]
  }
};
