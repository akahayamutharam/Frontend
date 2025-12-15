const events=[
    {id: 1, name: "Rock Concert", date: "2025-12-15", categoryPrices:{ VIP: 2000, General: 800}},
    {id: 2, name: "Football Match", date: "2025-12-20", categoryPrices:{ VIP: 1500, General: 600}},
    {id: 3, name: "Tech Workshop", date: "2025-12-25", categoryPrices:{ VIP: 1000, General: 400}},
];

const eventsContainer=document.getElementById("events");

events.forEach(event =>{
    const card=document.createElement("div");
    card.className="event-card";
    card.innerHTML=`
    <h3>${event.name}</h3>
    <p>Date: ${event.date}</p>
    <button onclick="openBooking(${event.id})">Book Now</button>
    `;

    eventsContainer.appendChild(card);
});