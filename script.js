// ==============================
// MIGA — CONFIG
// ==============================

// Después de publicar tu Google Apps Script como Web App,
// pega aquí la URL que termina en /exec.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZWfhsp3fkjfSLsQOeg6RtlQvxuOAX01GP71soGuEuWDbvBbmKv2vd_gbMZ1DbbwhDKw/exec";

// No se muestra visualmente en la página.
// México: 52 + número de 10 dígitos.
const WHATSAPP_NUMBER = "525555074733";

const INSTAGRAM_URL =
  "https://www.instagram.com/eatmiga_?stkn=MWZ0bTRjdzI2N3cxbA%3D%3D&utm_source=qr";

// ==============================
// PRODUCTOS REALES
// ==============================
const products = [
  {
    id: "macadamia-cranberry",
    name: "Macadamia & Cranberry",
    description: "Galleta de macadamia con arándanos.",
    image: "images/macadamia-cranberry.webp",
    seasonal: false
  },
  {
    id: "apple-cheesecake",
    name: "Apple Cheesecake",
    description: "Galleta de manzana y canela con relleno de queso crema.",
    image: "images/apple-cheesecake.webp",
    seasonal: false
  },
  {
    id: "honey-walnut",
    name: "Honey Walnut",
    description: "Galleta de nuez con miel.",
    image: "images/honey-walnut.webp",
    seasonal: false
  },
  {
    id: "coconut",
    name: "Coconut",
    description: "Galleta de coco.",
    image: "images/coconut.webp",
    seasonal: false
  },
  {
    id: "chocolate-pb",
    name: "Chocolate + Peanut Butter",
    description:
      "Galleta de chocolate con chispas de chocolate blanco y semiamargo, rellena de peanut butter.",
    image: "images/chocolate-pb.webp",
    seasonal: false
  },
  {
    id: "pistachio-blanco",
    name: "Pistachio Blanco",
    description: "Pistache con chocolate blanco.",
    image: "images/pistachio-blanco.webp",
    seasonal: true
  },
  {
    id: "arroz-con-leche",
    name: "Arroz con Leche",
    description: "Arroz, leche y canela.",
    image: "images/arroz-con-leche.webp",
    seasonal: true
  }
];

let cart = JSON.parse(localStorage.getItem("migaCart") || "{}");
let lastOrder = null;

// ==============================
// PRECIO POR CANTIDAD
// ==============================
function unitPriceFor(quantity) {
	//Nuevos precios Miga
  if (quantity >= 4) return 30; //A partir de 4 galletas

  return 35; //1 a 3 galletas
}

function totalPieces() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

function getProduct(productId) {
  return products.find(product => product.id === productId);
}

// ==============================
// PRODUCT CARDS
// ==============================
function productCard(product) {
  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.seasonal ? '<span class="product-badge">seasonal</span>' : ""}
      </div>

      <h3>${product.name}</h3>
      <p class="product-description">${product.description}</p>

      <div class="product-actions">
        <span class="product-price">desde $30 c/u</span>
        <button class="add-button" type="button" data-add="${product.id}">
          + agregar
        </button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const regular = products.filter(product => !product.seasonal);
  const seasonal = products.filter(product => product.seasonal);

  document.getElementById("regularProducts").innerHTML =
    regular.map(productCard).join("");

  document.getElementById("seasonalProducts").innerHTML =
    seasonal.map(productCard).join("");
}

// ==============================
// CART
// ==============================
function saveCart() {
  localStorage.setItem("migaCart", JSON.stringify(cart));
}

function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart();
  renderCart();
  openCart();
}

function changeQuantity(productId, delta) {
  const next = (cart[productId] || 0) + delta;

  if (next <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = next;
  }

  saveCart();
  renderCart();
}

function cartItemsArray() {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({
      ...getProduct(id),
      qty
    }));
}

function renderCart() {
  const items = cartItemsArray();
  const pieces = totalPieces();
  const priceEach = pieces ? unitPriceFor(pieces) : 0;
  const total = pieces * priceEach;

  document.getElementById("cartCount").textContent = pieces;
  document.getElementById("cartTotal").textContent = money(total);

  const cartItems = document.getElementById("cartItems");

  if (!items.length) {
    cartItems.innerHTML = `
      <p class="empty-cart">tu bag está esperando migas.</p>
    `;
    document.getElementById("cartPriceNote").textContent =
      "Agrega sabores para calcular tu precio.";
  } else {
    cartItems.innerHTML = items
      .map(
        item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">

            <div>
              <h4>${item.name}</h4>
              <div class="qty-controls">
                <button type="button" data-minus="${item.id}">−</button>
                <span>${item.qty}</span>
                <button type="button" data-plus="${item.id}">+</button>
              </div>
            </div>

            <div class="cart-item-price">
              ${money(item.qty * priceEach)}
            </div>
          </div>
        `
      )
      .join("");

    let tierText = `${pieces} ${pieces === 1 ? "miga" : "migas"} · ${money(
      priceEach
    )} c/u`;
	
	if (pieces < 4) {
  tierText += ` · agrega ${4 - pieces} para bajar a $30 c/u`;
} else {
  tierText += " · mejor precio aplicado";
}

    document.getElementById("cartPriceNote").textContent = tierText;
  }

  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const items = cartItemsArray();
  const pieces = totalPieces();
  const priceEach = pieces ? unitPriceFor(pieces) : 0;
  const total = pieces * priceEach;
  const summary = document.getElementById("checkoutSummary");

  if (!items.length) {
    summary.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  summary.innerHTML = `
    ${items
      .map(
        item => `
          <div class="summary-line">
            <span>${item.qty} × ${item.name}</span>
            <strong>${money(item.qty * priceEach)}</strong>
          </div>
        `
      )
      .join("")}

    <div class="summary-line">
      <span>Precio aplicado</span>
      <strong>${money(priceEach)} c/u</strong>
    </div>

    <div class="summary-line summary-total">
      <span>Total</span>
      <strong>${money(total)}</strong>
    </div>
  `;
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "false");
  document.getElementById("drawerOverlay").hidden = false;
  document.body.classList.add("drawer-open");
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "true");
  document.getElementById("drawerOverlay").hidden = true;
  document.body.classList.remove("drawer-open");
}

// ==============================
// DELIVERY RULES
// ==============================
function minimumDeliveryDate() {
  const min = new Date();
  min.setHours(min.getHours() + 48);

  const yyyy = min.getFullYear();
  const mm = String(min.getMonth() + 1).padStart(2, "0");
  const dd = String(min.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function isMigaDeliveryDay(dateString) {
  if (!dateString) return false;

  const date = parseLocalDate(dateString);
  const day = date.getDay();

  // 0 = domingo, 3 = miércoles, 6 = sábado
  return day === 0 || day === 3 || day === 6;
}

function updateDeliveryOptions() {
  const dateInput = document.getElementById("deliveryDate");
  const date = dateInput.value;
  const migaRadio = document.getElementById("migaDelivery");
  const uberRadio = document.getElementById("uberDelivery");
  const message = document.getElementById("deliveryMessage");

  if (!date) {
    migaRadio.disabled = false;
    message.hidden = true;
    return;
  }

  if (isMigaDeliveryDay(date)) {
    migaRadio.disabled = false;
    message.hidden = false;
    message.textContent =
      "Esta fecha puede aplicar para entrega Miga sin costo, sujeto a confirmación.";
  } else {
    migaRadio.disabled = true;

    if (migaRadio.checked) {
      migaRadio.checked = false;
      uberRadio.checked = true;
    }

    message.hidden = false;
    message.textContent =
      "Para esta fecha, la opción disponible es Uber con costo por confirmar.";
  }
}

// ==============================
// ORDER
// ==============================
function makeOrderId() {
  const number = Math.floor(1000 + Math.random() * 9000);
  return `MIGA-${number}`;
}


function getSelectedDeliveryMethod() {
  const selected = document.querySelector(
    'input[name="deliveryMethod"]:checked'
  );

  return selected ? selected.value : "";
}

function buildOrderData() {
  const items = cartItemsArray();
  const pieces = totalPieces();
  const priceEach = unitPriceFor(pieces);
  const total = pieces * priceEach;

  return {
    orderId: "",
    createdAt: new Date().toISOString(),
    customerName: document.getElementById("customerName").value.trim(),
    customerPhone: document.getElementById("customerPhone").value.trim(),
    customerInstagram: document
      .getElementById("customerInstagram")
      .value.trim(),
    deliveryDate: document.getElementById("deliveryDate").value,
    deliveryMethod: getSelectedDeliveryMethod(),
    paymentMethod: document.getElementById("paymentMethod").value,
    notes: document.getElementById("orderNotes").value.trim(),
    pieces,
    unitPrice: priceEach,
    total,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty
    }))
  };
}

function validateOrder(order) {
  if (!order.items.length) {
    alert("Agrega al menos una miga antes de enviar tu pedido.");
    return false;
  }

  if (!order.customerName || !order.customerPhone) {
    alert("Completa tu nombre y WhatsApp.");
    return false;
  }

  const phoneDigits = order.customerPhone.replace(/\D/g, "");

  if (phoneDigits.length < 10) {
    alert("Revisa tu número de WhatsApp.");
    return false;
  }

  if (!order.deliveryDate || !order.deliveryMethod || !order.paymentMethod) {
    alert("Completa fecha, entrega y método de pago.");
    return false;
  }

  const minDate = minimumDeliveryDate();

  if (order.deliveryDate < minDate) {
    alert("Los pedidos requieren mínimo 48 h de anticipación.");
    return false;
  }

  if (
    order.deliveryMethod === "Entrega Miga" &&
    !isMigaDeliveryDay(order.deliveryDate)
  ) {
    alert("La entrega Miga sin costo solo está disponible miércoles, sábado y domingo.");
    return false;
  }

  return true;
}

function whatsappOrderMessage(order) {
  const items = order.items
    .map(item => `• ${item.qty} × ${item.name}`)
    .join("\n");

  const [year, month, day] = order.deliveryDate.split("-");
  const prettyDate = `${day}/${month}/${year}`;

  return [
    `Hola Miga 🍪 Quiero confirmar mi pedido`,
    ``,
    `*Pedido:* ${order.orderId}`,
    items,
    ``,
    `*${order.pieces} ${order.pieces === 1 ? "miga" : "migas"} · ${money(order.unitPrice)} c/u*`,
    `*Total: ${money(order.total)}*`,
    ``,
    `*Fecha:* ${prettyDate}`,
    `*Entrega:* ${order.deliveryMethod}`,
    `*Pago:* ${order.paymentMethod}`,
    order.notes ? `*Notas:* ${order.notes}` : "",
    `*Nombre:* ${order.customerName}`
  ]
    .filter(line => line !== "")
    .join("\n");
}

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function submitOrder(event) {
  event.preventDefault();

  const order = buildOrderData();

  if (!validateOrder(order)) return;

  if (
    !GOOGLE_SCRIPT_URL ||
    GOOGLE_SCRIPT_URL.includes("PEGA_AQUI")
  ) {
    alert(
      "La página ya está lista, pero falta pegar la URL del Google Apps Script en script.js para registrar pedidos."
    );
    return;
  }

  const button = document.getElementById("submitOrderBtn");
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "enviando...";

  try {
    // Apps Script puede requerir no-cors cuando se llama desde Live Server.
    // El pedido se registra en Sheets y envía correo desde el backend.
const response = await fetch(GOOGLE_SCRIPT_URL, {
  method: "POST",
  headers: {
    "Content-Type": "text/plain;charset=utf-8"
  },
  body: JSON.stringify(order)
});

const result = await response.json();

if (!result.ok) {
  throw new Error(result.error || "No se pudo registrar el pedido.");
}

order.orderId = result.orderId;

lastOrder = order;

    document.getElementById("successText").textContent =
      `Tu pedido ${order.orderId} por ${money(order.total)} fue enviado. Miga te contactará para confirmar disponibilidad, entrega y pago.`;

    document.getElementById("successModal").hidden = false;

    cart = {};
    saveCart();
    renderCart();
    document.getElementById("checkoutForm").reset();
    document.getElementById("deliveryDate").min = minimumDeliveryDate();
  } catch (error) {
    console.error(error);
    alert(
      "No pudimos enviar el pedido. Intenta de nuevo o escríbenos por WhatsApp."
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

// ==============================
// EVENTS
// ==============================
document.addEventListener("click", event => {
  const addId = event.target.dataset.add;
  const plusId = event.target.dataset.plus;
  const minusId = event.target.dataset.minus;

  if (addId) addToCart(addId);
  if (plusId) changeQuantity(plusId, 1);
  if (minusId) changeQuantity(minusId, -1);
});

document.getElementById("openCartBtn").addEventListener("click", openCart);
document.getElementById("closeCartBtn").addEventListener("click", closeCart);
document.getElementById("drawerOverlay").addEventListener("click", closeCart);

document.getElementById("goCheckoutBtn").addEventListener("click", () => {
  if (!totalPieces()) {
    alert("Tu bag está vacío.");
    return;
  }

  closeCart();
  document.getElementById("checkout").scrollIntoView({ behavior: "smooth" });
});

document
  .getElementById("deliveryDate")
  .addEventListener("change", updateDeliveryOptions);

document
  .getElementById("checkoutForm")
  .addEventListener("submit", submitOrder);

document.getElementById("generalWhatsAppBtn").addEventListener("click", () => {
  openWhatsApp("Hola Miga 🍪 Tengo una pregunta sobre sus cookies.");
});

document
  .getElementById("confirmWhatsAppBtn")
  .addEventListener("click", () => {
    if (!lastOrder) return;
    openWhatsApp(whatsappOrderMessage(lastOrder));
  });

document.getElementById("closeSuccessBtn").addEventListener("click", () => {
  document.getElementById("successModal").hidden = true;
});

// ==============================
// INIT
// ==============================
renderProducts();
renderCart();

document.getElementById("deliveryDate").min = minimumDeliveryDate();
