// Mock train data
const TRAINS = [
  {
    id: "12728",
    name: "Godavari Express",
    from: "Hyderabad",
    to: "Vijayawada",
    depart: "07:30",
    arrive: "11:45",
    baseFare: { SL: 350, "3A": 950, "2A": 1350, "1A": 2100 },
    bookedSeats: ["A1-03", "A1-07", "A1-15", "B2-12"]
  },
  {
    id: "17032",
    name: "Mumbai Express",
    from: "Hyderabad",
    to: "Mumbai",
    depart: "20:15",
    arrive: "10:05",
    baseFare: { SL: 750, "3A": 1450, "2A": 2050, "1A": 3100 },
    bookedSeats: ["C3-04", "C3-05", "C3-06"]
  },
  {
    id: "12604",
    name: "Chennai SF",
    from: "Hyderabad",
    to: "Chennai",
    depart: "18:40",
    arrive: "06:25",
    baseFare: { SL: 650, "3A": 1390, "2A": 1890, "1A": 2890 },
    bookedSeats: []
  }
];

// State
const state = {
  query: null,
  selectedTrain: null,
  selectedClass: "SL",
  date: null,
  passengers: 1,
  seatCount: 1,
  selectedSeats: [],
  totalFare: 0,
  passengersData: []
};

// Helpers
const el = id => document.getElementById(id);
const fmt = s => String(s || "").trim();
const INR = n => Number(n).toLocaleString("en-IN");

function init() {
  // Minimum date = today
  const today = new Date().toISOString().split("T")[0];
  el("date").setAttribute("min", today);

  // Search form
  el("searchForm").addEventListener("submit", handleSearch);

  // Proceed
  el("proceedBtn").addEventListener("click", () => {
    buildPassengerForm();
    el("passengerSection").hidden = false;
    window.scrollTo({ top: el("passengerSection").offsetTop - 16, behavior: "smooth" });
  });

  // Confirm
  el("confirmBtn").addEventListener("click", confirmBooking);

  // Download & Reset
  el("downloadBtn").addEventListener("click", downloadTicket);
  el("resetBtn").addEventListener("click", resetApp);
}

function handleSearch(e) {
  e.preventDefault();
  const from = fmt(el("from").value);
  const to = fmt(el("to").value);
  const date = el("date").value;
  const cls = el("class").value;
  const passengers = parseInt(el("passengers").value || "1", 10);

  if (!from || !to || !date) return alert("Please fill From, To and Date.");

  state.query = { from, to };
  state.date = date;
  state.selectedClass = cls;
  state.passengers = passengers;

  const results = TRAINS.filter(
    t => t.from.toLowerCase() === from.toLowerCase() && t.to.toLowerCase() === to.toLowerCase()
  );

  renderResults(results);
}

function renderResults(results) {
  const container = el("trainResults");
  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = `<p>No trains found for your route.</p>`;
  } else {
    results.forEach(t => {
      const card = document.createElement("div");
      card.className = "train-card";
      card.innerHTML = `
        <div>
          <div class="train-name">${t.name} (${t.id})</div>
          <div class="train-meta">${t.from} → ${t.to} • Dep ${t.depart} • Arr ${t.arrive}</div>
        </div>
        <div>
          <button class="btn select-btn">Select</button>
        </div>
      `;
      card.querySelector(".select-btn").addEventListener("click", () => selectTrain(t));
      container.appendChild(card);
    });
  }

  el("resultsSection").hidden = false;
  el("selectionSection").hidden = true;
  el("passengerSection").hidden = true;
  el("summarySection").hidden = true;
}

function selectTrain(train) {
  state.selectedTrain = train;
  state.selectedSeats = [];
  state.seatCount = Math.min(state.passengers, 6);

  el("selectedTrainName").textContent = `${train.name} (${train.id})`;
  el("selectedDeparture").textContent = train.depart;
  el("selectedArrival").textContent = train.arrive;
  el("selectedClass").textContent = state.selectedClass;

  el("seatCount").value = state.seatCount;
  el("seatCount").addEventListener("input", () => {
    const val = parseInt(el("seatCount").value || "1", 10);
    state.seatCount = Math.max(1, Math.min(val, 6));
    renderSeatMap();
    updateFare();
  });

  renderSeatMap();
  updateFare();

  el("selectionSection").hidden = false;
  window.scrollTo({ top: el("selectionSection").offsetTop - 16, behavior: "smooth" });
}

function renderSeatMap() {
  const seatMap = el("seatMap");
  seatMap.innerHTML = "";
  const coaches = ["A1", "B2", "C3"];
  const rows = 8; // seats per row label
  const cols = 8;

  const booked = new Set(state.selectedTrain.bookedSeats);

  for (const coach of coaches) {
    for (let i = 1; i <= rows; i++) {
      for (let j = 1; j <= cols; j++) {
        const num = ((i - 1) * cols + j).toString().padStart(2, "0");
        const seatId = `${coach}-${num}`;
        const div = document.createElement("div");
        div.className = "seat";
        div.textContent = seatId;

        if (booked.has(seatId)) {
          div.classList.add("booked");
        }

        if (state.selectedSeats.includes(seatId)) {
          div.classList.add("selected");
        }

        div.addEventListener("click", () => toggleSeat(seatId, div));
        seatMap.appendChild(div);
      }
    }
  }
}

function toggleSeat(seatId, elSeat) {
  if (elSeat.classList.contains("booked")) return;

  const idx = state.selectedSeats.indexOf(seatId);
  if (idx >= 0) {
    state.selectedSeats.splice(idx, 1);
    elSeat.classList.remove("selected");
  } else {
    if (state.selectedSeats.length >= state.seatCount) {
      return alert(`You can select up to ${state.seatCount} seat(s).`);
    }
    state.selectedSeats.push(seatId);
    elSeat.classList.add("selected");
  }
  updateFare();
}

function updateFare() {
  const base = state.selectedTrain.baseFare[state.selectedClass] || 0;
  el("baseFare").textContent = INR(base);
  el("selectedSeatCount").textContent = state.selectedSeats.length;
  const total = base * state.selectedSeats.length;
  state.totalFare = total;
  el("totalFare").textContent = INR(total);
  el("proceedBtn").disabled = state.selectedSeats.length === 0;
}

function buildPassengerForm() {
  const form = el("passengerForm");
  form.innerHTML = "";
  state.passengersData = [];

  const count = state.selectedSeats.length;
  for (let i = 0; i < count; i++) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <label>Full name</label>
        <input type="text" required placeholder="Name" />
      </div>
      <div>
        <label>Age</label>
        <input type="number" min="1" max="120" required placeholder="Age" />
      </div>
      <div>
        <label>Gender</label>
        <select required>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </select>
      </div>
    `;
    form.appendChild(row);
  }
}

function confirmBooking() {
  // Validate all passenger inputs
  const inputs = el("passengerForm").querySelectorAll("input, select");
  for (const input of inputs) {
    if (!input.value) {
      input.focus();
      return alert("Please fill all passenger details.");
    }
  }

  // Collect passenger data
  state.passengersData = [];
  const rows = el("passengerForm").querySelectorAll(".row");
  rows.forEach((row, idx) => {
    const [nameEl, ageEl, genEl] = row.querySelectorAll("input, select");
    state.passengersData.push({
      seat: state.selectedSeats[idx],
      name: nameEl.value.trim(),
      age: parseInt(ageEl.value, 10),
      gender: genEl.value
    });
  });

  renderSummary();
  el("summarySection").hidden = false;
  window.scrollTo({ top: el("summarySection").offsetTop - 16, behavior: "smooth" });
}

function renderSummary() {
  const s = el("summary");
  const t = state.selectedTrain;
  const data = {
    pnr: `${t.id}${Date.now().toString().slice(-6)}`,
    train: `${t.name} (${t.id})`,
    route: `${t.from} → ${t.to}`,
    depart: t.depart,
    arrive: t.arrive,
    date: state.date,
    cls: state.selectedClass,
    seats: state.selectedSeats,
    passengers: state.passengersData,
    totalFare: state.totalFare
  };

  s.innerHTML = `
    <p><strong>PNR:</strong> ${data.pnr}</p>
    <p><strong>Train:</strong> ${data.train}</p>
    <p><strong>Route:</strong> ${data.route}</p>
    <p><strong>Date:</strong> ${data.date} • <strong>Class:</strong> ${data.cls}</p>
    <p><strong>Departure:</strong> ${data.depart} • <strong>Arrival:</strong> ${data.arrive}</p>
    <hr/>
    <p><strong>Seats:</strong> ${data.seats.join(", ")}</p>
    <p><strong>Passengers:</strong></p>
    <ul>
      ${data.passengers.map(p => `<li>${p.seat} — ${p.name}, ${p.age}, ${p.gender}</li>`).join("")}
    </ul>
    <p><strong>Total fare:</strong> ₹${INR(data.totalFare)}</p>
  `;

  // Save to localStorage (optional)
  localStorage.setItem("lastBooking", JSON.stringify(data));
}

function downloadTicket() {
  const summary = el("summary").innerText;
  const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetApp() {
  state.query = null;
  state.selectedTrain = null;
  state.selectedSeats = [];
  state.totalFare = 0;

  el("resultsSection").hidden = true;
  el("selectionSection").hidden = true;
  el("passengerSection").hidden = true;
  el("summarySection").hidden = true;

  el("searchForm").reset();
}

// Start
document.addEventListener("DOMContentLoaded", init);