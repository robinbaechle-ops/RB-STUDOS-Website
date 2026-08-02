/*
 * Eine statische Website kann keinen Ordnerinhalt auflisten. Deshalb werden
 * Produktfotos nach Konvention durchnummeriert (1.jpg, 2.jpg, …) und hier
 * einfach der Reihe nach ausprobiert, bis eine Nummer fehlschlägt.
 */

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_GALLERY_IMAGES = 12;

function probeImage(folder, index) {
  return new Promise((resolve) => {
    let i = 0;
    function tryNext() {
      if (i >= IMAGE_EXTENSIONS.length) {
        resolve(null);
        return;
      }
      const src = `assets/products/${folder}/${index}.${IMAGE_EXTENSIONS[i]}`;
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => {
        i++;
        tryNext();
      };
      img.src = src;
    }
    tryNext();
  });
}

async function loadProductGallery(folder) {
  if (!folder) return [];
  const slots = [];
  for (let i = 1; i <= MAX_GALLERY_IMAGES; i++) {
    slots.push(probeImage(folder, i));
  }
  const results = await Promise.all(slots);
  return results.filter(Boolean);
}

async function loadCoverImage(folder) {
  if (!folder) return null;
  return probeImage(folder, 1);
}
