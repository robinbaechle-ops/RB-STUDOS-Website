/*
 * Produktkatalog.
 *
 * Einfache Produkte: über assets/data/produkte.csv (in Excel pflegbar).
 * Spalten: Artikelname, Artikelbeschreibung, Art (Laser/3D), Preis, Bildname.
 * "Bildname" ist der Ordnername unter assets/products/, mit nummerierten
 * Fotos darin (1.jpg, 2.jpg, …). Jedes einfache Produkt bekommt automatisch
 * ein zentriertes Textfeld zur Personalisierung.
 *
 * Fortgeschrittene Produkte (mehrere Textfelder, Foto-Upload-Feld) bleiben
 * unten in ADVANCED_PRODUCTS von Hand gepflegt — dafür weiterhin
 * tools/designer.html nutzen.
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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c]))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "produkt";
}

function normalizeCategory(raw) {
  const v = (raw || "").trim().toLowerCase();
  if (v.startsWith("3d")) return "3D";
  return "Laser";
}

function parsePrice(raw) {
  return parseFloat(String(raw).replace(",", ".")) || 0;
}

const ADVANCED_PRODUCTS = {
  nameplate: {
    id: "nameplate",
    name: "Namensschild Acryl",
    price: 16.5,
    desc: "Zweizeiliges Türschild aus mattem Acrylglas.",
    category: "Laser",
    folder: null,
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
    category: "Laser",
    folder: null,
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

async function buildSimpleProduct(row) {
  const name = row["Artikelname"] || "Unbenanntes Produkt";
  const id = slugify(name);
  const folder = (row["Bildname"] || "").trim() || null;
  const cover = await loadCoverImage(folder);

  return {
    id,
    name,
    price: parsePrice(row["Preis"]),
    desc: row["Artikelbeschreibung"] || "",
    category: normalizeCategory(row["Art"]),
    folder,
    image: cover,
    bgColor: "#E4DFD2",
    canvas: null, // wird beim Laden des Fotos auf dessen Maße gesetzt
    fields: [
      { id: "text1", type: "text", label: "Dein Text (optional)", maxLength: 24, x: 0.5, y: 0.5, size: 32, align: "center" }
    ]
  };
}

async function loadProducts() {
  const products = {};

  try {
    const rows = await fetchCsvRows("assets/data/produkte.csv");
    const simpleProducts = await Promise.all(rows.map(buildSimpleProduct));
    simpleProducts.forEach((p) => { products[p.id] = p; });
  } catch (err) {
    console.error("Konnte assets/data/produkte.csv nicht laden:", err);
  }

  Object.values(ADVANCED_PRODUCTS).forEach((p) => { products[p.id] = p; });

  Object.values(products).forEach((product) => {
    product.thumb = product.image || placeholderThumb(product.name);
  });

  return products;
}
