/**
 * ==============================================================================
 * MULTIPLEX MOVIE TICKET BOOKING — FRONTEND CONTROLLER (PYTHON FLASK INTEGRATED)
 * 4 Cinema Screens: Avengers, Interstellar, Titanic, La La Land
 * Combined Priority Queue & FIFO Ticket Booking System
 * ==============================================================================
 */

// Seat matrix constants
const ROWS = ['A', 'B', 'C', 'D'];
const COLS = 6;
const TOTAL_SEATS_PER_SCREEN = 24;

// Sample student names for quick testing
const SAMPLE_STUDENTS = [
  "Dishan", "Lokesh", "Ezekiel", "Kevin", "Rahul", 
  "Priya", "Alex", "Sneha", "Karthik", "Divya", "Ananya"
];

const SAMPLE_PQ_NAMES = [
  "Benny", "Wellesley", "Venkat", "Dr. Mehta", "Mrs. Higgins", "Arjun", "Vikram"
];

// Global state
let globalCustomerId = 200;
let activeMovieId = "endgame";
let selectedSeat = null;
let selectedTicketType = "normal"; // 'normal' | 'priority'

// Registered Priority Customer Pool (synced from Python backend)
let registeredPriorityPool = [
  { id: 101, name: "Benny", priority: 1, priorityLabel: "VIP", emoji: "🔴" },
  { id: 102, name: "Wellesley", priority: 2, priorityLabel: "Senior Citizen", emoji: "🟠" },
  { id: 103, name: "Venkat", priority: 3, priorityLabel: "Regular Priority", emoji: "🟡" }
];

let pqActivityLogList = [];

// ==============================================================================
// 4 CINEMA HALLS DATA STRUCTURE (COMBINED PRIORITY + FIFO QUEUES)
// ==============================================================================

const movies = {
  endgame: {
    id: "endgame",
    title: "Avengers: Endgame",
    shortTitle: "Avengers",
    screen: "Screen 1 (IMAX 3D)",
    screenPill: "Screen 1 • IMAX 3D",
    time: "6:30 PM",
    genreRun: "Action • 3h 02m",
    date: "21 September 2026",
    posterIcon: "🛡️",
    posterTitle: "AVENGERS",
    posterSub: "ENDGAME",
    themeColor: "#06b6d4",
    posterGradient: "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #450a0a 100%)",
    initialQueue: [
      { name: "Dishan", seat: "A1", priority: 4, priorityLabel: "Normal", emoji: "🔵" },
      { name: "Lokesh", seat: "A2", priority: 4, priorityLabel: "Normal", emoji: "🔵" },
      { name: "Kevin", seat: "B4", priority: 4, priorityLabel: "Normal", emoji: "🔵" }
    ],
    preBooked: ["D5", "D6"],
    queue: [],
    seats: new Map(),
    activityLog: []
  },

  interstellar: {
    id: "interstellar",
    title: "Interstellar",
    shortTitle: "Interstellar",
    screen: "Screen 2 (70mm IMAX)",
    screenPill: "Screen 2 • 70mm IMAX",
    time: "8:15 PM",
    genreRun: "Sci-Fi • 2h 49m",
    date: "21 September 2026",
    posterIcon: "🚀",
    posterTitle: "INTER-",
    posterSub: "STELLAR",
    themeColor: "#f59e0b",
    posterGradient: "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #2e1065 100%)",
    initialQueue: [
      { name: "Cooper", seat: "B1", priority: 4, priorityLabel: "Normal", emoji: "🔵" },
      { name: "Murph", seat: "B2", priority: 4, priorityLabel: "Normal", emoji: "🔵" },
      { name: "Brand", seat: "C3", priority: 4, priorityLabel: "Normal", emoji: "🔵" }
    ],
    preBooked: ["A5", "A6", "D1", "D2"],
    queue: [],
    seats: new Map(),
    activityLog: []
  },

  titanic: {
    id: "titanic",
    title: "Titanic",
    shortTitle: "Titanic",
    screen: "Screen 3 (4K Laser Dolby)",
    screenPill: "Screen 3 • 4K Laser",
    time: "5:00 PM",
    genreRun: "Romance • 3h 14m",
    date: "21 September 2026",
    posterIcon: "🚢",
    posterTitle: "TITANIC",
    posterSub: "DOLBY 3D",
    themeColor: "#38bdf8",
    posterGradient: "linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0c4a6e 100%)",
    initialQueue: [
      { name: "Jack", seat: "C1", priority: 4, priorityLabel: "Normal", emoji: "🔵" },
      { name: "Rose", seat: "C2", priority: 4, priorityLabel: "Normal", emoji: "🔵" }
    ],
    preBooked: ["A1", "A2", "B5", "B6", "C5", "C6"],
    queue: [],
    seats: new Map(),
    activityLog: []
  },

  lalaland: {
    id: "lalaland",
    title: "La La Land",
    shortTitle: "La La Land",
    screen: "Screen 4 (Dolby Cinema Sunset)",
    screenPill: "Screen 4 • Sunset Dolby",
    time: "7:00 PM",
    genreRun: "Musical • 2h 08m",
    date: "21 September 2026",
    posterIcon: "🎷",
    posterTitle: "LA LA",
    posterSub: "LAND",
    themeColor: "#ec4899",
    posterGradient: "linear-gradient(135deg, #581c87 0%, #831843 50%, #f43f5e 100%)",
    initialQueue: [
      { name: "Sebastian", seat: "A3", priority: 4, priorityLabel: "Normal", emoji: "🔵" },
      { name: "Mia", seat: "A4", priority: 4, priorityLabel: "Normal", emoji: "🔵" }
    ],
    preBooked: ["B1", "B2", "C1", "C2", "D3", "D4"],
    queue: [],
    seats: new Map(),
    activityLog: []
  }
};

// Priority Level Metadata
const PRIORITY_META = {
  1: { label: "VIP", emoji: "🔴", cssClass: "node-p1", desc: "Priority 1" },
  2: { label: "Senior Citizen", emoji: "🟠", cssClass: "node-p2", desc: "Priority 2" },
  3: { label: "Regular Priority", emoji: "🟡", cssClass: "node-p3", desc: "Priority 3" },
  4: { label: "Normal", emoji: "🔵", cssClass: "node-normal", desc: "Normal Ticket" }
};

// ==============================================================================
// CORE QUEUE OPERATIONS (PRIORITY-BASED ENQUEUE + FIFO TIE-BREAKING)
// ==============================================================================

function getActiveMovie() {
  return movies[activeMovieId];
}

/**
 * Enqueue: Inserts customer based on priority rank (1 is highest, 4 is Normal).
 * If equal priority, maintains strict FIFO order by inserting after existing ones.
 */
function enqueue(movieId, customer) {
  const queue = movies[movieId].queue;
  let insertIdx = queue.length;
  for (let i = 0; i < queue.length; i++) {
    if (customer.priority < queue[i].priority) {
      insertIdx = i;
      break;
    }
  }
  queue.splice(insertIdx, 0, customer);
  return insertIdx;
}

/**
 * Dequeue: Removes customer from FRONT (highest priority / earliest arrival)
 */
function dequeue(movieId) {
  if (isEmpty(movieId)) return null;
  return movies[movieId].queue.shift();
}

function peek(movieId) {
  if (isEmpty(movieId)) return null;
  return movies[movieId].queue[0];
}

function isEmpty(movieId) {
  return movies[movieId].queue.length === 0;
}

function clearQueue(movieId) {
  movies[movieId].queue = [];
}

// ==============================================================================
// PYTHON FLASK BACKEND SYNC
// ==============================================================================

const isPythonBackend = window.location.protocol.startsWith("http");

async function syncWithPythonBackend() {
  if (!isPythonBackend) return;
  try {
    const res = await fetch("/api/status");
    if (!res.ok) return;
    const data = await res.json();
    if (data.success) {
      // Sync screens
      if (data.screens) {
        Object.keys(data.screens).forEach(mId => {
          const pyScreen = data.screens[mId];
          if (movies[mId]) {
            movies[mId].queue = pyScreen.queue || [];
            if (pyScreen.seats) {
              movies[mId].seats.clear();
              Object.entries(pyScreen.seats).forEach(([s, st]) => {
                movies[mId].seats.set(s, st);
              });
            }
            if (pyScreen.activityLog) {
              movies[mId].activityLog = pyScreen.activityLog;
            }
          }
        });
      }

      // Sync registered Priority Pool
      if (data.priorityPool) {
        registeredPriorityPool = data.priorityPool;
      }
      if (data.priorityActivityLog) {
        pqActivityLogList = data.priorityActivityLog;
      }

      renderMovieSelectorGrid();
      renderSeatGrid();
      updateQueueVisualization();
      updateStatistics();
      renderActivityLog();
      populatePriorityCustomerDropdown();
      renderPriorityPoolView();
      updateAnalyticsCharts();
    }
  } catch (err) {
    console.log("Running in standalone browser mode.");
  }
}

// ==============================================================================
// INITIALIZATION & LIFECYCLE
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initAllMoviesData();
  renderMovieSelectorGrid();
  updateActiveMovieDisplay();
  renderSeatGrid();
  updateQueueVisualization();
  updateStatistics();
  populatePriorityCustomerDropdown();
  renderPriorityPoolView();
  attachEventListeners();
  initAnalyticsCharts();
  renderAnalyticsSummary();
  syncWithPythonBackend();
});

function initAllMoviesData() {
  Object.keys(movies).forEach(mId => {
    const movie = movies[mId];
    movie.queue = [];
    movie.seats.clear();
    movie.activityLog = [];

    // All 24 seats start as 'available'
    ROWS.forEach(row => {
      for (let col = 1; col <= COLS; col++) {
        movie.seats.set(`${row}${col}`, 'available');
      }
    });

    // Mark pre-booked seats
    movie.preBooked.forEach(seatCode => {
      movie.seats.set(seatCode, 'booked');
    });

    // Enqueue initial demo queue
    movie.initialQueue.forEach(item => {
      const customer = {
        id: globalCustomerId++,
        name: item.name,
        seat: item.seat,
        movieId: mId,
        movieTitle: movie.title,
        priority: item.priority || 4,
        priorityLabel: item.priorityLabel || "Normal",
        emoji: item.emoji || "🔵",
        time: getCurrentTimeFormatted()
      };
      movie.queue.push(customer);
      movie.seats.set(item.seat, 'queued');
    });

    movie.activityLog.push({
      operation: "INIT",
      message: `Screen initialized with ${movie.queue.length} customers in booking queue.`,
      time: getCurrentTimeFormatted()
    });
  });
}

// ==============================================================================
// MOVIE SELECTION & SWITCHING
// ==============================================================================

function renderMovieSelectorGrid() {
  const container = document.getElementById("movieSelectorGrid");
  if (!container) return;
  container.innerHTML = "";

  Object.keys(movies).forEach(mId => {
    const movie = movies[mId];
    const isCurrent = mId === activeMovieId;

    let availableCount = 0;
    movie.seats.forEach(status => {
      if (status === 'available') availableCount++;
    });

    const card = document.createElement("div");
    card.className = `movie-select-card ${isCurrent ? 'active-movie-card' : ''}`;
    card.style.setProperty("--movie-theme", movie.themeColor);

    card.innerHTML = `
      <div class="m-select-poster" style="background: ${movie.posterGradient || 'linear-gradient(135deg, #1e293b, #0f172a)'}">
        <span class="m-select-icon">${movie.posterIcon}</span>
      </div>
      <div class="m-select-info">
        <h4 class="m-select-title">${movie.shortTitle}</h4>
        <div class="m-select-meta">
          <span>${movie.screenPill.split('•')[0]}</span>
          <span>•</span>
          <span>${movie.time}</span>
        </div>
        <div class="m-select-status">
          <span class="m-pill m-pill-queue">Queue: <strong>${movie.queue.length}</strong></span>
          <span class="m-pill m-pill-avail">${availableCount} left</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => selectMovie(mId));
    container.appendChild(card);
  });
}

function selectMovie(movieId) {
  if (activeMovieId === movieId) return;
  activeMovieId = movieId;
  selectedSeat = null;

  renderMovieSelectorGrid();
  updateActiveMovieDisplay();
  renderSeatGrid();
  updateSelectedSeatDisplay();
  updateQueueVisualization();
  updateStatistics();
  renderActivityLog();

  const movie = getActiveMovie();
  setFeedbackBanner("info", `Switched to <strong>${movie.title}</strong> (${movie.screenPill}). Live FIFO & Priority Queue updated.`);
}

function updateActiveMovieDisplay() {
  const movie = getActiveMovie();
  document.getElementById("movieTitle").textContent = movie.title;
  document.getElementById("movieScreenPill").textContent = movie.screenPill;
  document.getElementById("movieShowTime").textContent = movie.time;
  document.getElementById("movieScreenName").textContent = movie.screen;
  document.getElementById("movieGenreRun").textContent = movie.genreRun;

  const posterMock = document.getElementById("moviePosterMock");
  if (posterMock) {
    posterMock.style.background = movie.posterGradient;
    document.getElementById("moviePosterIcon").textContent = movie.posterIcon;
    document.getElementById("moviePosterTitle").textContent = movie.posterTitle;
    document.getElementById("moviePosterSub").textContent = movie.posterSub;
  }

  const seatMovieName = document.getElementById("seatMovieName");
  if (seatMovieName) seatMovieName.textContent = movie.shortTitle;

  const queueMovieTitle = document.getElementById("queueMovieTitle");
  if (queueMovieTitle) queueMovieTitle.textContent = movie.title;
}

// ==============================================================================
// SEAT MATRIX RENDERING
// ==============================================================================

function renderSeatGrid() {
  const container = document.getElementById("seatsGrid");
  if (!container) return;
  container.innerHTML = "";

  const movie = getActiveMovie();

  ROWS.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "seat-row";

    const labelDiv = document.createElement("span");
    labelDiv.className = "row-label";
    labelDiv.textContent = row;
    rowDiv.appendChild(labelDiv);

    for (let col = 1; col <= COLS; col++) {
      const seatCode = `${row}${col}`;
      const status = movie.seats.get(seatCode) || 'available';

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `seat-btn ${status}`;
      btn.dataset.seat = seatCode;
      btn.textContent = col;

      if (selectedSeat === seatCode) {
        btn.classList.add("selected");
      }

      if (status === 'available') {
        btn.title = `Seat ${seatCode}: Available (Click to select)`;
        btn.addEventListener("click", () => handleSeatSelect(seatCode));
      } else if (status === 'queued') {
        btn.title = `Seat ${seatCode}: In Waiting Queue`;
        btn.disabled = true;
      } else if (status === 'booked') {
        btn.title = `Seat ${seatCode}: Booked / Confirmed`;
        btn.disabled = true;
      }

      rowDiv.appendChild(btn);
    }

    container.appendChild(rowDiv);
  });

  updateAvailableSeatsCount();
}

function handleSeatSelect(seatCode) {
  const movie = getActiveMovie();
  if (movie.seats.get(seatCode) !== 'available') return;

  selectedSeat = (selectedSeat === seatCode) ? null : seatCode;
  renderSeatGrid();
  updateSelectedSeatDisplay();
}

function updateSelectedSeatDisplay() {
  const display = document.getElementById("selectedSeatDisplay");
  if (!display) return;

  if (selectedSeat) {
    display.innerHTML = `
      <span class="seat-pill-active">
        <span>💺 Seat <strong>${selectedSeat}</strong></span>
        <span style="font-size: 0.75rem; color: #a5f3fc;">(${getActiveMovie().shortTitle})</span>
      </span>
    `;
  } else {
    display.innerHTML = `<span class="placeholder-seat">Click an available seat in the grid</span>`;
  }
}

function getFirstAvailableSeat() {
  const movie = getActiveMovie();
  for (const r of ROWS) {
    for (let c = 1; c <= COLS; c++) {
      const code = `${r}${c}`;
      if (movie.seats.get(code) === 'available') {
        return code;
      }
    }
  }
  return null;
}

function updateAvailableSeatsCount() {
  const movie = getActiveMovie();
  let available = 0;
  let booked = 0;
  movie.seats.forEach(status => {
    if (status === 'available') available++;
    if (status === 'booked') booked++;
  });

  const badge = document.getElementById("availableSeatBadge");
  if (badge) badge.textContent = `${available} Available`;

  const statAvail = document.getElementById("statAvailableSeats");
  if (statAvail) statAvail.textContent = available;

  const statBooked = document.getElementById("statBookedSeats");
  if (statBooked) statBooked.textContent = booked;
}

// ==============================================================================
// TICKET TYPE SWITCHING & PRIORITY CUSTOMER DROPDOWN
// ==============================================================================

function handleTicketTypeChange(type) {
  selectedTicketType = type;

  const labelNormal = document.getElementById("labelTypeNormal");
  const labelPriority = document.getElementById("labelTypePriority");
  const normalGroup = document.getElementById("normalCustomerFieldGroup");
  const priorityGroup = document.getElementById("priorityCustomerFieldGroup");
  const btnBook = document.getElementById("btnBookTicket");
  const radioNormal = document.getElementById("ticketTypeNormal");
  const radioPriority = document.getElementById("ticketTypePriority");

  if (type === "priority") {
    if (labelNormal) labelNormal.classList.remove("active");
    if (labelPriority) labelPriority.classList.add("active");
    if (normalGroup) normalGroup.style.display = "none";
    if (priorityGroup) priorityGroup.style.display = "block";
    if (radioPriority) radioPriority.checked = true;
    if (btnBook) {
      btnBook.innerHTML = `⚡ BOOK PRIORITY TICKET`;
      btnBook.className = "btn btn-pq-add";
    }
  } else {
    if (labelNormal) labelNormal.classList.add("active");
    if (labelPriority) labelPriority.classList.remove("active");
    if (normalGroup) normalGroup.style.display = "block";
    if (priorityGroup) priorityGroup.style.display = "none";
    if (radioNormal) radioNormal.checked = true;
    if (btnBook) {
      btnBook.innerHTML = `📥 BOOK NORMAL TICKET`;
      btnBook.className = "btn btn-primary";
    }
  }
}

function populatePriorityCustomerDropdown() {
  const select = document.getElementById("priorityCustomerSelect");
  const badge = document.getElementById("priorityPoolCountBadge");
  const headerBadge = document.getElementById("poolBadgeHeader");

  if (badge) badge.textContent = `${registeredPriorityPool.length} in Pool`;
  if (headerBadge) headerBadge.textContent = `${registeredPriorityPool.length} Available`;

  if (!select) return;
  select.innerHTML = "";

  if (registeredPriorityPool.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "⚠️ Priority Pool is Empty — Register customer below";
    select.appendChild(opt);
    return;
  }

  registeredPriorityPool.forEach(cust => {
    const opt = document.createElement("option");
    opt.value = cust.id;
    opt.dataset.priority = cust.priority;
    const meta = PRIORITY_META[cust.priority] || PRIORITY_META[3];
    opt.textContent = `${cust.name} — ${meta.emoji} ${meta.label} — Priority ${cust.priority}`;
    select.appendChild(opt);
  });
}

function renderPriorityPoolView() {
  const container = document.getElementById("pqRailContainer");
  const emptyState = document.getElementById("pqEmptyState");
  const statTotal = document.getElementById("pqStatTotal");
  const statFront = document.getElementById("pqStatFront");

  if (statTotal) statTotal.textContent = registeredPriorityPool.length;

  if (!container) return;

  if (registeredPriorityPool.length === 0) {
    container.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    if (statFront) statFront.textContent = "None (Empty)";
    return;
  }

  container.style.display = "flex";
  if (emptyState) emptyState.style.display = "none";

  const frontCust = registeredPriorityPool[0];
  if (statFront) {
    statFront.textContent = `${frontCust.name} (${frontCust.emoji || '🔴'} P${frontCust.priority})`;
  }

  container.innerHTML = "";

  registeredPriorityPool.forEach((customer, index) => {
    const isFront = index === 0;
    const meta = PRIORITY_META[customer.priority] || PRIORITY_META[3];

    const node = document.createElement("div");
    node.className = `pq-node ${meta.cssClass} ${isFront ? 'pq-is-front' : ''}`;

    node.innerHTML = `
      ${isFront ? '<span class="pq-front-chip">FRONT • HIGHEST PRIORITY</span>' : ''}
      <span class="pq-node-pos">#${index + 1}</span>
      <div class="pq-node-avatar">${customer.name.charAt(0).toUpperCase()}</div>
      <div class="pq-node-info">
        <div class="pq-node-name">${escapeHtml(customer.name)}</div>
        <div class="pq-node-type">${meta.emoji} ${meta.label} — Priority ${customer.priority}</div>
      </div>
      <div class="pq-node-badge">P${customer.priority}</div>
    `;

    container.appendChild(node);

    if (index < registeredPriorityPool.length - 1) {
      const conn = document.createElement("div");
      conn.className = "pq-connector";
      conn.innerHTML = `<span class="pq-connector-dot"></span><span class="pq-connector-dot"></span>`;
      container.appendChild(conn);
    }
  });
}

// ==============================================================================
// LIVE QUEUE VISUALIZER RENDERING (COMBINED FIFO & PRIORITY)
// ==============================================================================

function updateQueueVisualization() {
  const rail = document.getElementById("queueRail");
  const emptyState = document.getElementById("emptyQueueState");
  const frontMarker = document.getElementById("frontMarker");
  const rearMarker = document.getElementById("rearMarker");

  if (!rail) return;

  const movie = getActiveMovie();

  if (isEmpty(activeMovieId)) {
    rail.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    if (frontMarker) frontMarker.style.opacity = "0.3";
    if (rearMarker) rearMarker.style.opacity = "0.3";
    return;
  }

  rail.style.display = "flex";
  if (emptyState) emptyState.style.display = "none";
  if (frontMarker) frontMarker.style.opacity = "1";
  if (rearMarker) rearMarker.style.opacity = "1";

  rail.innerHTML = "";

  movie.queue.forEach((customer, index) => {
    const isFront = index === 0;
    const isRear = index === movie.queue.length - 1;
    const meta = PRIORITY_META[customer.priority] || PRIORITY_META[4];

    const node = document.createElement("div");
    node.className = `queue-node ${meta.cssClass} ${isFront ? "is-front" : ""} ${isRear ? "is-rear" : ""}`;
    node.id = `qnode-${customer.id}`;

    let posText = `#${index + 1}`;
    if (isFront && isRear) posText = `#1 (FRONT & REAR)`;
    else if (isFront) posText = `#1 (FRONT)`;
    else if (isRear) posText = `#${index + 1} (REAR)`;

    let actionHtml = '';
    if (isFront) {
      actionHtml = `<button type="button" class="node-confirm-btn" id="cardConfirmBtn">🎟️ Confirm / Serve</button>`;
    } else {
      actionHtml = `<span class="node-waiting-tag">⏳ In Line</span>`;
    }

    let priorityBadgeTag = '';
    if (customer.priority === 1) {
      priorityBadgeTag = `<span class="node-priority-tag tag-p1">🔴 VIP • P1</span>`;
    } else if (customer.priority === 2) {
      priorityBadgeTag = `<span class="node-priority-tag tag-p2">🟠 Senior • P2</span>`;
    } else if (customer.priority === 3) {
      priorityBadgeTag = `<span class="node-priority-tag tag-p3">🟡 Priority • P3</span>`;
    } else {
      priorityBadgeTag = `<span class="node-priority-tag tag-normal">🔵 Normal (FIFO)</span>`;
    }

    node.innerHTML = `
      <span class="node-pos-badge">${posText}</span>
      <div class="node-avatar">${customer.name.charAt(0).toUpperCase()}</div>
      <div class="node-name" title="${escapeHtml(customer.name)}">${escapeHtml(customer.name)}</div>
      ${priorityBadgeTag}
      <div class="node-seat-pill">Seat: <strong>${customer.seat}</strong></div>
      <div class="node-meta">Joined: ${customer.time}</div>
      ${actionHtml}
    `;

    rail.appendChild(node);

    if (isFront) {
      const cardBtn = node.querySelector("#cardConfirmBtn");
      if (cardBtn) {
        cardBtn.addEventListener("click", () => handleConfirmTicket(true));
      }
    }

    if (index < movie.queue.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "queue-arrow";
      arrow.innerHTML = `<span>➔</span><span class="queue-arrow-label">next</span>`;
      rail.appendChild(arrow);
    }
  });

  rail.scrollLeft = 0;
}

function updateStatistics() {
  const movie = getActiveMovie();
  const statCount = document.getElementById("statQueueCount");
  const statNext = document.getElementById("statNextCustomer");

  if (statCount) statCount.textContent = movie.queue.length;

  if (statNext) {
    if (!isEmpty(activeMovieId)) {
      const front = movie.queue[0];
      const pText = front.priority < 4 ? ` [${front.priorityLabel}]` : '';
      statNext.textContent = `${front.name}${pText} (${front.seat})`;
    } else {
      statNext.textContent = "None (Queue Empty)";
    }
  }

  updateAvailableSeatsCount();
  renderMovieSelectorGrid();
}

// ==============================================================================
// USER ACTIONS: BOOKING (NORMAL OR PRIORITY), SERVE, PEEK, CLEAR
// ==============================================================================

async function handleBookingSubmit() {
  const movie = getActiveMovie();

  // Validate Seat
  let seatToBook = selectedSeat;
  if (!seatToBook) {
    seatToBook = getFirstAvailableSeat();
    if (!seatToBook) {
      alert(`Housefull for ${movie.title}! No available seats remaining.`);
      return;
    }
    setFeedbackBanner("info", `Auto-assigned first available seat: ${seatToBook} for ${movie.shortTitle}`);
  }

  if (selectedTicketType === "priority") {
    // Priority Ticket Flow
    const select = document.getElementById("priorityCustomerSelect");
    if (!select || !select.value) {
      alert("Please select a registered Priority Customer from the dropdown.");
      return;
    }

    const priorityCustId = parseInt(select.value, 10);
    const poolIdx = registeredPriorityPool.findIndex(c => c.id === priorityCustId);
    if (poolIdx === -1) {
      alert("Selected priority customer is no longer available in the pool.");
      return;
    }

    const priorityCust = registeredPriorityPool.splice(poolIdx, 1)[0];

    const customer = {
      id: priorityCust.id,
      name: priorityCust.name,
      seat: seatToBook,
      movieId: activeMovieId,
      movieTitle: movie.title,
      priority: priorityCust.priority,
      priorityLabel: priorityCust.priorityLabel,
      emoji: priorityCust.emoji,
      time: getCurrentTimeFormatted()
    };

    const insertIdx = enqueue(activeMovieId, customer);
    movie.seats.set(seatToBook, 'queued');

    selectedSeat = null;
    updateSelectedSeatDisplay();
    populatePriorityCustomerDropdown();
    renderPriorityPoolView();
    renderSeatGrid();
    updateQueueVisualization();
    updateStatistics();

    const jumpMsg = insertIdx < movie.queue.length - 1 ? ` (Jumped ahead to position #${insertIdx + 1})` : '';
    setFeedbackBanner("success", `⚡ Priority Ticket Booked: <strong>${customer.name}</strong> (${customer.emoji} ${customer.priorityLabel} — P${customer.priority}) enqueued for <strong>${movie.shortTitle}</strong> (Seat ${customer.seat})${jumpMsg}!`);
    addLogEntry("PRIORITY_BOOKING", `⚡ <strong>${customer.name}</strong> booked as ${customer.emoji} ${customer.priorityLabel} (Priority ${customer.priority}) for Seat <strong>${customer.seat}</strong> at position #${insertIdx + 1}`);

    if (isPythonBackend) {
      fetch("/api/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: activeMovieId,
          ticketType: "priority",
          priorityCustomerId: priorityCust.id,
          seat: seatToBook
        })
      }).catch(() => {});
    }

  } else {
    // Normal Ticket Flow
    const nameInput = document.getElementById("customerNameInput");
    const name = nameInput.value.trim();

    if (!name) {
      alert("Please enter a customer/student name for the normal ticket.");
      nameInput.focus();
      return;
    }

    const customer = {
      id: globalCustomerId++,
      name: name,
      seat: seatToBook,
      movieId: activeMovieId,
      movieTitle: movie.title,
      priority: 4,
      priorityLabel: "Normal",
      emoji: "🔵",
      time: getCurrentTimeFormatted()
    };

    const insertIdx = enqueue(activeMovieId, customer);
    movie.seats.set(seatToBook, 'queued');

    nameInput.value = "";
    selectedSeat = null;
    updateSelectedSeatDisplay();

    renderSeatGrid();
    updateQueueVisualization();
    updateStatistics();

    setFeedbackBanner("success", `✅ Normal Ticket Enqueued: <strong>${customer.name}</strong> joined at REAR for <strong>${movie.shortTitle}</strong> (Seat ${customer.seat}).`);
    addLogEntry("ENQUEUE", `<strong>${customer.name}</strong> joined the queue at REAR (Seat <strong>${customer.seat}</strong>).`);

    if (isPythonBackend) {
      fetch("/api/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: activeMovieId,
          ticketType: "normal",
          name: customer.name,
          seat: seatToBook
        })
      }).catch(() => {});
    }
  }

  updateAnalyticsCharts();
}

/**
 * Register Priority Customer into Priority Pool
 */
function handleRegisterPriority() {
  const nameInput = document.getElementById("regPqName");
  const select = document.getElementById("regPqPriority");
  if (!nameInput || !select) return;

  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter a name for the priority customer.");
    nameInput.focus();
    return;
  }

  const priorityVal = parseInt(select.value, 10);
  const meta = PRIORITY_META[priorityVal] || PRIORITY_META[3];

  const customer = {
    id: globalCustomerId++,
    name: name,
    priority: priorityVal,
    priorityLabel: meta.label,
    emoji: meta.emoji,
    time: getCurrentTimeFormatted()
  };

  // Insert sorted by priority into pool
  let insertIdx = registeredPriorityPool.length;
  for (let i = 0; i < registeredPriorityPool.length; i++) {
    if (customer.priority < registeredPriorityPool[i].priority) {
      insertIdx = i;
      break;
    }
  }
  registeredPriorityPool.splice(insertIdx, 0, customer);

  nameInput.value = "";
  populatePriorityCustomerDropdown();
  renderPriorityPoolView();

  setFeedbackBanner("success", `⚡ Registered <strong>${customer.name}</strong> as ${customer.emoji} ${customer.priorityLabel} (Priority ${customer.priority}). Available now in the Priority Customer dropdown!`);

  if (isPythonBackend) {
    fetch("/api/priority-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customer.name, priority: customer.priority })
    }).catch(() => {});
  }
}

/**
 * Confirm Ticket: DEQUEUE highest-priority customer from FRONT
 */
function handleConfirmTicket(showModal = true) {
  const movie = getActiveMovie();

  if (isEmpty(activeMovieId)) {
    setFeedbackBanner("warning", `⚠️ Queue is Empty for ${movie.title}! No waiting customers.`);
    addLogEntry("DEQUEUE", `Attempted ticket confirmation, but queue is empty.`);
    return;
  }

  const frontNode = document.querySelector(".queue-node.is-front");
  if (frontNode) {
    frontNode.classList.add("removing");
  }

  setTimeout(() => {
    // Core Operation: queue.shift() (always serves FRONT / highest priority)
    const servedCustomer = dequeue(activeMovieId);
    if (!servedCustomer) return;

    movie.seats.set(servedCustomer.seat, 'booked');

    renderSeatGrid();
    updateQueueVisualization();
    updateStatistics();

    const servedMsg = `${servedCustomer.name} has been served.`;
    const nextCust = peek(activeMovieId);
    const nextMsg = nextCust ? `Next Customer: ${nextCust.emoji || '🔵'} ${nextCust.name} — ${nextCust.priorityLabel}` : `Queue for this screen is now empty.`;

    setFeedbackBanner("served", `🎟️ <strong>${servedMsg}</strong> ${nextMsg}`);
    addLogEntry("DEQUEUE", `<strong>${servedMsg}</strong> Confirmed Seat <strong>${servedCustomer.seat}</strong> for ${movie.shortTitle}.`);

    if (isPythonBackend) {
      fetch("/api/dequeue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: activeMovieId })
      }).catch(() => {});
    }

    if (showModal) {
      showTicketModal(servedCustomer);
    }

    updateAnalyticsCharts();
  }, 220);
}

const handleDequeue = handleConfirmTicket;

function handlePeek() {
  const movie = getActiveMovie();

  if (isEmpty(activeMovieId)) {
    setFeedbackBanner("warning", `⚠️ Queue is Empty for ${movie.title}!`);
    addLogEntry("PEEK", `Checked FRONT: Queue is empty.`);
    return;
  }

  const frontCustomer = peek(activeMovieId);
  const frontNode = document.querySelector(".queue-node.is-front");
  if (frontNode) {
    frontNode.classList.remove("peek-highlight");
    void frontNode.offsetWidth;
    frontNode.classList.add("peek-highlight");

    setTimeout(() => {
      if (frontNode) frontNode.classList.remove("peek-highlight");
    }, 2000);
  }

  const pDesc = frontCustomer.priority < 4 ? ` [${frontCustomer.emoji} ${frontCustomer.priorityLabel} — P${frontCustomer.priority}]` : ' [🔵 Normal Ticket]';
  setFeedbackBanner("peek", `👁️ Next Customer in Queue: <strong>${frontCustomer.name}</strong>${pDesc} (Seat ${frontCustomer.seat}).`);
  addLogEntry("PEEK", `Inspected FRONT: Next customer is <strong>${frontCustomer.name}</strong>${pDesc} (Seat ${frontCustomer.seat})`);
}

function handleClearQueue() {
  const movie = getActiveMovie();

  if (isEmpty(activeMovieId)) {
    setFeedbackBanner("info", `Queue for ${movie.title} is already empty.`);
    return;
  }

  const count = movie.queue.length;
  movie.queue.forEach(cust => {
    if (movie.seats.get(cust.seat) === 'queued') {
      movie.seats.set(cust.seat, 'available');
    }
  });

  clearQueue(activeMovieId);
  selectedSeat = null;
  updateSelectedSeatDisplay();

  renderSeatGrid();
  updateQueueVisualization();
  updateStatistics();

  setFeedbackBanner("warning", `🗑️ Cleared ${count} waiting customer(s) from ${movie.shortTitle} queue.`);
  addLogEntry("CLEAR", `Queue cleared (${count} waiting customers removed).`);

  if (isPythonBackend) {
    fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId: activeMovieId })
    }).catch(() => {});
  }

  updateAnalyticsCharts();
}

let isAutoConfirming = false;
function handleAutoConfirm() {
  if (isEmpty(activeMovieId)) {
    setFeedbackBanner("warning", "Queue is already empty! Add customers first.");
    return;
  }
  if (isAutoConfirming) return;

  isAutoConfirming = true;
  setFeedbackBanner("info", `⚡ Auto-Confirming all waiting customers for ${getActiveMovie().shortTitle} in priority order...`);

  function confirmNext() {
    if (isEmpty(activeMovieId)) {
      isAutoConfirming = false;
      setFeedbackBanner("success", `🎉 All waiting customers for ${getActiveMovie().shortTitle} have been confirmed!`);
      return;
    }
    handleConfirmTicket(false);
    setTimeout(confirmNext, 600);
  }

  confirmNext();
}

// ==============================================================================
// MODAL & FEEDBACK HELPERS
// ==============================================================================

function showTicketModal(customer) {
  const overlay = document.getElementById("ticketModalOverlay");
  if (!overlay) return;

  const movie = movies[customer.movieId] || getActiveMovie();

  document.getElementById("modalTicketMovieTitle").textContent = movie.title;
  document.getElementById("ticketCustomerName").textContent = customer.name;
  document.getElementById("ticketSeat").textContent = customer.seat;
  document.getElementById("modalTicketDateTime").textContent = `${movie.date} • ${movie.time}`;
  document.getElementById("modalTicketScreen").textContent = movie.screen;

  const barcodeNum = document.getElementById("modalTicketBarcode");
  if (barcodeNum) {
    const randomHex = Math.floor(Math.random() * 8999 + 1000);
    barcodeNum.textContent = `TKT-${movie.shortTitle.toUpperCase().replace(/\s+/g, '')}-P${customer.priority || 4}-${randomHex}`;
  }

  overlay.style.display = "flex";
}

function closeTicketModal() {
  const overlay = document.getElementById("ticketModalOverlay");
  if (overlay) overlay.style.display = "none";
}

function setFeedbackBanner(type, messageHtml) {
  const banner = document.getElementById("actionFeedbackBanner");
  const icon = document.getElementById("feedbackIcon");
  const text = document.getElementById("feedbackText");

  if (!banner || !text) return;

  banner.className = "action-feedback-banner";

  if (type === "success") {
    banner.classList.add("feedback-success");
    if (icon) icon.textContent = "✅";
  } else if (type === "served") {
    banner.classList.add("feedback-served");
    if (icon) icon.textContent = "🎟️";
  } else if (type === "peek") {
    banner.classList.add("feedback-peek");
    if (icon) icon.textContent = "👁️";
  } else if (type === "warning") {
    banner.classList.add("feedback-warning");
    if (icon) icon.textContent = "⚠️";
  } else {
    if (icon) icon.textContent = "ℹ️";
  }

  text.innerHTML = messageHtml;
}

function addLogEntry(operation, messageHtml) {
  const movie = getActiveMovie();
  const entry = {
    operation: operation,
    message: messageHtml,
    time: getCurrentTimeFormatted()
  };

  movie.activityLog.unshift(entry);
  renderActivityLog();
}

function renderActivityLog() {
  const logList = document.getElementById("activityLogList");
  const counter = document.getElementById("logCounterBadge");
  const movie = getActiveMovie();

  if (!logList) return;

  if (counter) {
    counter.textContent = `${movie.activityLog.length} operation${movie.activityLog.length === 1 ? '' : 's'}`;
  }

  logList.innerHTML = "";

  if (movie.activityLog.length === 0) {
    logList.innerHTML = `<div class="log-empty">No queue operations recorded yet for this screen.</div>`;
    return;
  }

  movie.activityLog.slice(0, 30).forEach(entry => {
    const div = document.createElement("div");
    div.className = "log-item";

    let badgeClass = "badge-init";
    if (entry.operation === "ENQUEUE") badgeClass = "badge-enqueue";
    if (entry.operation === "PRIORITY_BOOKING") badgeClass = "badge-pq-add";
    if (entry.operation === "DEQUEUE") badgeClass = "badge-dequeue";
    if (entry.operation === "PEEK") badgeClass = "badge-peek";
    if (entry.operation === "CLEAR") badgeClass = "badge-clear";

    div.innerHTML = `
      <span class="log-time">${entry.time}</span>
      <span class="log-badge ${badgeClass}">${entry.operation}</span>
      <span class="log-msg">${entry.message}</span>
    `;
    logList.appendChild(div);
  });
}

function clearLog() {
  const movie = getActiveMovie();
  movie.activityLog = [];
  renderActivityLog();
}

// ==============================================================================
// CHART.JS ANALYTICS DASHBOARD
// ==============================================================================

let chartCapacityDonut = null;
let chartSeatBar = null;
let chartQueueLen = null;
let chartOccupancy = null;

function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Outfit', sans-serif";

  // Chart 1: Donut Capacity
  const ctxDonut = document.getElementById("multiplexCapacityDonut");
  if (ctxDonut) {
    chartCapacityDonut = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['Booked Seats', 'In Waiting Queue', 'Available Seats'],
        datasets: [{
          data: [0, 0, 96],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 2,
          borderColor: '#151d30'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Chart 2: Seat Status Comparison
  const ctxSeat = document.getElementById("movieSeatStatusChart");
  if (ctxSeat) {
    chartSeatBar = new Chart(ctxSeat, {
      type: 'bar',
      data: {
        labels: ['Avengers', 'Interstellar', 'Titanic', 'La La Land'],
        datasets: [
          { label: 'Booked', data: [0, 0, 0, 0], backgroundColor: '#ef4444' },
          { label: 'In Queue', data: [0, 0, 0, 0], backgroundColor: '#f59e0b' },
          { label: 'Available', data: [24, 24, 24, 24], backgroundColor: '#10b981' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, max: 24 }
        }
      }
    });
  }

  // Chart 3: Queue Lengths
  const ctxQLen = document.getElementById("queueLengthChart");
  if (ctxQLen) {
    chartQueueLen = new Chart(ctxQLen, {
      type: 'bar',
      data: {
        labels: ['Avengers', 'Interstellar', 'Titanic', 'La La Land'],
        datasets: [{
          label: 'Customers Waiting in Queue',
          data: [0, 0, 0, 0],
          backgroundColor: ['#06b6d4', '#f59e0b', '#38bdf8', '#ec4899']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // Chart 4: Occupancy
  const ctxOcc = document.getElementById("occupancyBarChart");
  if (ctxOcc) {
    chartOccupancy = new Chart(ctxOcc, {
      type: 'bar',
      data: {
        labels: ['Avengers', 'Interstellar', 'Titanic', 'La La Land'],
        datasets: [{
          label: 'Occupancy Rate (%)',
          data: [0, 0, 0, 0],
          backgroundColor: '#8b5cf6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
  }

  updateAnalyticsCharts();
}

function updateAnalyticsCharts() {
  let totalBooked = 0;
  let totalQueued = 0;
  let totalAvailable = 0;

  const bookedPerMovie = [];
  const queuedPerMovie = [];
  const availPerMovie = [];
  const queueLenPerMovie = [];
  const occPerMovie = [];

  Object.keys(movies).forEach(mId => {
    const movie = movies[mId];
    let b = 0, a = 0;
    movie.seats.forEach(status => {
      if (status === 'booked') b++;
      if (status === 'available') a++;
    });
    const q = movie.queue.length;

    totalBooked += b;
    totalQueued += q;
    totalAvailable += a;

    bookedPerMovie.push(b);
    queuedPerMovie.push(q);
    availPerMovie.push(a);
    queueLenPerMovie.push(q);

    const occ = Math.round(((b + q) / 24) * 100);
    occPerMovie.push(occ);
  });

  if (chartCapacityDonut) {
    chartCapacityDonut.data.datasets[0].data = [totalBooked, totalQueued, totalAvailable];
    chartCapacityDonut.update();
  }

  if (chartSeatBar) {
    chartSeatBar.data.datasets[0].data = bookedPerMovie;
    chartSeatBar.data.datasets[1].data = queuedPerMovie;
    chartSeatBar.data.datasets[2].data = availPerMovie;
    chartSeatBar.update();
  }

  if (chartQueueLen) {
    chartQueueLen.data.datasets[0].data = queueLenPerMovie;
    chartQueueLen.update();
  }

  if (chartOccupancy) {
    chartOccupancy.data.datasets[0].data = occPerMovie;
    chartOccupancy.update();
  }

  renderAnalyticsSummary();
}

function renderAnalyticsSummary() {
  let totalBooked = 0;
  let totalQueued = 0;
  let totalCapacity = 96;

  const tbody = document.getElementById("analyticsTableBody");
  if (tbody) tbody.innerHTML = "";

  Object.keys(movies).forEach(mId => {
    const movie = movies[mId];
    let b = 0, a = 0;
    movie.seats.forEach(status => {
      if (status === 'booked') b++;
      if (status === 'available') a++;
    });
    const q = movie.queue.length;
    const occ = Math.round(((b + q) / 24) * 100);

    totalBooked += b;
    totalQueued += q;

    if (tbody) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${movie.title}</strong></td>
        <td>${movie.screenPill}</td>
        <td>${movie.time}</td>
        <td><span class="badge badge-fifo">${q} Waiting</span></td>
        <td><span class="text-red font-bold">${b}</span></td>
        <td><span class="text-green font-bold">${a}</span></td>
        <td>24 Seats</td>
        <td><strong>${occ}%</strong></td>
        <td><button class="btn-table-switch" onclick="selectMovie('${mId}'); switchView('booking');">Select & Book</button></td>
      `;
      tbody.appendChild(tr);
    }
  });

  const kpiBooked = document.getElementById("kpiTotalBooked");
  if (kpiBooked) kpiBooked.textContent = totalBooked;

  const kpiQueued = document.getElementById("kpiTotalQueued");
  if (kpiQueued) kpiQueued.textContent = totalQueued;

  const kpiOcc = document.getElementById("kpiOccupancyPct");
  if (kpiOcc) {
    const overallOcc = Math.round(((totalBooked + totalQueued) / totalCapacity) * 100);
    kpiOcc.textContent = `${overallOcc}%`;
  }
}

// ==============================================================================
// NAVIGATION TABS SWITCHING
// ==============================================================================

function switchView(viewName) {
  const bookingContainer = document.getElementById("bookingViewContainer");
  const analyticsContainer = document.getElementById("analyticsViewContainer");
  const priorityContainer = document.getElementById("priorityViewContainer");
  const tabBooking = document.getElementById("tabBookingView");
  const tabAnalytics = document.getElementById("tabAnalyticsView");
  const tabPriority = document.getElementById("tabPriorityView");

  if (viewName === "booking") {
    if (bookingContainer) bookingContainer.style.display = "flex";
    if (analyticsContainer) analyticsContainer.style.display = "none";
    if (priorityContainer) priorityContainer.style.display = "none";
    if (tabBooking) tabBooking.classList.add("active");
    if (tabAnalytics) tabAnalytics.classList.remove("active");
    if (tabPriority) tabPriority.classList.remove("active");
  } else if (viewName === "analytics") {
    if (bookingContainer) bookingContainer.style.display = "none";
    if (analyticsContainer) analyticsContainer.style.display = "flex";
    if (priorityContainer) priorityContainer.style.display = "none";
    if (tabBooking) tabBooking.classList.remove("active");
    if (tabAnalytics) tabAnalytics.classList.add("active");
    if (tabPriority) tabPriority.classList.remove("active");
    updateAnalyticsCharts();
  } else if (viewName === "priority") {
    if (bookingContainer) bookingContainer.style.display = "none";
    if (analyticsContainer) analyticsContainer.style.display = "none";
    if (priorityContainer) priorityContainer.style.display = "flex";
    if (tabBooking) tabBooking.classList.remove("active");
    if (tabAnalytics) tabAnalytics.classList.remove("active");
    if (tabPriority) tabPriority.classList.add("active");
    renderPriorityPoolView();
  }
}

// ==============================================================================
// UTILITIES & EVENT LISTENERS
// ==============================================================================

function getCurrentTimeFormatted() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attachEventListeners() {
  // Navigation Tabs
  const tabBooking = document.getElementById("tabBookingView");
  if (tabBooking) tabBooking.addEventListener("click", () => switchView("booking"));

  const tabAnalytics = document.getElementById("tabAnalyticsView");
  if (tabAnalytics) tabAnalytics.addEventListener("click", () => switchView("analytics"));

  const tabPriority = document.getElementById("tabPriorityView");
  if (tabPriority) tabPriority.addEventListener("click", () => switchView("priority"));

  // Ticket Type Radio Switches
  const labelNormal = document.getElementById("labelTypeNormal");
  if (labelNormal) labelNormal.addEventListener("click", () => handleTicketTypeChange("normal"));

  const labelPriority = document.getElementById("labelTypePriority");
  if (labelPriority) labelPriority.addEventListener("click", () => handleTicketTypeChange("priority"));

  const radioNormal = document.getElementById("ticketTypeNormal");
  if (radioNormal) radioNormal.addEventListener("change", () => handleTicketTypeChange("normal"));

  const radioPriority = document.getElementById("ticketTypePriority");
  if (radioPriority) radioPriority.addEventListener("change", () => handleTicketTypeChange("priority"));

  // Booking Form Submission
  const form = document.getElementById("bookingForm");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleBookingSubmit();
  });

  const btnBook = document.getElementById("btnBookTicket");
  if (btnBook) btnBook.addEventListener("click", handleBookingSubmit);

  const btnRandom = document.getElementById("btnRandomStudent");
  if (btnRandom) {
    btnRandom.addEventListener("click", () => {
      const input = document.getElementById("customerNameInput");
      if (input) {
        input.value = SAMPLE_STUDENTS[Math.floor(Math.random() * SAMPLE_STUDENTS.length)];
      }
    });
  }

  // Register Priority Customer Form
  const btnRegPq = document.getElementById("btnRegisterPriority");
  if (btnRegPq) btnRegPq.addEventListener("click", handleRegisterPriority);

  const btnPqAddTab = document.getElementById("pqBtnAdd");
  if (btnPqAddTab) {
    btnPqAddTab.addEventListener("click", () => {
      const nameInput = document.getElementById("pqCustomerName");
      const sel = document.getElementById("pqPrioritySelect");
      if (!nameInput || !nameInput.value.trim()) {
        alert("Please enter a customer name.");
        return;
      }
      const pVal = parseInt(sel.value, 10);
      const cust = {
        id: globalCustomerId++,
        name: nameInput.value.trim(),
        priority: pVal,
        priorityLabel: (PRIORITY_META[pVal] || PRIORITY_META[3]).label,
        emoji: (PRIORITY_META[pVal] || PRIORITY_META[3]).emoji,
        time: getCurrentTimeFormatted()
      };
      registeredPriorityPool.push(cust);
      nameInput.value = "";
      populatePriorityCustomerDropdown();
      renderPriorityPoolView();
      if (isPythonBackend) {
        fetch("/api/priority-pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cust.name, priority: cust.priority })
        }).catch(() => {});
      }
    });
  }

  const btnRandomPq = document.getElementById("btnRandomPqName");
  if (btnRandomPq) {
    btnRandomPq.addEventListener("click", () => {
      const input = document.getElementById("regPqName");
      if (input) {
        input.value = SAMPLE_PQ_NAMES[Math.floor(Math.random() * SAMPLE_PQ_NAMES.length)];
      }
    });
  }

  // Queue Controls
  const btnConfirmTicket = document.getElementById("btnConfirmTicket");
  if (btnConfirmTicket) btnConfirmTicket.addEventListener("click", () => handleConfirmTicket(true));

  const btnAutoConfirm = document.getElementById("btnAutoConfirm");
  if (btnAutoConfirm) btnAutoConfirm.addEventListener("click", handleAutoConfirm);

  const btnPeek = document.getElementById("btnPeek");
  if (btnPeek) btnPeek.addEventListener("click", handlePeek);

  const btnClear = document.getElementById("btnClearQueue");
  if (btnClear) btnClear.addEventListener("click", handleClearQueue);

  const btnReset = document.getElementById("btnResetDemo");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      initAllMoviesData();
      selectMovie("endgame");
      updateAnalyticsCharts();
      setFeedbackBanner("info", "🔄 Cinema multiplex reset to initial demonstration state.");
      if (isPythonBackend) {
        fetch("/api/reset", { method: "POST" }).then(() => syncWithPythonBackend()).catch(() => {});
      }
    });
  }

  const btnClearLog = document.getElementById("btnClearLog");
  if (btnClearLog) btnClearLog.addEventListener("click", clearLog);

  const btnRefreshCharts = document.getElementById("btnRefreshCharts");
  if (btnRefreshCharts) btnRefreshCharts.addEventListener("click", updateAnalyticsCharts);

  // Ticket Modal Handlers
  const btnCloseModal = document.getElementById("btnCloseTicketModal");
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeTicketModal);

  const modalOverlay = document.getElementById("ticketModalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeTicketModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTicketModal();
  });

  // Theory accordion toggle
  const conceptToggle = document.getElementById("conceptToggleBtn");
  const conceptBody = document.getElementById("conceptBody");
  const toggleIcon = document.querySelector(".toggle-icon-btn");
  if (conceptToggle && conceptBody) {
    conceptToggle.addEventListener("click", () => {
      const isHidden = conceptBody.classList.toggle("hidden");
      if (toggleIcon) toggleIcon.classList.toggle("collapsed", isHidden);
    });
  }
}
