import { db, uploadImageToCloudinary } from "./firebase-init.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const toastEl = document.getElementById('toast');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

const tabs = document.querySelectorAll('.admin-tab');
const productsPanel = document.getElementById('productsPanel');
const salesPanel = document.getElementById('salesPanel');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    productsPanel.hidden = tab.dataset.tab !== 'products';
    salesPanel.hidden = tab.dataset.tab !== 'sales';
  });
});

const variationsList = document.getElementById('variationsList');
const addVariationBtn = document.getElementById('addVariationBtn');

function addVariationRow() {
  const row = document.createElement('div');
  row.className = 'variation-row';
  row.innerHTML = `
    <input type="text" class="variation-size-input" placeholder="Talla (ej: M)">
    <input type="text" class="variation-color-input" placeholder="Color (ej: Negro)">
    <input type="number" class="variation-stock-input" placeholder="Stock" min="0">
    <button type="button" class="remove-variation">&times;</button>
  `;
  variationsList.appendChild(row);
}

addVariationBtn.addEventListener('click', addVariationRow);
variationsList.addEventListener('click', e => {
  if (e.target.classList.contains('remove-variation')) {
    e.target.closest('.variation-row').remove();
  }
});
addVariationRow();

const prodImageInput = document.getElementById('prodImage');
const prodImagePreview = document.getElementById('prodImagePreview');
prodImageInput.addEventListener('change', () => {
  const file = prodImageInput.files[0];
  if (!file) {
    prodImagePreview.hidden = true;
    return;
  }
  prodImagePreview.src = URL.createObjectURL(file);
  prodImagePreview.hidden = false;
});

const productForm = document.getElementById('productForm');
const prodSubmitBtn = document.getElementById('prodSubmitBtn');

productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('prodName').value;
  const category = document.getElementById('prodCategory').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const file = prodImageInput.files[0];

  const variations = [...variationsList.querySelectorAll('.variation-row')].map(row => ({
    size: row.querySelector('.variation-size-input').value || null,
    color: row.querySelector('.variation-color-input').value || null,
    stock: parseInt(row.querySelector('.variation-stock-input').value, 10) || 0
  })).filter(v => v.size || v.color);

  if (!file) {
    showToast('Selecciona una foto del producto');
    return;
  }

  prodSubmitBtn.disabled = true;
  prodSubmitBtn.textContent = 'Subiendo...';
  try {
    const imageUrl = await uploadImageToCloudinary(file);
    await addDoc(collection(db, 'products'), {
      name,
      category,
      price,
      imageUrl,
      variations,
      createdAt: serverTimestamp()
    });
    showToast('Producto guardado');
    productForm.reset();
    variationsList.innerHTML = '';
    addVariationRow();
    prodImagePreview.hidden = true;
  } catch (err) {
    console.error(err);
    showToast('Error al guardar el producto');
  }
  prodSubmitBtn.disabled = false;
  prodSubmitBtn.textContent = 'Guardar producto';
});

const productsTable = document.getElementById('productsTable');

onSnapshot(collection(db, 'products'), snapshot => {
  productsTable.innerHTML = '';
  if (snapshot.docs.length === 0) {
    productsTable.innerHTML = '<p class="products-empty">Todavía no hay productos cargados.</p>';
    return;
  }
  snapshot.docs.forEach(docSnap => {
    const p = docSnap.data();
    const variationsText = (p.variations || [])
      .map(v => `${v.size || ''}${v.size && v.color ? ' / ' : ''}${v.color || ''} (stock: ${v.stock})`)
      .join(', ');
    const row = document.createElement('div');
    row.className = 'admin-product-row';
    row.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}">
      <div class="admin-product-info">
        <strong>${p.name}</strong>
        <span>${p.category} · $${p.price}</span>
        ${variationsText ? `<span class="admin-product-variations">${variationsText}</span>` : ''}
      </div>
      <button class="remove-item delete-product" data-id="${docSnap.id}">&times;</button>
    `;
    productsTable.appendChild(row);
  });
});

productsTable.addEventListener('click', async e => {
  if (e.target.classList.contains('delete-product')) {
    await deleteDoc(doc(db, 'products', e.target.dataset.id));
    showToast('Producto eliminado');
  }
});

const salesTable = document.getElementById('salesTable');
const salesStats = document.getElementById('salesStats');

onSnapshot(query(collection(db, 'sales'), orderBy('createdAt', 'desc')), snapshot => {
  salesTable.innerHTML = '';
  let totalRevenue = 0;
  let totalItems = 0;

  if (snapshot.docs.length === 0) {
    salesTable.innerHTML = '<p class="sales-empty">Todavía no se ha registrado ninguna venta.</p>';
  }

  snapshot.docs.forEach(docSnap => {
    const sale = docSnap.data();
    totalRevenue += sale.total || 0;
    totalItems += (sale.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);
    const date = sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleString('es') : '';
    const itemsText = (sale.items || [])
      .map(i => `${i.qty}x ${i.name}${i.size || i.color ? ` (${[i.size, i.color].filter(Boolean).join(' / ')})` : ''}`)
      .join(', ');
    const row = document.createElement('div');
    row.className = 'admin-sale-row';
    row.innerHTML = `
      <div class="admin-sale-info">
        <strong>${sale.customer?.name || 'Cliente'}</strong>
        <span>${date}</span>
        <span class="admin-sale-items">${itemsText}</span>
      </div>
      <span class="admin-sale-total">$${sale.total}</span>
    `;
    salesTable.appendChild(row);
  });

  salesStats.innerHTML = `
    <div class="admin-stat-card">
      <span class="admin-stat-label">Ventas totales</span>
      <span class="admin-stat-value">${snapshot.docs.length}</span>
    </div>
    <div class="admin-stat-card">
      <span class="admin-stat-label">Ingresos totales</span>
      <span class="admin-stat-value">$${totalRevenue.toFixed(2)}</span>
    </div>
    <div class="admin-stat-card">
      <span class="admin-stat-label">Productos vendidos</span>
      <span class="admin-stat-value">${totalItems}</span>
    </div>
  `;
});
