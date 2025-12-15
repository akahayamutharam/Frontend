let selectedEvent=null;

// Open booking modal
function openBooking(eventId){
    selectedEvent=events.find(e => e.id === eventId);
    document.getElementById("eventTitle").textContent=selectedEvent.name;
    document.getElementById("bookingModal").classList.remove("hidden");
    updatePrice();
}

// Close modal
document.getElementById("closeModal").onclick = () => {
    document.getElementById("bookingModal").classList.add("hidden");
};

// Update price automatically
document.getElementById("category").onchange=updatePrice;
function updatePrice(){
    const category=document.getElementById("category").value;
    const price=selectedEvent.categoryPrices[category];
    document.getElementById("priceDisplay").textContent=`Price: Rs.${price}`;
}

// Handle booking form submit
document.getElementById("bookingForm").onsubmit=(e) => {
    e.preventDefault();
    const name=document.getElementById("name").value;
    const email=document.getElementById("email").value;
    const category=document.getElementById("category").value;
    const price=selectedEvent.categoryPrices[category];

    const booking={
        eventName:selectedEvent.name,
        category,
        price,
        userName: name,
        userEmail: email
    };

    saveBooking(booking); // persist booking
    showConfirmation(booking);
};

// save booking to localstorage
function saveBooking(booking){
    let bookings=JSON.parse(localStorage.getItem("bookings")) || [];
    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));
    updateHistory();
}

// show confirmation + QR
function showConfirmation(booking){
    document.getElementById("bookingModal").classList.add("hidden");
    document.getElementById("confirmation").classList.remove("hidden");
    gererateQRCode(booking);
}

// Generate QR Code
function gererateQRCode(booking){
    const qrData=`Event: ${booking.eventName}\nCategory: ${booking.category}\nPrice: Rs.${booking.price}
    \nName: ${booking.userName}`;
    QRCode.toCanvas(document.getElementById("qrcode"),qrData,function(error){
        if(error) console.error(error);
    });
}

// Update booking history list
function updateHistory(){
    const saved=JSON.parse(localStorage.getItem("bookings")) || [];
    const list=document.getElementById("historyList");
    list.innerHTML="";
    saved.forEach(b=>{
        const li=document.createElement("li");
        li.textContent=`${b.eventName} (${b.category}) - Rs.${b.price} for ${b.userName}`;
        li.textContent=`${b.eventName} (${b.category}) - Rs.${b.price} for ${b.userName}`;
        list.appendChild(li);
    });
}

// clear history
document.getElementById("clearHistory").onclick= () => {
    localStorage.removeItem("bookings");
    updateHistory();
    document.getElementById("confirmation").classList.add("hidden");
};

// initialize history on load
window.onload = () =>{
    updateHistory();
    const saved=JSON.parse(localStorage.getItem("bookings")) || [];
    if(saved.length > 0){
        const lastBooking=saved[saved.length - 1];
        showConfirmation(lastBooking);
    }
};