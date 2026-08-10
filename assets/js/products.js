/*
 * Produktkatalog.
 *
 * Einfache Produkte: über assets/data/produkte.csv (in Excel pflegbar).
 * Spalten: Artikelname, Artikelbeschreibung, Art (Laser/3D),
 * VK gerundet, VK 2 Stk, VK 5 Stk, VK 10 Stk, VK 25 Stk, Bildname, Bestand,
 * KI Prompt, KI Generierung, Zusatzprodukte.
 * Die VK-Spalten sind Stückpreise je Mengenstaffel — leer bleiben ist ok,
 * dann greift die nächstniedrigere Stufe. "Bestand" ist optional (z.B. bei
 * 3D-Druck-Zeilen leer lassen, wenn kein Lager geführt wird).
 * "Bildname" ist der Ordnername unter assets/products/, mit nummerierten
 * Fotos darin (1.jpg, 2.jpg, …). Jedes einfache Produkt bekommt automatisch
 * ein zentriertes Textfeld zur Personalisierung.
 * "KI Prompt" steuert die KI-Bildvorschau für dieses Produkt (z.B. "Zeige
 * das Motiv als Lasergravur auf einer hellen Holzplatte, fotorealistisch."
 * ) — leer lassen für einen generischen Standard-Prompt.
 * "KI Generierung": "Nein" eintragen für reine Kaufprodukte ohne
 * Personalisierung — dann gibt es weder Textfeld noch KI-Vorschau. Leer
 * oder "Ja" = normales personalisierbares Produkt (Standard).
 * "Zusatzprodukte": kommagetrennte Liste mit Artikelnamen (oder Links) von
 * passenden Produkten, die auf der Produktseite als "Passt dazu" angezeigt
 * werden.
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
  const n = parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const TIER_COLUMNS = [
  { qty: 1, key: "VK gerundet" },
  { qty: 2, key: "VK 2 Stk" },
  { qty: 5, key: "VK 5 Stk" },
  { qty: 10, key: "VK 10 Stk" },
  { qty: 25, key: "VK 25 Stk" }
];

function buildTiers(row) {
  const tiers = TIER_COLUMNS
    .map(({ qty, key }) => ({ qty, price: parsePrice(row[key]) }))
    .filter((tier) => tier.price !== null);
  return tiers.length ? tiers : [{ qty: 1, price: 0 }];
}

function parseStock(raw) {
  const v = String(raw || "").trim();
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// Stückpreis für eine Menge: greift immer die nächstniedrigere Staffel.
function priceForQty(product, qty) {
  let match = product.tiers[0];
  for (const tier of product.tiers) {
    if (tier.qty <= qty) match = tier;
  }
  return match.price;
}

function parseAiEnabled(raw) {
  const v = (raw || "").trim().toLowerCase();
  return v !== "nein" && v !== "no";
}

function parseRelated(raw) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Ordnet einen Zusatzprodukt-Eintrag einem bekannten Produkt zu, damit
// "Passt dazu" auf die richtige Produktseite verlinkt statt nur den
// Rohtext anzuzeigen. Erlaubte Formate: Artikelname ("Schlüsselanhänger"),
// reine URL ("https://…") oder beschriftete URL ("USB Adapter: https://…").
function resolveRelatedLink(entry, products) {
  const urlMatch = /(https?:\/\/\S+)/i.exec(entry);
  if (urlMatch) {
    const url = urlMatch[1];
    const label = entry.slice(0, urlMatch.index).replace(/:\s*$/, "").trim();
    return { href: url, label: label || url };
  }

  const product = products[slugify(entry)];
  if (product) {
    return { href: `product.html?product=${product.id}`, label: product.name };
  }
  return { href: null, label: entry };
}

// Produkte mit mehreren Feldern / Foto-Upload: hier per Hand eintragen,
// am einfachsten per tools/designer.html erzeugen und einfügen.
const ADVANCED_PRODUCTS = {};

async function buildSimpleProduct(row) {
  const name = row["Artikelname"] || "Unbenanntes Produkt";
  const id = slugify(name);
  const folder = (row["Bildname"] || "").trim() || null;
  const cover = await loadCoverImage(folder);
  const tiers = buildTiers(row);
  const aiEnabled = parseAiEnabled(row["KI Generierung"]);

  return {
    id,
    name,
    tiers,
    price: tiers[0].price,
    stock: parseStock(row["Bestand"]),
    desc: row["Artikelbeschreibung"] || "",
    category: normalizeCategory(row["Art"]),
    aiPrompt: (row["KI Prompt"] || "").trim() || null,
    aiEnabled,
    relatedRaw: parseRelated(row["Zusatzprodukte"]),
    folder,
    image: cover,
    bgColor: "#E4DFD2",
    canvas: null, // wird beim Laden des Fotos auf dessen Maße gesetzt
    fields: aiEnabled
      ? [{ id: "text1", type: "text", label: "Dein Text (optional)", maxLength: 24, x: 0.5, y: 0.5, size: 32, align: "center" }]
      : []
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
    if (!product.tiers) product.tiers = [{ qty: 1, price: product.price }];
    if (product.stock === undefined) product.stock = null;
    if (product.aiEnabled === undefined) product.aiEnabled = true;
    product.related = (product.relatedRaw || []).map((entry) => resolveRelatedLink(entry, products));
  });

  return products;
}
