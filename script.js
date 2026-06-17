const products = [
  { id: 1, name: 'Gorra Pro Runner', category: 'gorras', price: 25, icon: '🧢' },
  { id: 2, name: 'Gorra Trail Black', category: 'gorras', price: 28, icon: '🧢' },
  { id: 3, name: 'Gorra Sky Blue', category: 'gorras', price: 22, icon: '🧢' },
  { id: 4, name: 'Gorra Urban Sport', category: 'gorras', price: 24, icon: '🧢' },
  { id: 5, name: 'Gafas Speed Vision', category: 'gafas', price: 45, icon: '🕶️' },
  { id: 6, name: 'Gafas Aero Black', category: 'gafas', price: 50, icon: '🕶️' },
  { id: 7, name: 'Gafas Ice Blue', category: 'gafas', price: 48, icon: '🕶️' },
  { id: 8, name: 'Gafas Trail Pro', category: 'gafas', price: 55, icon: '🕶️' },
];

let cart = [];

const productsGrid = document.getElementById('productsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const cartBtn = document.getElementById('cartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const contactForm = document.getElementById('contactForm');

function renderProducts(filter = 'all') {
  productsGrid.innerHTML = '';
  const list = filter === 'all' ? products : products.filter(p => p.category === filter);
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img">${p.icon}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-price">$${p.price}</p>
        <button class="add-to-cart" data-id="${p.id}">Añadir al carrito</button>
      </div>
    `;
    productsGrid.appendChild(card);
  });
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.filter);
  });
});

productsGrid.addEventListener('click', e => {
  if (e.target.classList.contains('add-to-cart')) {
    const id = parseInt(e.target.dataset.id);
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    updateCart();
  }
});

function updateCart() {
  cartCountEl.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
  cartItemsEl.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.icon} ${item.name} x${item.qty}</span>
      <span>$${item.price * item.qty}</span>
      <button data-id="${item.id}">&times;</button>
    `;
    cartItemsEl.appendChild(div);
  });
  cartTotalEl.textContent = `$${total}`;
}

cartItemsEl.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    const id = parseInt(e.target.dataset.id);
    cart = cart.filter(item => item.id !== id);
    updateCart();
  }
});

cartBtn.addEventListener('click', () => cartOverlay.classList.add('open'));
closeCart.addEventListener('click', () => cartOverlay.classList.remove('open'));
cartOverlay.addEventListener('click', e => {
  if (e.target === cartOverlay) cartOverlay.classList.remove('open');
});

checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }
  alert('¡Gracias por tu compra! Te contactaremos para coordinar el envío.');
  cart = [];
  updateCart();
  cartOverlay.classList.remove('open');
});

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  alert('Mensaje enviado. ¡Gracias por contactarnos!');
  contactForm.reset();
});

renderProducts();
