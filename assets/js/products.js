/*
 * Produktkatalog — reine Daten, kein Zeichencode.
 *
 * Ein Produkt hinzufügen:
 *   1. Foto nach assets/products/<id>.jpg legen (oder das Tool unter tools/designer.html nutzen).
 *   2. Einen neuen Eintrag unten ergänzen: image auf den Fotopfad setzen,
 *      canvas.width/height auf die Bildmaße, fields auf die Text-/Foto-Positionen.
 *   3. Ohne eigenes Foto bleibt "image: null" — dann wird ein Platzhalter gezeichnet.
 */

function placeholderThumb(label) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="320">
      <rect width="400" height="320" fill="#E4DFD2"/>
      <circle cx="200" cy="150" r="72" fill="none" stroke="#B3492A" stroke-width="1.5"/>
      <text x="200" y="248" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="600" font-size="12" letter-spacing="2" fill="#6E6A62">${label.toUpperCase()}</text>
    </svg>
  `);
}

const PRODUCTS = {
  keychain: {
    id: "keychain",
    name: "Schlüsselanhänger Holz",
    price: 9.9,
    desc: "Gravierter Anhänger aus Birkensperrholz, mit Name oder Spruch.",
    image: null,
    bgColor: "#E4DFD2",
    canvas: { width: 460, height: 320 },
    fields: [
      { id: "text1", type: "text", label: "Name oder Spruch", maxLength: 14, x: 0.5, y: 0.5, size: 30, align: "center" }
    ]
  },

  nameplate: {
    id: "nameplate",
    name: "Namensschild Acryl",
    price: 16.5,
    desc: "Zweizeiliges Türschild aus mattem Acrylglas.",
    image: null,
    bgColor: "#F4F1E8",
    canvas: { width: 460, height: 320 },
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
    image: null,
    bgColor: "#E4DFD2",
    canvas: { width: 460, height: 320 },
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

Object.values(PRODUCTS).forEach((product) => {
  product.thumb = product.image || placeholderThumb(product.name);
});
