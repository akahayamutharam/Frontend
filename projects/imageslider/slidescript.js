const images = [
    "images/img1.jpg",
    "images/img2.jpg",
    "images/img3.jpg"
];

let current = 0;
const slide = document.getElementById("slide");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

function showImage(index)  {
    slide.src = images[index];
}

nextBtn.addEventListener("click", () => {
    current = (current + 1) % images.length;
    showImage(current);
});

prevBtn.addEventListener("click", () => {
    current = (current - 1 + images.length) % images.length;
    showImage(current);
});

// Auto-slide every 3 sec
setInterval (() => {
    current = (current + 1) % images.length;
    showImage(current);
}, 3000);

// Initial load
showImage(current);