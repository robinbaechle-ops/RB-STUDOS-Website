async function renderCatalog() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const category = grid.dataset.category || null;
  const products = await loadProducts();
  const list = Object.values(products).filter((p) => !category || p.category === category);

  if (list.length === 0) {
    grid.innerHTML = `<p class="empty-catalog">Noch keine Produkte in dieser Kategorie.</p>`;
    return;
  }

  list.forEach((product) => {
    const priceLabel = product.tiers.length > 1
      ? `ab ${product.price.toFixed(2).replace(".", ",")} €`
      : `${product.price.toFixed(2).replace(".", ",")} €`;

    let stockLabel = "";
    if (product.stock !== null) {
      stockLabel = product.stock > 0
        ? `<p class="stock">Kurzfristig verfügbar: ${product.stock} Stück</p>`
        : `<p class="stock out">Aktuell ausverkauft</p>`;
    }

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <a href="product.html?product=${product.id}">
        <img class="thumb" src="${product.thumb}" alt="${product.name}">
      </a>
      <div class="body">
        <h2>${product.name}</h2>
        <p class="price">${priceLabel}</p>
        ${stockLabel}
        <p class="desc">${product.desc}</p>
        <a class="btn" href="product.html?product=${product.id}">Nun individualisieren</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", renderCatalog);
