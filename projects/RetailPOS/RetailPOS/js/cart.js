function getCart() {
  return lsGet(LS_KEYS.CART, []);
}

function setCart(cart) {
  lsSet(LS_KEYS.CART, cart);
}

function addToCart(productId) {
  const product = getProducts().find(p => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const idx = cart.findIndex(c => c.productId === productId);
  if (idx >= 0) {
    // Respect stock
    if (cart[idx].qty < product.stock) cart[idx].qty += 1;
  } else {
    cart.push({ productId, name: product.name, price: product.price, qty: 1, sku: product.sku });
  }
  setCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter(c => c.productId !== productId);
  setCart(cart);
  renderCart();
}

function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(c => c.productId === productId);
  const product = getProducts().find(p => p.id === productId);
  if (!item || !product) return;
  item.qty = Math.max(1, Math.min(product.stock, qty));
  setCart(cart);
  renderCart();
}

function clearCart() {
  setCart([]);
  renderCart();
}

function renderCart() {
  const listEl = document.getElementById('cart-items');
  const cart = getCart();
  listEl.innerHTML = '';
  cart.forEach(c => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div>
        <div class="fw-bold">${c.name}</div>
        <div class="small text-muted">${c.sku}</div>
        <div class="qty-controls mt-1">
          <button class="btn btn-sm btn-outline-secondary">−</button>
          <input type="number" class="form-control form-control-sm" style="width:70px" value="${c.qty}" min="1" />
          <button class="btn btn-sm btn-outline-secondary">+</button>
          <button class="btn btn-sm btn-outline-danger ms-2">Remove</button>
        </div>
      </div>
      <div class="text-end">
        <div>₹${(c.price * c.qty).toFixed(2)}</div>
        <div class="small text-muted">₹${c.price.toFixed(2)} × ${c.qty}</div>
      </div>
    `;
    const [minusBtn, qtyInput, plusBtn, removeBtn] = li.querySelectorAll('button, input');
    minusBtn.addEventListener('click', () => updateQty(c.productId, c.qty - 1));
    plusBtn.addEventListener('click', () => updateQty(c.productId, c.qty + 1));
    qtyInput.addEventListener('input', (e) => updateQty(c.productId, parseInt(e.target.value || '1', 10)));
    removeBtn.addEventListener('click', () => removeFromCart(c.productId));
    listEl.appendChild(li);
  });
  renderTotals();
}

function computeTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountPct = parseFloat(document.getElementById('discountPct').value || '0');
  const taxPct = parseFloat(document.getElementById('taxPct').value || '0');
  const discountAmt = subtotal * (discountPct / 100);
  const taxedBase = Math.max(0, subtotal - discountAmt);
  const taxAmt = taxedBase * (taxPct / 100);
  const grandTotal = taxedBase + taxAmt;
  return { subtotal, discountAmt, taxAmt, grandTotal, discountPct, taxPct };
}

function renderTotals() {
  const { subtotal, discountAmt, taxAmt, grandTotal } = computeTotals();
  document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('discountAmt').textContent = `₹${discountAmt.toFixed(2)}`;
  document.getElementById('taxAmt').textContent = `₹${taxAmt.toFixed(2)}`;
  document.getElementById('grandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
}

function recordOrder(order) {
  const orders = lsGet(LS_KEYS.ORDERS, []);
  orders.push(order);
  lsSet(LS_KEYS.ORDERS, orders);
}

function renderRecentOrders() {
  const orders = lsGet(LS_KEYS.ORDERS, []).slice(-5).reverse();
  const ul = document.getElementById('recent-orders');
  if (!ul) return;
  ul.innerHTML = '';
  orders.forEach(o => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.innerHTML = `
      <span>${new Date(o.ts).toLocaleString()} • ${o.items.length} items</span>
      <strong>₹${o.total.toFixed(2)}</strong>
    `;
    ul.appendChild(li);
  });
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const totals = computeTotals();
  const order = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    items: cart.map(c => ({ productId: c.productId, name: c.name, sku: c.sku, qty: c.qty, price: c.price })),
    subtotal: totals.subtotal,
    discountPct: totals.discountPct,
    discountAmt: totals.discountAmt,
    taxPct: totals.taxPct,
    taxAmt: totals.taxAmt,
    total: totals.grandTotal
  };

  // Reduce stock
  const products = getProducts();
  order.items.forEach(it => {
    const p = products.find(pp => pp.id === it.productId);
    if (p) p.stock = Math.max(0, p.stock - it.qty);
  });
  setProducts(products);

  recordOrder(order);
  setCart([]);
  renderCart();
  renderRecentOrders();

  const msg = document.getElementById('checkoutMsg');
  msg.classList.remove('d-none');
  setTimeout(() => msg.classList.add('d-none'), 1200);
}
