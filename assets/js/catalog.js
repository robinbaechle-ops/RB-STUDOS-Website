function renderCatalog() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  Object.values(PRODUCTS).forEach((product) => {
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
