const container = document.getElementById("notes-container");
const addbtn = document.getElementById("add-note");
const searchInput = document.getElementById("search");

function createNote(content = "", color = "#fff8a6", timestamp = new Date().toLocaleString(), x = 100, y = 100) {
    const note = document.createElement("div");
    note.className = "note";
    note.style.background = color;
    note.style.left = x + "px";
    note.style.top = y + "px";

    const controls = document.createElement("div");
    controls.className = "controls";

    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.value = color;
    colorPicker.className = "color-picker";
    colorPicker.oninput = () => {
        note.style.background = colorPicker.value;
        saveNotes();
    };

    const deletbtn = document.createElement("button");
    deletbtn.textContent = "delete";
    deletbtn.className = "delete-btn";
    deletbtn.onclick = () => {
        note.remove();
        saveNotes();
    };

    controls.appendChild(colorPicker);
    controls.appendChild(deletBtn);

    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.oninput = saveNotes;

    const timeLabel = document.createElement("div");
    timeLabel.className = "timestamp";
    timeLabel.textContent = timestamp;

    note.appendChild(controls);
    note.appendChild(textarea);
    note.appendChild(timeLabel);
    container.appendChild(note);

    makeDraggable(note);
}

function saveNotes() {
    const notes = Array.from(document.querySelectorAll(" .note")).map(note => ({
        content: note.querySelector("textarea").value,
        color: note.style.background,
        timestamp: note.querySelector(" .timestamp").textContent,
        x: parseInt(note.style.left),
        y: parseInt(note.style.top)
    }));

    localStorage.setItem("stickyNotes", JSON.stringify(notes));
}

function loadNotes() {
    const saved = JSON.parse(localStorage.getItem("stickyNotes") || "[]");
    saved.forEach(n => createNote(n.content, n.color, n.timestamp, n.x, n.y));
}

function makeDraggable(note) {
    let offsetX, offsetY;

    note.onmousedown = function (e) {
        offsetX = e.clientX - note.offsetLeft;
        offsety = e.clientY - note.offsetTop;
        document.onmousemove = function (e) {
            note.style.left = e.clientX - offsetX + "px";
            note.style.top = e.clienty - offsetX + "px";
        };
        document.onmouseup = function () {
            document.onmousemove = null;
            document.onmouseup = null;
            saveNotes();
        };
    };
}

addbtn.onclick = () => {
    createNote();
    saveNotes();
};

searchInput.oninput = () => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll(".note").forEach(note => {
        const text = note.querySelector("textarea").value.toLowerCase();
        note.style.display = text.includes(query) ? "flex" : "none";
    });
};

loadNotes();