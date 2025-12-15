function getProducts() {
  return lsGet(LS_KEYS.PRODUCTS, []);
}

function setProducts(list) {
  lsSet(LS_KEYS.PRODUCTS, list);
}

function upsertProduct(product) {
  const list = getProducts();
  const idx = list.findIndex(p => p.id === product.id || p.sku === product.sku);
  if (idx >= 0) {
    list[idx] = product;
  } else {
    list.push(product);
  }
  setProducts(list);
}

function deleteProduct(id) {
  const list = getProducts().filter(p => p.id !== id);
  setProducts(list);
}

function renderProducts(filter) {
  const container = document.getElementById('product-list');
  const q = (filter || '').toLowerCase();
  const list = getProducts().filter(p => {
    return !q || [p.name, p.sku, p.category].some(x => (x || '').toLowerCase().includes(q));
  });

  container.innerHTML = '';
  list.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${p.image || 'https://via.placeholder.com/300x200?text=Product'}" class="card-img-top" alt="${p.name}" />
        <div class="card-body d-flex flex-column">
          <h6 class="card-title mb-1">${p.name}</h6>
          <div class="text-muted small mb-2">${p.sku} • ${p.category || '—'}</div>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="fw-bold">₹${p.price.toFixed(2)}</span>
            <button class="btn btn-primary btn-sm">Add</button>
          </div>
          <div class="small text-muted mt-1">Stock: ${p.stock}</div>
        </div>
      </div>
    `;
    const addBtn = col.querySelector('button');
    addBtn.addEventListener('click', () => addToCart(p.id));
    container.appendChild(col);
  });

  if (list.length === 0) {
    container.innerHTML = '<div class="text-muted">No products found.</div>';
  }
}
