// Keys
const THEME_KEY = "portal-theme";
const COURSES_KEY = "courses";
const ENROLLMENTS_KEY = "enrollments";

// In-memory state
let courses = [];
let enrollments = [];

// Timetable ranges
const times = ["9-10","10-11","11-12"];
const days = ["Mon","Tue","Wed","Thu","Fri"];

/* ===== Theme ===== */
function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
}
function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(theme);
}
document.getElementById("themeToggle").addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-mode");
  const next = isDark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

/* ===== Persistence ===== */
function loadCourses() {
  const saved = localStorage.getItem(COURSES_KEY);
  courses = saved ? JSON.parse(saved) : []; // start empty (dynamic only)
}
function saveCourses() {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}
function loadEnrollments() {
  const saved = localStorage.getItem(ENROLLMENTS_KEY);
  enrollments = saved ? JSON.parse(saved) : [];
  renderEnrollments();
  updateSummary();
  renderTimetable();
}
function saveEnrollments() {
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
}

/* ===== Rendering: Courses ===== */
function renderCourses(filter="") {
  const list = document.getElementById("courseList");
  const filtered = courses.filter(c =>
    c.code.toLowerCase().includes(filter.toLowerCase()) ||
    c.name.toLowerCase().includes(filter.toLowerCase())
  );
  if (filtered.length === 0) {
    list.innerHTML = `<li class="list-group-item sub">No courses match your search</li>`;
    return;
  }
  list.innerHTML = filtered.map(c => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <span class="course-link" onclick="showCourse('${c.code}')">${c.code} • ${c.name}</span>
      <div class="d-flex gap-2">
        <button class="btnx btn-sm" onclick="enroll('${c.code}')">Enroll</button>
        <button class="btn btn-warning btn-sm" onclick="openEditCourse('${c.code}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c.code}')">Delete</button>
      </div>
    </li>
  `).join("");
}

/* ===== Rendering: Enrollments ===== */
function renderEnrollments() {
  const list = document.getElementById("enrollList");
  if (enrollments.length === 0) {
    list.innerHTML = `<li class="list-group-item sub">No courses enrolled yet</li>`;
    updateSummary();
    return;
  }
  list.innerHTML = enrollments.map(c => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <span class="course-link" onclick="showCourse('${c.code}')">${c.code} • ${c.name}</span>
      <button class="btnx btn-sm" onclick="drop('${c.code}')">Drop</button>
    </li>
  `).join("");
  updateSummary();
}

/* ===== Course actions ===== */
function enroll(code) {
  const course = courses.find(c => c.code === code);
  if (!course) return;
  if (enrollments.find(c => c.code === code)) {
    alert("Already enrolled in " + code);
    return;
  }
  // Conflict detection: same day and time
  const conflict = enrollments.find(c =>
    c.schedule && course.schedule &&
    c.schedule.day === course.schedule.day &&
    c.schedule.time === course.schedule.time
  );
  if (conflict) {
    showConflictAlert(`Conflict: ${course.code} overlaps with ${conflict.code} on ${course.schedule.day} at ${course.schedule.time}.`);
    return;
  }
  enrollments.push(course);
  saveEnrollments();
  renderEnrollments();
  renderTimetable();
  hideConflictAlert();
}
function drop(code) {
  enrollments = enrollments.filter(c => c.code !== code);
  saveEnrollments();
  renderEnrollments();
  renderTimetable();
  hideConflictAlert();
}
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear all enrollments?")) return;
  enrollments = [];
  saveEnrollments();
  renderEnrollments();
  renderTimetable();
  hideConflictAlert();
});

/* ===== Search ===== */
document.getElementById("searchInput").addEventListener("input", (e) => {
  renderCourses(e.target.value);
});

/* ===== Course detail modal ===== */
function showCourse(code) {
  const course = courses.find(c => c.code === code);
  if (!course) return;
  document.getElementById("courseTitle").textContent = `${course.code} • ${course.name}`;
  document.getElementById("courseDesc").textContent = course.desc;
  document.getElementById("courseCredits").textContent = course.credits;
  document.getElementById("courseInstructor").textContent = course.instructor;
  document.getElementById("courseSchedule").textContent = `${course.schedule.day}, ${course.schedule.time}`;
  const modal = new bootstrap.Modal(document.getElementById("courseModal"));
  modal.show();
}

/* ===== Edit course modal ===== */
function openEditCourse(code) {
  const course = courses.find(c => c.code === code);
  if (!course) return;
  document.getElementById("editCode").value = course.code;
  document.getElementById("editName").value = course.name;
  document.getElementById("editDesc").value = course.desc;
  document.getElementById("editCredits").value = course.credits;
  document.getElementById("editInstructor").value = course.instructor;
  document.getElementById("editDay").value = course.schedule?.day || "Mon";
  document.getElementById("editTime").value = course.schedule?.time || "9-10";
  new bootstrap.Modal(document.getElementById("editCourseModal")).show();
}

document.getElementById("editCourseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = document.getElementById("editCode").value;
  const course = courses.find(c => c.code === code);
  if (!course) return;

  // If schedule changed, ensure existing enrollment doesn't cause a conflict
  const newDay = document.getElementById("editDay").value;
  const newTime = document.getElementById("editTime").value;
  const enrolledThisCourse = enrollments.find(c => c.code === code);
  if (enrolledThisCourse) {
    const conflict = enrollments.find(c =>
      c.code !== code &&
      c.schedule && c.schedule.day === newDay && c.schedule.time === newTime
    );
    if (conflict) {
      showConflictAlert(`Conflict after edit: ${code} would overlap with ${conflict.code} on ${newDay} at ${newTime}.`);
      return;
    }
  }

  course.name = document.getElementById("editName").value.trim();
  course.desc = document.getElementById("editDesc").value.trim();
  course.credits = parseInt(document.getElementById("editCredits").value, 10);
  course.instructor = document.getElementById("editInstructor").value.trim();
  course.schedule = { day: newDay, time: newTime };

  saveCourses();
  // Update enrollment copy if present
  enrollments = enrollments.map(c => c.code === code ? course : c);
  saveEnrollments();

  renderCourses(document.getElementById("searchInput").value);
  renderEnrollments();
  renderTimetable();
  hideConflictAlert();
  bootstrap.Modal.getInstance(document.getElementById("editCourseModal")).hide();
});

function deleteCourse(code) {
  if (!confirm(`Delete course ${code}?`)) return;
  courses = courses.filter(c => c.code !== code);
  enrollments = enrollments.filter(c => c.code !== code);
  saveCourses();
  saveEnrollments();
  renderCourses(document.getElementById("searchInput").value);
  renderEnrollments();
  updateSummary();
  renderTimetable();
  hideConflictAlert();
}

/* ===== Add course form ===== */
document.getElementById("addCourseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = document.getElementById("newCode").value.trim().toUpperCase();
  const name = document.getElementById("newName").value.trim();
  const desc = document.getElementById("newDesc").value.trim();
  const credits = parseInt(document.getElementById("newCredits").value, 10);
  const instructor = document.getElementById("newInstructor").value.trim();
  const day = document.getElementById("newDay").value;
  const time = document.getElementById("newTime").value;

  if (!code || !name || !desc || !credits || !instructor || !day || !time) {
    alert("Please fill all fields.");
    return;
  }
  if (courses.find(c => c.code === code)) {
    alert("Course code already exists!");
    return;
  }

  const newCourse = { code, name, desc, credits, instructor, schedule: { day, time } };
  courses.push(newCourse);
  saveCourses();

  renderCourses(document.getElementById("searchInput").value);
  updateSummary();
  e.target.reset();
  alert(`Course ${code} added successfully!`);
});

/* ===== Summary ===== */
function updateSummary() {
  const totalCourses = courses.length;
  const enrolledCount = enrollments.length;
  const totalCredits = enrollments.reduce((sum, c) => sum + (c.credits || 0), 0);
  document.getElementById("summaryText").textContent =
    `Available: ${totalCourses} • Enrolled: ${enrolledCount} • Credits: ${totalCredits}`;
}

/* ===== Timetable ===== */
function renderTimetable() {
  const tbody = document.getElementById("timetableBody");
  tbody.innerHTML = "";
  times.forEach(time => {
    let row = `<tr><td>${time}</td>`;
    days.forEach(day => {
      const course = enrollments.find(c => c.schedule && c.schedule.day===day && c.schedule.time===time);
      if (course) {
        row += `<td><div class="course-slot">${course.code}<br>${course.name}</div></td>`;
      } else {
        row += `<td></td>`;
      }
    });
    row += "</tr>";
    tbody.innerHTML += row;
  });
}

/* ===== Conflict alert helpers ===== */
function showConflictAlert(msg) {
  const el = document.getElementById("conflictAlert");
  el.textContent = msg;
  el.classList.remove("d-none");
}
function hideConflictAlert() {
  const el = document.getElementById("conflictAlert");
  el.classList.add("d-none");
}

/* ===== Init ===== */
loadTheme();
loadCourses();
renderCourses();
loadEnrollments();