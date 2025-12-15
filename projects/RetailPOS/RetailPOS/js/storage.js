const LS_KEYS = {
  USERS: 'rp_users',
  SESSION: 'rp_session',
  PRODUCTS: 'rp_products',
  CART: 'rp_cart',
  ORDERS: 'rp_orders'
};

function lsGet(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedData() {
  // Seed users
  if (!lsGet(LS_KEYS.USERS)) {
    lsSet(LS_KEYS.USERS, [
      { id: 'u_admin', username: 'admin', password: 'admin123', role: 'admin' },
      { id: 'u_cashier', username: 'cashier', password: 'cash123', role: 'cashier' }
    ]);
  }
  // Seed products
  if (!lsGet(LS_KEYS.PRODUCTS)) {
    const seed = [
      { id: crypto.randomUUID(), name: 'Notebook', sku: 'NBK-001', price: 50, stock: 100, category: 'Stationery', image: 'https://via.placeholder.com/300x200?text=Notebook' },
      { id: crypto.randomUUID(), name: 'Pen', sku: 'PEN-010', price: 10, stock: 300, category: 'Stationery', image: 'https://via.placeholder.com/300x200?text=Pen' },
      { id: crypto.randomUUID(), name: 'Marker', sku: 'MRK-220', price: 35, stock: 80, category: 'Stationery', image: 'https://via.placeholder.com/300x200?text=Marker' }
    ];
    lsSet(LS_KEYS.PRODUCTS, seed);
  }
  if (!lsGet(LS_KEYS.CART)) lsSet(LS_KEYS.CART, []);
  if (!lsGet(LS_KEYS.ORDERS)) lsSet(LS_KEYS.ORDERS, []);
}
