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

function downloadReceipt(order) {
  const receiptWindow = window.open("", "_blank");

  if (!receiptWindow) {
    alert("Permite las ventanas emergentes para generar tu recibo.");
    return;
  }

  const [year, month, day] = order.deliveryDate.split("-");
  const deliveryDate = `${day}/${month}/${year}`;

  const orderDate = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const itemsHtml = order.items
    .map(
      item => `
        <div class="item">
          <span>${item.qty} × ${item.name}</span>
          <span>${money(item.qty * order.unitPrice)}</span>
        </div>
      `
    )
    .join("");

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo ${order.orderId}</title>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 40px 20px;
          background-color: #f7e8bd;
background-image:
  linear-gradient(45deg, #f4c84f 25%, transparent 25%),
  linear-gradient(-45deg, #f4c84f 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #f4c84f 75%),
  linear-gradient(-45deg, transparent 75%, #f4c84f 75%);
background-size: 120px 120px;
background-position:
  0 0,
  0 60px,
  60px -60px,
  -60px 0;
          color: #4a2d13;
          font-family: Arial, sans-serif;
        }

        .receipt {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          background: #fffaf3;
          padding: 54px;
          border-radius: 0;

--ticket-cut: 18px;
--ticket-cut-top: 24px;

-webkit-mask:
  radial-gradient(circle at 0 50%, transparent var(--ticket-cut), #000 calc(var(--ticket-cut) + 1px))
    left / 100% 56px repeat-y,
  radial-gradient(circle at 100% 50%, transparent var(--ticket-cut), #000 calc(var(--ticket-cut) + 1px))
    right / 100% 56px repeat-y,
  radial-gradient(circle at 50% 0, transparent var(--ticket-cut-top), #000 calc(var(--ticket-cut-top) + 1px))
    top / 90px 100% repeat-x,
  radial-gradient(circle at 50% 100%, transparent var(--ticket-cut-top), #000 calc(var(--ticket-cut-top) + 1px))
    bottom / 90px 100% repeat-x;

-webkit-mask-composite: source-in;

mask:
  radial-gradient(circle at 0 50%, transparent var(--ticket-cut), #000 calc(var(--ticket-cut) + 1px))
    left / 100% 56px repeat-y,
  radial-gradient(circle at 100% 50%, transparent var(--ticket-cut), #000 calc(var(--ticket-cut) + 1px))
    right / 100% 56px repeat-y,
  radial-gradient(circle at 50% 0, transparent var(--ticket-cut-top), #000 calc(var(--ticket-cut-top) + 1px))
    top / 90px 100% repeat-x,
  radial-gradient(circle at 50% 100%, transparent var(--ticket-cut-top), #000 calc(var(--ticket-cut-top) + 1px))
    bottom / 90px 100% repeat-x;

mask-composite: intersect;

box-shadow: 0 16px 50px rgba(74, 45, 19, 0.12);
}

        .brand-logo {
  display: block;
  width: 300px;
  height: auto;
  margin: 0 auto;
  object-fit: contain;
}
  .mascot-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 28px 0 32px;
}

.mascot {
  display: block;
  width: 300px;
  max-width: 70%;
  height: auto;
  object-fit: contain;
}

        .tagline {
          text-align: center;
          letter-spacing: 4px;
          font-size: 11px;
          margin: 12px 0 34px;
        }

        .line {
          border: 0;
          border-top: 1px solid #d8cabc;
          margin: 28px 0;
        }

        .top {
          display: flex;
          justify-content: space-between;
          gap: 30px;
        }

        .label {
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .order-id {
          font-size: 25px;
          font-weight: bold;
          margin: 0 0 5px;
        }

        .muted {
          color: #7a6859;
          font-size: 13px;
        }

        .status {
          display: inline-block;
          background: #ead8c2;
          padding: 9px 15px;
          border-radius: 30px;
          font-size: 12px;
        }

        .customer {
          background: #f5eadf;
          border-radius: 14px;
          padding: 18px;
          margin: 28px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        h2 {
          font-size: 14px;
          letter-spacing: 1px;
          margin: 0 0 18px;
        }

        .item {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 7px 0;
          font-size: 14px;
        }

        .summary {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
        }

        .total-label {
          font-size: 20px;
          font-weight: bold;
        }

        .total {
          font-size: 28px;
          font-weight: bold;
        }

        .details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          font-size: 13px;
        }

        .closing {
          text-align: center;
          margin-top: 40px;
        }

        .closing-title {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .footer {
          text-align: center;
          font-size: 11px;
          margin-top: 30px;
          color: #7a6859;
        }

        .print-button {
          display: block;
          width: 100%;
          max-width: 680px;
          margin: 20px auto 0;
          border: 0;
          border-radius: 30px;
          padding: 15px;
          background: #4a2d13;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        @media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .print-button {
    display: none !important;
  }
}

        @media (max-width: 600px) {
          body {
            padding: 0;
          }

          .receipt {
            padding: 36px 24px;
            min-height: 100vh;
          }

          .customer,
          .details {
            grid-template-columns: 1fr;
          }


          .print-button {
            width: calc(100% - 40px);
            margin-bottom: 20px;
          }
        }
      </style>
    </head>

    <body>

      <main class="receipt">

        <img class="brand-logo" src="images/miga-logo.png" alt="Miga">
        <p class="tagline">THANKS FOR YOUR ORDER.</p>

        <hr class="line">

        <div class="top">
          <div>
            <div class="label">Pedido</div>
            <p class="order-id">${order.orderId}</p>
            <span class="muted">${orderDate}</span>
          </div>

          <div>
            <div class="label">Estatus</div>
            <span class="status">Pedido recibido</span>
          </div>
        </div>

        <div class="customer">
          <div>
            <div class="label">Nombre</div>
            ${order.customerName}
          </div>

          <div>
            <div class="label">WhatsApp</div>
            ${order.customerPhone}
          </div>
        </div>

<div class="mascot-wrap">
  <img class="mascot" src="images/miga-mascota.png" alt="Mascota Miga">
</div>

        <h2>TU PEDIDO</h2>

        ${itemsHtml}

        <hr class="line">

        <div class="muted">
          ${order.pieces} ${order.pieces === 1 ? "miga" : "migas"}
          · ${money(order.unitPrice)} c/u
        </div>

        <div class="summary">
          <span class="total-label">TOTAL</span>
          <span class="total">${money(order.total)}</span>
        </div>

        <hr class="line">

        <div class="details">
          <div>
            <div class="label">Fecha de entrega</div>
            ${deliveryDate}
          </div>

          <div>
            <div class="label">Entrega</div>
            ${order.deliveryMethod}
          </div>

          <div>
            <div class="label">Método de pago</div>
            ${order.paymentMethod}
          </div>
        </div>

        <div class="closing">
          <div class="closing-title">pedido recibido ♥</div>
          <div class="muted">
            te contactaremos para confirmar entrega y pago.
          </div>
        </div>

        <div class="footer">
          @eatmiga_ · eatmiga.netlify.app
        </div>

      </main>

      <button class="print-button" id="savePdfBtn">
  guardar recibo como PDF ↓
</button>

    </body>
    </html>
  `);

  receiptWindow.document.close();
  
  receiptWindow.onload = () => {
    const savePdfBtn = receiptWindow.document.getElementById("savePdfBtn");
    const receipt = receiptWindow.document.querySelector(".receipt");

    savePdfBtn.addEventListener("click", async () => {
      savePdfBtn.textContent = "generando PDF...";

      try {
        // Espera a que logo y mascota estén completamente cargados
        const images = Array.from(receipt.querySelectorAll("img"));
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve();

            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );

        // 1) Captura el recibo (html2canvas no entiende "mask", sale rectangular)
        const S = 3; // resolución
        const canvas = await receiptWindow.html2canvas(receipt, {
          scale: S,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false
        });

        // Copia a un lienzo limpio (sin la escala interna de html2canvas)
        const ticket = receiptWindow.document.createElement("canvas");
        ticket.width = canvas.width;
        ticket.height = canvas.height;
        const ctx = ticket.getContext("2d");
        ctx.drawImage(canvas, 0, 0);

        const w = ticket.width;
        const h = ticket.height;

        // 2) Recorta las medias lunas en los 4 bordes
        ctx.globalCompositeOperation = "destination-out";

        const hole = (x, y, r) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        };

        const sideR = 18 * S, sideStep = 56 * S;   // lados (igual que la web)
        const topR  = 24 * S, topStep  = 90 * S;   // arriba/abajo (igual que la web)

        for (let y = (h / 2) % sideStep; y < h; y += sideStep) {
          hole(0, y, sideR);
          hole(w, y, sideR);
        }

        for (let x = (w / 2) % topStep; x < w; x += topStep) {
          hole(x, 0, topR);
          hole(x, h, topR);
        }

        ctx.globalCompositeOperation = "source-over";

        // 3) Lienzo final con el fondo de cuadros
        const pad = 50 * S;
        const out = receiptWindow.document.createElement("canvas");
        out.width = w + pad * 2;
        out.height = h + pad * 2;
        const o = out.getContext("2d");

        o.fillStyle = "#f7e8bd";
        o.fillRect(0, 0, out.width, out.height);

        o.fillStyle = "#f4c84f";
        const sq = 60 * S;
        for (let row = 0; row * sq < out.height; row++) {
          for (let col = 0; col * sq < out.width; col++) {
            if ((row + col) % 2) o.fillRect(col * sq, row * sq, sq, sq);
          }
        }

        // sombrita suave como en la web
        o.shadowColor = "rgba(74, 45, 19, 0.15)";
        o.shadowBlur = 50 * S;
        o.shadowOffsetY = 16 * S;
        o.drawImage(ticket, pad, pad);

        // 4) PDF del tamaño exacto de la imagen
        const imgData = out.toDataURL("image/png", 1.0);
        const { jsPDF } = receiptWindow.jspdf;

        const pdfWidth = 180;
        const pdfHeight = (out.height * pdfWidth) / out.width;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [pdfWidth, pdfHeight]
        });

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
        pdf.save(`${order.orderId}.pdf`);

      } catch (error) {
        console.error("Error generando PDF:", error);
        alert("No pudimos generar el PDF. Intenta de nuevo.");
      } finally {
        savePdfBtn.textContent = "guardar recibo como PDF ↓";
      }
    });
  };

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

  document
  .getElementById("downloadReceiptBtn")
  .addEventListener("click", () => {
    if (!lastOrder) return;
    downloadReceipt(lastOrder);
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
