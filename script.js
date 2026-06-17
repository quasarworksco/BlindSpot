const products = [
  { id: 1, name: 'Gorra Pro Runner', category: 'gorras', price: 25, img: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80' },
  { id: 2, name: 'Gorra Trail Black', category: 'gorras', price: 28, img: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80' },
  { id: 3, name: 'Gorra Sky Blue', category: 'gorras', price: 22, img: 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=400&q=80' },
  { id: 4, name: 'Gorra Urban Sport', category: 'gorras', price: 24, img: 'https://images.unsplash.com/photo-1620231150904-aa56eba6b9c1?w=400&q=80' },
  { id: 5, name: 'Gafas Speed Vision', category: 'gafas', price: 45, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80' },
  { id: 6, name: 'Gafas Aero Black', category: 'gafas', price: 50, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80' },
  { id: 7, name: 'Gafas Ice Blue', category: 'gafas', price: 48, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80' },
  { id: 8, name: 'Gafas Trail Pro', category: 'gafas', price: 55, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&q=80' },
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
const checkoutOverlay = document.getElementById('checkoutOverlay');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutTotalEl = document.getElementById('checkoutTotal');
const contactForm = document.getElementById('contactForm');
const toastEl = document.getElementById('toast');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function renderProducts(filter = 'all') {
  productsGrid.innerHTML = '';
  const list = filter === 'all' ? products : products.filter(p => p.category === filter);
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img" style="background-image:url('${p.img}')">
        <span class="product-badge">${p.category === 'gorras' ? 'Gorra' : 'Gafas'}</span>
      </div>
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
    showToast(`${product.name} añadido al carrito`);
    cartBtn.classList.remove('bump');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('bump');
  }
});

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCart() {
  cartCountEl.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p style="text-align:center;color:#888;padding:2rem 0;">Tu carrito está vacío</p>';
  }
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <p>$${item.price} c/u</p>
        <div class="qty-controls">
          <button class="qty-dec" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button class="qty-inc" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="remove-item" data-id="${item.id}">&times;</button>
    `;
    cartItemsEl.appendChild(div);
  });
  const total = cartTotal();
  cartTotalEl.textContent = `$${total}`;
  checkoutTotalEl.textContent = `$${total}`;
}

cartItemsEl.addEventListener('click', e => {
  const id = parseInt(e.target.dataset.id);
  if (!id) return;
  const item = cart.find(i => i.id === id);
  if (e.target.classList.contains('qty-inc')) {
    item.qty++;
  } else if (e.target.classList.contains('qty-dec')) {
    item.qty--;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  } else if (e.target.classList.contains('remove-item')) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCart();
});

cartBtn.addEventListener('click', () => cartOverlay.classList.add('open'));
closeCart.addEventListener('click', () => cartOverlay.classList.remove('open'));
cartOverlay.addEventListener('click', e => {
  if (e.target === cartOverlay) cartOverlay.classList.remove('open');
});

checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Tu carrito está vacío');
    return;
  }
  cartOverlay.classList.remove('open');
  checkoutOverlay.classList.add('open');
});

closeCheckout.addEventListener('click', () => checkoutOverlay.classList.remove('open'));
checkoutOverlay.addEventListener('click', e => {
  if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open');
});

checkoutForm.addEventListener('submit', e => {
  e.preventDefault();
  showToast('¡Pedido confirmado! Te enviaremos un correo con el seguimiento.');
  cart = [];
  updateCart();
  checkoutForm.reset();
  checkoutOverlay.classList.remove('open');
});

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  showToast('Mensaje enviado. ¡Gracias por contactarnos!');
  contactForm.reset();
});

renderProducts();
updateCart();

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value.toLocaleString('es') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const revealTargets = document.querySelectorAll('.reveal, .product-card, [data-count], [data-text]');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('in-view');
    if (el.dataset.count) animateCount(el);
    if (el.dataset.text) el.textContent = el.dataset.text;
    revealObserver.unobserve(el);
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => revealObserver.observe(el));

new MutationObserver(() => {
  document.querySelectorAll('.product-card').forEach(card => revealObserver.observe(card));
}).observe(productsGrid, { childList: true });
