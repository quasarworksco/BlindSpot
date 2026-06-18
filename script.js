import { db } from "./firebase-init.js";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

let products = [];
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
let activeFilter = 'all';

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function variationOptions(product) {
  const variations = product.variations || [];
  if (variations.length === 0) return '';
  const sizes = [...new Set(variations.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variations.map(v => v.color).filter(Boolean))];
  let html = '';
  if (sizes.length) {
    html += `<select class="variation-size" data-id="${product.id}">${sizes.map(s => `<option value="${s}">${s}</option>`).join('')}</select>`;
  }
  if (colors.length) {
    html += `<select class="variation-color" data-id="${product.id}">${colors.map(c => `<option value="${c}">${c}</option>`).join('')}</select>`;
  }
  return html;
}

function renderProducts(filter = activeFilter) {
  activeFilter = filter;
  productsGrid.innerHTML = '';
  const list = filter === 'all' ? products : products.filter(p => p.category === filter);
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img" style="background-image:url('${p.imageUrl || p.img || ''}')">
        <span class="product-badge">${p.category === 'gorras' ? 'Gorra' : 'Gafas'}</span>
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-price">$${p.price}</p>
        <div class="product-variations">${variationOptions(p)}</div>
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
    const id = e.target.dataset.id;
    const product = products.find(p => p.id === id);
    const card = e.target.closest('.product-card');
    const size = card.querySelector('.variation-size')?.value || null;
    const color = card.querySelector('.variation-color')?.value || null;
    const key = `${id}-${size || ''}-${color || ''}`;
    const existing = cart.find(item => item.key === key);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ ...product, key, size, color, qty: 1 });
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
    const variationText = [item.size, item.color].filter(Boolean).join(' / ');
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.imageUrl || item.img || ''}" alt="${item.name}">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        ${variationText ? `<p class="cart-item-variation">${variationText}</p>` : ''}
        <p>$${item.price} c/u</p>
        <div class="qty-controls">
          <button class="qty-dec" data-key="${item.key}">-</button>
          <span>${item.qty}</span>
          <button class="qty-inc" data-key="${item.key}">+</button>
        </div>
      </div>
      <button class="remove-item" data-key="${item.key}">&times;</button>
    `;
    cartItemsEl.appendChild(div);
  });
  const total = cartTotal();
  cartTotalEl.textContent = `$${total}`;
  checkoutTotalEl.textContent = `$${total}`;
}

cartItemsEl.addEventListener('click', e => {
  const key = e.target.dataset.key;
  if (!key) return;
  const item = cart.find(i => i.key === key);
  if (e.target.classList.contains('qty-inc')) {
    item.qty++;
  } else if (e.target.classList.contains('qty-dec')) {
    item.qty--;
    if (item.qty <= 0) cart = cart.filter(i => i.key !== key);
  } else if (e.target.classList.contains('remove-item')) {
    cart = cart.filter(i => i.key !== key);
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

checkoutForm.addEventListener('submit', async e => {
  e.preventDefault();
  const total = cartTotal();
  try {
    await addDoc(collection(db, 'sales'), {
      items: cart.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        size: i.size,
        color: i.color
      })),
      total,
      customer: {
        name: document.getElementById('checkoutName').value,
        address: document.getElementById('checkoutAddress').value,
        city: document.getElementById('checkoutCity').value
      },
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Error al registrar la venta', err);
  }
  showToast('¡Pedido confirmado! Te enviaremos un correo con el seguimiento.');
  cart = [];
  updateCart();
  checkoutForm.reset();
  checkoutOverlay.classList.remove('open');
});

const contactSubmit = document.getElementById('contactSubmit');

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  showToast('Mensaje enviado. ¡Gracias por contactarnos!');
  const originalText = contactSubmit.textContent;
  contactSubmit.textContent = '¡Enviado!';
  contactSubmit.classList.add('sent');
  contactForm.reset();
  setTimeout(() => {
    contactSubmit.textContent = originalText;
    contactSubmit.classList.remove('sent');
  }, 2000);
});

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

const revealTargets = document.querySelectorAll('.reveal, [data-count], [data-text]');
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

onSnapshot(collection(db, 'products'), snapshot => {
  products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderProducts(activeFilter);
});

updateCart();
