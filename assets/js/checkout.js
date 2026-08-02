function renderOrderValues(product, values) {
  const list = document.getElementById("order-values");
  product.fields.forEach((field) => {
    const li = document.createElement("li");
    const value = values[field.id];

    if (field.type === "image") {
      if (value) {
        li.innerHTML = `<strong>${field.label}:</strong><br><img class="order-thumb" src="${value}" alt="${field.label}">`;
      } else {
        li.innerHTML = `<strong>${field.label}:</strong> kein Foto hochgeladen`;
      }
    } else {
      li.innerHTML = `<strong>${field.label}:</strong> ${value ? value : "(leer)"}`;
    }

    list.appendChild(li);
  });
}

async function initCheckout() {
  const raw = sessionStorage.getItem("rbstudio-order");
  const order = raw ? JSON.parse(raw) : null;
  const products = await loadProducts();
  const product = order ? products[order.productId] : null;

  if (!order || !product) {
    document.getElementById("empty-state").hidden = false;
    return;
  }

  document.getElementById("order-summary").hidden = false;
  document.getElementById("order-product").textContent = product.name;
  document.getElementById("order-price").textContent =
    product.price.toFixed(2).replace(".", ",") + " €";
  renderOrderValues(product, order.values);

  document.getElementById("submit-order-btn").addEventListener("click", () => {
    sessionStorage.removeItem("rbstudio-order");
    document.getElementById("order-summary").hidden = true;
    document.getElementById("order-confirmation").hidden = false;
  });
}

document.addEventListener("DOMContentLoaded", initCheckout);
