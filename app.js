

const INITIAL_EVENTS = [
  { id: "e1", name: "Tech Entrepreneurship Talk", date: "2025-09-10", venue: "Lecture Hall A", slots: 25 },
  { id: "e2", name: "AI in Healthcare Panel",    date: "2025-09-15", venue: "Auditorium 1",  slots: 10 },
  { id: "e3", name: "Cybersecurity Workshop",     date: "2025-09-18", venue: "Lab 3",         slots: 8  },
  { id: "e4", name: "Design Thinking Sprint",     date: "2025-09-22", venue: "Innovation Hub",slots: 5  },
  { id: "e5", name: "Career Fair 2025",           date: "2025-10-01", venue: "Main Hall",     slots: 100},
];

const LS_EVENTS   = "usiu_events_v1";
const LS_BOOKINGS = "usiu_bookings_v1";

let events = [];
let bookings = [];

const tbody = document.getElementById("events-tbody");
const eventSelect = document.getElementById("eventSelect");
const messages = document.getElementById("messages");
const yearSpan = document.getElementById("year");
const confirmationsDiv = document.getElementById("confirmations");
yearSpan.textContent = new Date().getFullYear();

// ====== UTILITIES ======
function saveState() {
  localStorage.setItem(LS_EVENTS, JSON.stringify(events));
  localStorage.setItem(LS_BOOKINGS, JSON.stringify(bookings));
}
function loadState() {
  const ev = localStorage.getItem(LS_EVENTS);
  const bk = localStorage.getItem(LS_BOOKINGS);
  if (ev && bk) { events = JSON.parse(ev); bookings = JSON.parse(bk); }
  else { events = JSON.parse(JSON.stringify(INITIAL_EVENTS)); bookings = []; saveState(); }
}
function showMessage(msg, kind = "success") {
  const p = document.createElement("p");
  p.className = `alert ${kind}`;
  p.textContent = msg;
  messages.prepend(p);
  setTimeout(() => p.remove(), 4000);
}
function formatSlotsBadge(slots) {
  const span = document.createElement("span");
  if (slots > 10) { span.className = "badge ok";  span.textContent = `${slots} left`; }
  else if (slots > 0) { span.className = "badge low"; span.textContent = `${slots} left`; }
  else { span.className = "badge none"; span.textContent = "Full"; }
  return span;
}
function timeTag(isoDate) {
  const t = document.createElement("time");
  t.setAttribute("datetime", isoDate);
  t.textContent = isoDate;
  return t;
}

// ====== RENDER ======
function renderEventsTable() {
  tbody.innerHTML = "";
  events.forEach(ev => {
    const tr = document.createElement("tr");

    const tdName  = document.createElement("td"); tdName.textContent = ev.name;
    const tdDate  = document.createElement("td"); tdDate.appendChild(timeTag(ev.date));
    const tdVenue = document.createElement("td"); tdVenue.textContent = ev.venue;

    const tdSlots = document.createElement("td");
    tdSlots.appendChild(formatSlotsBadge(ev.slots));

    const tdAction = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.textContent = ev.slots > 0 ? "Register" : "Fully Booked";
    btn.disabled = ev.slots === 0;
    btn.setAttribute("aria-label", `${btn.textContent} for ${ev.name}`);
    btn.addEventListener("click", () => quickRegister(ev.id));
    tdAction.appendChild(btn);

    tr.append(tdName, tdDate, tdVenue, tdSlots, tdAction);
    tbody.appendChild(tr);
  });
}

function renderEventOptions() {
  eventSelect.innerHTML = `<option value="">— Select an event —</option>`;
  events.forEach(ev => {
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `${ev.name} — ${ev.date} (${ev.slots} slots)`;
    opt.disabled = ev.slots === 0;
    eventSelect.appendChild(opt);
  });
}

function renderConfirmations() {
  confirmationsDiv.innerHTML = "";
  if (bookings.length === 0) {
    const p = document.createElement("p");
    p.className = "meta";
    p.textContent = "No registrations yet.";
    confirmationsDiv.appendChild(p);
    return;
  }
  // Show latest 5
  [...bookings].slice(-5).reverse().forEach(b => {
    const ev = events.find(e => e.id === b.eventId);
    const wrap = document.createElement("div");
    wrap.className = "confirmation";
    const left = document.createElement("div");
    left.innerHTML = `<strong>${b.name}</strong> (ID: ${b.studentId})`;
    const right = document.createElement("div");
    right.className = "meta";
    right.textContent = `${ev ? ev.name : "Event"} — ${new Date(b.createdAt).toLocaleString()}`;
    wrap.append(left, right);
    confirmationsDiv.appendChild(wrap);
  });
}

// ====== VALIDATION HELPERS ======
const nameEl = document.getElementById("name");
const idEl = document.getElementById("studentId");
const selectEl = document.getElementById("eventSelect");

function setError(input, message) {
  input.setAttribute("aria-invalid", "true");
  const err = document.getElementById(`${input.id}-error`);
  if (err) err.textContent = message || "";
}
function clearError(input) {
  input.removeAttribute("aria-invalid");
  const err = document.getElementById(`${input.id}-error`);
  if (err) err.textContent = "";
}
function validStudentId(s) { return /^\d{7}$/.test(String(s).trim()); }

function validateName() {
  const v = nameEl.value.trim();
  if (!v) return setError(nameEl, "Name is required."), false;
  if (v.length < 2) return setError(nameEl, "Name must be at least 2 characters."), false;
  clearError(nameEl); return true;
}
function validateStudentId() {
  const v = idEl.value.trim();
  if (!v) return setError(idEl, "Student ID is required."), false;
  if (!validStudentId(v)) return setError(idEl, "Student ID must be exactly 7 digits."), false;
  clearError(idEl); return true;
}
function validateSelect() {
  const v = selectEl.value;
  if (!v) return setError(selectEl, "Please select an event."), false;
  clearError(selectEl); return true;
}

// ====== LOGIC ======
function decrementSlot(eventId) {
  const idx = events.findIndex(e => e.id === eventId);
  if (idx === -1) return false;
  if (events[idx].slots <= 0) return false;
  events[idx].slots -= 1;
  return true;
}

function quickRegister(eventId) {
  if (!decrementSlot(eventId)) {
    showMessage("Sorry, that event is fully booked.", "error");
    return;
  }
  bookings.push({
    id: crypto.randomUUID(),
    eventId,
    name: "Quick Register",
    studentId: "N/A",
    createdAt: new Date().toISOString(),
  });
  saveState();
  renderEventsTable();
  renderEventOptions();
  renderConfirmations();
  const ev = events.find(e => e.id === eventId);
  showMessage(`Success! Reserved 1 slot for "${ev.name}".`);
}

function handleFormSubmit(e) {
  e.preventDefault();
  const ok = [validateName(), validateStudentId(), validateSelect()].every(Boolean);
  if (!ok) {
    showMessage("Please fix the highlighted fields.", "error");
    return;
  }
  const name = nameEl.value.trim();
  const studentId = idEl.value.trim();
  const selected = selectEl.value;

  if (!decrementSlot(selected)) {
    showMessage("That event is fully booked. Please pick another.", "error");
    renderEventsTable();
    renderEventOptions();
    return;
  }

  bookings.push({
    id: crypto.randomUUID(),
    eventId: selected,
    name,
    studentId,
    createdAt: new Date().toISOString(),
  });

  saveState();
  renderEventsTable();
  renderEventOptions();
  renderConfirmations();

  const ev = events.find(e => e.id === selected);
  showMessage(`Registered ${name} (ID: ${studentId}) for "${ev.name}".`);

  e.target.reset();
  clearError(nameEl); clearError(idEl); clearError(selectEl);
  nameEl.focus(); // focus management
}

// ====== INIT ======
function init() {
  loadState();
  renderEventsTable();
  renderEventOptions();
  renderConfirmations();
  document.getElementById("register-form").addEventListener("submit", handleFormSubmit);

  // Real-time validation UX
  nameEl.addEventListener("blur", validateName);
  idEl.addEventListener("blur", validateStudentId);
  selectEl.addEventListener("change", validateSelect);
}
init();

// Dev reset helper (run in console if needed):
// localStorage.removeItem("usiu_events_v1"); localStorage.removeItem("usiu_bookings_v1"); location.reload();
