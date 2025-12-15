const parkingLot = document.getElementById("parkingLot");
const slotNumberInput = document.getElementById("slotNumber");
const bookingForm = document.getElementById("bookingForm");
const summary = document.getElementById("summary");

// Create 20 slots
for (let i = 1; i <= 20; i++) {
    let slot = document.createElement("div");
    slot.classList.add("slot");
    slot.textContent = i;
    slot.dataset.slot = i;

    // Check localStorage
    if (localStorage.getItem("slot_" + i)) {
        slot.classList.add("reserved");
    }

    slot.addEventListener("click", () => {
        if (!slot.classList.contains("reserved")) {
            slotNumberInput.value = i;
        }
    });

    parkingLot.appendChild(slot);
}

// Booking form
bookingForm.addEventListener("submit", function(e) {
    e.preventDefault();

    let slotNum = slotNumberInput.value;
    let hours = document.getElementById("hours").value;

    if (!slotNum) {
        alert("Please select a slot!");
        return;
    }

    let costPerHour = 50;  //Rs-50 per hour
    let totalCost = hours * costPerHour;

    // Mark slot reserved
    let slotDiv = document.querySelector(`[data-slot='${slotNum}']`);
    slotDiv.classList.add("reserved");
    localStorage.setItem("slot_" + slotNum, "reserved");

    // Show summary
    summary.innerHTML = `
        <h3>Booking Summary</h3>
        <p>Slot Number: ${slotNum}</p>
        <p>Hours: ${hours}</p>
        <p><strong>Total Cost: Rs${totalCost}</strong></p>
    `;

    // Reset form
    bookingForm.reset();
    slotNumberInput.value = "";
});