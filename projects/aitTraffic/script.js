// Demo flight data with known routes (lat, lon for origin & destination)
let flights = [
  {
    code: "AI202",
    route: "Delhi → Mumbai",
    status: "On Time",
    origin: { lat: 28.6139, lon: 77.2090 },  // Delhi
    dest:   { lat: 19.0760, lon: 72.8777 }   // Mumbai
  },
  {
    code: "BA101",
    route: "London → New York",
    status: "Delayed",
    origin: { lat: 51.5074, lon: -0.1278 },  // London
    dest:   { lat: 40.7128, lon: -74.0060 }  // New York
  }
];

let tickets = [];
let lastQrCodeValue = "";

// Leaflet map and layers
let map;
let flightMarkers = {};   // code -> marker
let flightPolylines = {}; // code -> polyline

// Load tickets from localStorage
function loadTickets() {
  const saved = localStorage.getItem("tickets");
  if (saved) tickets = JSON.parse(saved);
  const last = localStorage.getItem("lastQrCode");
  if (last) {
    lastQrCodeValue = last;
    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: lastQrCodeValue, width: 128, height: 128 });
    const scan = document.getElementById("scanResult");
    scan.textContent = "Awaiting scan…";
    scan.className = "scan-status";
  }
}

// Save tickets to localStorage
function saveTickets() {
  localStorage.setItem("tickets", JSON.stringify(tickets));
  localStorage.setItem("lastQrCode", lastQrCodeValue);
}

// Render flights list
function renderFlights() {
  const list = document.getElementById("flightList");
  list.innerHTML = flights.map(f => `
    <li class="list-group-item d-flex justify-content-between">
      <span>${f.code} • ${f.route}</span>
      <span class="sub">${f.status}</span>
    </li>
  `).join("");
}

// Render tickets table
function renderTicketTable() {
  const tbody = document.getElementById("ticketTable");
  if (!tbody) return;
  tbody.innerHTML = tickets.map(t => `
    <tr>
      <td>${t.code}</td>
      <td>${t.name}</td>
      <td>${t.flight}</td>
      <td>${t.validated ? "Validated" : "Not validated"}</td>
      <td class="d-flex gap-2">
        <button class="btnx" data-code="${t.code}" data-action="show-qr">Show QR</button>
        <button class="btnx" data-code="${t.code}" data-action="validate">Mark Validated</button>
        <button class="btnx" data-code="${t.code}" data-action="delete">Delete</button>
      </td>
    </tr>
  `).join("");
}

// Handle table actions
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button.btnx");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const code = btn.getAttribute("data-code");
  if (!action || !code) return;

  if (action === "show-qr") {
    const ticket = tickets.find(t => t.code === code);
    if (!ticket) return;
    lastQrCodeValue = code;
    saveTickets();
    const qrContainer = document.getElementById("qrContainer");
    const scan = document.getElementById("scanResult");
    qrContainer.classList.remove("pulse");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: code, width: 128, height: 128 });
    scan.textContent = `QR loaded for ${ticket.name} (${ticket.flight})`;
    scan.className = "scan-status";
  }

  if (action === "validate") {
    const idx = tickets.findIndex(t => t.code === code);
    if (idx !== -1) {
      tickets[idx].validated = true;
      saveTickets();
      renderTicketTable();
    }
  }

  if (action === "delete") {
    tickets = tickets.filter(t => t.code !== code);
    if (lastQrCodeValue === code) {
      lastQrCodeValue = "";
      const qrContainer = document.getElementById("qrContainer");
      const scan = document.getElementById("scanResult");
      qrContainer.innerHTML = "";
      scan.textContent = "Awaiting scan…";
      scan.className = "scan-status";
    }
    saveTickets();
    renderTicketTable();
  }
});

// Booking with QR code + route plotting
document.getElementById("ticketForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("passengerName").value.trim();
  const flightCode = document.getElementById("flightCode").value.trim().toUpperCase();
  const code = "TKT" + Math.floor(Math.random() * 100000);

  tickets.push({ code, name, flight: flightCode, validated: false });
  lastQrCodeValue = code;
  saveTickets();

  document.getElementById("ticketOutput").textContent =
    `Ticket booked for ${name} on ${flightCode}. Code: ${code}`;

  // Generate QR
  const qrContainer = document.getElementById("qrContainer");
  qrContainer.classList.remove("pulse");
  qrContainer.innerHTML = "";
  new QRCode(qrContainer, { text: code, width: 128, height: 128 });

  const scan = document.getElementById("scanResult");
  scan.textContent = "Awaiting scan…";
  scan.className = "scan-status";

  renderTicketTable();
  e.target.reset();

  // Plot route for booked flight if known in flights data
  const f = flights.find(fl => fl.code.toUpperCase() === flightCode);
  if (f && map) {
    plotFlightRoute(f);
    map.flyTo([f.origin.lat, f.origin.lon], 4, { animate: true });
  }
});

// Validation + scan simulation
document.getElementById("validateForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = document.getElementById("ticketCode").value.trim();
  const idx = tickets.findIndex(t => t.code === code);
  const ticket = idx !== -1 ? tickets[idx] : null;

  const output = document.getElementById("validateOutput");
  const scan = document.getElementById("scanResult");
  const qrContainer = document.getElementById("qrContainer");

  if (ticket) {
    ticket.validated = true;
    saveTickets();
    renderTicketTable();

    output.textContent = `Valid pass: ${ticket.name} on ${ticket.flight}`;
    output.className = "valid-pass sub";

    if (code === lastQrCodeValue && qrContainer.childNodes.length > 0) {
      qrContainer.classList.remove("pulse");
      void qrContainer.offsetWidth; // restart animation
      qrContainer.classList.add("pulse");
      scan.textContent = "QR scanned: pass verified";
      scan.className = "scan-status valid-pass";
    } else {
      scan.textContent = "Code verified (QR loaded from table or earlier booking)";
      scan.className = "scan-status valid-pass";
    }
  } else {
    output.textContent = "Invalid ticket code";
    output.className = "invalid-pass sub";
    scan.textContent = "Scan failed: no such ticket";
    scan.className = "scan-status invalid-pass";
  }

  e.target.reset();
});

// Export tickets to CSV (including status)
function exportTicketsToCSV() {
  if (tickets.length === 0) {
    alert("No tickets to export.");
    return;
  }
  const header = ["Code", "Passenger", "Flight", "Status"];
  const rows = tickets.map(t => [t.code, t.name, t.flight, t.validated ? "Validated" : "Not validated"]);
  const csvContent = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "tickets.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Clear all tickets
function clearAllTickets() {
  if (!confirm("Clear all tickets? This cannot be undone.")) return;
  tickets = [];
  lastQrCodeValue = "";
  saveTickets();
  renderTicketTable();
  const qrContainer = document.getElementById("qrContainer");
  const scan = document.getElementById("scanResult");
  qrContainer.innerHTML = "";
  scan.textContent = "Awaiting scan…";
  scan.className = "scan-status";
}

// Hook up buttons
document.getElementById("exportCsvBtn").addEventListener("click", exportTicketsToCSV);
document.getElementById("clearAllBtn").addEventListener("click", clearAllTickets);

// Initialize Leaflet map with markers and polylines
function initMap() {
  // Center roughly over Europe-West Asia for demo
  map = L.map("map").setView([30, 20], 2);

  // OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Add initial flights to map
  flights.forEach(f => {
    plotFlightRoute(f);
  });
}

// Plot a flight route and marker
function plotFlightRoute(flight) {
  // Remove existing if any
  if (flightMarkers[flight.code]) {
    map.removeLayer(flightMarkers[flight.code]);
  }
  if (flightPolylines[flight.code]) {
    map.removeLayer(flightPolylines[flight.code]);
  }

  const origin = [flight.origin.lat, flight.origin.lon];
  const dest = [flight.dest.lat, flight.dest.lon];

  // Marker at origin
  const marker = L.marker(origin).addTo(map);
  marker.bindPopup(`<b>${flight.code}</b><br>${flight.route}<br>Status: ${flight.status}`);
  flightMarkers[flight.code] = marker;

  // Polyline from origin to destination
  const color = flight.status === "On Time" ? "#2bb673"
              : flight.status === "Delayed" ? "#ff6d00"
              : flight.status === "Cancelled" ? "#d00000"
              : flight.status === "Landed" ? "#6c757d"
              : "#0077b6"; // default/boarding
  const line = L.polyline([origin, dest], { color, weight: 4, opacity: 0.8 }).addTo(map);
  flightPolylines[flight.code] = line;
}

// Refresh flights (random statuses + update map colors/popups)
document.getElementById("refreshBtn").addEventListener("click", () => {
  const statuses = ["On Time", "Delayed", "Boarding", "Cancelled", "Landed"];
  flights.forEach(f => {
    f.status = statuses[Math.floor(Math.random() * statuses.length)];
  });
  renderFlights();

  // Update map visuals for each flight
  flights.forEach(f => {
    // Replot route to reflect new status color
    plotFlightRoute(f);
  });
});

// Init
loadTickets();
renderFlights();
renderTicketTable();
initMap();