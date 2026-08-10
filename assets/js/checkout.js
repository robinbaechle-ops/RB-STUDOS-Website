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

  const qty = order.qty || 1;
  const unitPrice = order.unitPrice !== undefined ? order.unitPrice : product.price;
  const totalPrice = order.totalPrice !== undefined ? order.totalPrice : unitPrice * qty;

  document.getElementById("order-summary").hidden = false;
  document.getElementById("order-product").textContent = `${product.name} (${qty} Stück)`;
  document.getElementById("order-price").textContent = qty > 1
    ? `${qty} × ${unitPrice.toFixed(2).replace(".", ",")} € = ${totalPrice.toFixed(2).replace(".", ",")} €`
    : `${totalPrice.toFixed(2).replace(".", ",")} €`;
  renderOrderValues(product, order.values);

  document.getElementById("submit-order-btn").addEventListener("click", () => {
    sessionStorage.removeItem("rbstudio-order");
    document.getElementById("order-summary").hidden = true;
    document.getElementById("order-confirmation").hidden = false;
  });
}

document.addEventListener("DOMContentLoaded", initCheckout);
