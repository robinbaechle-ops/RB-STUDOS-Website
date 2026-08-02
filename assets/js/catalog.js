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
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img class="thumb" src="${product.thumb}" alt="${product.name}">
      <div class="body">
        <h2>${product.name}</h2>
        <p class="price">${product.price.toFixed(2).replace(".", ",")} €</p>
        <p class="desc">${product.desc}</p>
        <a class="btn" href="product.html?product=${product.id}">Nun individualisieren</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", renderCatalog);
