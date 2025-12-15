function renderDashboard() {
  const orders = lsGet(LS_KEYS.ORDERS, []);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;

  document.getElementById('kpiOrders').textContent = totalOrders;
  document.getElementById('kpiRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
  document.getElementById('kpiAOV').textContent = `₹${aov.toFixed(2)}`;

  // Top products by units
  const unitsByProduct = {};
  orders.forEach(o => o.items.forEach(it => {
    unitsByProduct[it.name] = (unitsByProduct[it.name] || 0) + it.qty;
  }));
  const top = Object.entries(unitsByProduct).sort((a,b) => b[1]-a[1]).slice(0,5);
  const ul = document.getElementById('topProducts');
  ul.innerHTML = '';
  top.forEach(([name, units]) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.innerHTML = `<span>${name}</span><strong>${units}</strong>`;
    ul.appendChild(li);
  });

  // Revenue by day (last 7 days)
  const byDay = {};
  for (let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0,10);
    byDay[key] = 0;
  }
  orders.forEach(o => {
    const key = new Date(o.ts).toISOString().substring(0,10);
    if (byDay[key] != null) byDay[key] += o.total;
  });

  const labels = Object.keys(byDay);
  const data = labels.map(k => byDay[k]);

  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data,
        backgroundColor: '#0d6efd'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
