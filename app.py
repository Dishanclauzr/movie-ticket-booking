"""
=============================================================================
MULTIPLEX MOVIE TICKET BOOKING — FLASK PYTHON BACKEND
College Assignment: Priority Queue & Queue Integrated Ticket System
Framework: Python 3 + Flask
=============================================================================
Run with:
    python app.py

Access in browser:
    http://localhost:8000
=============================================================================
"""

import os
import sys
import webbrowser
from flask import Flask, jsonify, request, send_from_directory
from datetime import datetime

from data_structures import Customer, CombinedBookingQueue, PriorityQueue, MovieScreen

# Initialize Flask App
app = Flask(__name__, static_folder=".", static_url_path="")

# Customer ID Sequence
customer_id_counter = 100


def get_next_customer_id() -> int:
    global customer_id_counter
    customer_id_counter += 1
    return customer_id_counter


# =============================================================================
# IN-MEMORY CINEMA STATE (MANAGED ENTIRELY BY PYTHON)
# =============================================================================

screens: dict[str, MovieScreen] = {}
priority_pool: PriorityQueue = PriorityQueue("Registered Priority Customers Pool")
pq_activity_log: list[dict[str, str]] = []


def init_cinema_backend() -> None:
    """
    Initializes all 4 movie screens and the registered priority customer pool.
    Default demonstration data specified for college assignment:
    - Normal customers in queue: Dishan (A1), Lokesh (A2), Kevin (B4)
    - Registered Priority Pool: Benny (VIP, P1), Wellesley (Senior, P2), Venkat (Regular, P3)
    """
    global screens, priority_pool, pq_activity_log

    # 1. Screen 1: Avengers: Endgame
    endgame = MovieScreen(
        screen_id="endgame",
        title="Avengers: Endgame",
        short_title="Avengers",
        screen_name="Screen 1 (IMAX 3D)",
        screen_pill="Screen 1 • IMAX 3D",
        show_time="6:30 PM",
        genre_run="Action • 3h 02m",
        date_str="21 September 2026",
        poster_icon="🛡️",
        poster_title="AVENGERS",
        poster_sub="ENDGAME",
        theme_color="#06b6d4",
        poster_gradient="linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #450a0a 100%)",
        pre_booked=["D5", "D6"]
    )
    # Pre-populate normal students in initial queue
    for name, seat in [("Dishan", "A1"), ("Lokesh", "A2"), ("Kevin", "B4")]:
        c = Customer(
            customer_id=get_next_customer_id(),
            name=name,
            seat=seat,
            movie_id="endgame",
            movie_title=endgame.title,
            priority=4  # Normal
        )
        endgame.queue.enqueue(c)
        endgame.seats[seat] = "queued"

    endgame.add_log("INIT", "Screen initialized with Dishan, Lokesh, and Kevin in booking queue.")

    # 2. Screen 2: Interstellar
    interstellar = MovieScreen(
        screen_id="interstellar",
        title="Interstellar",
        short_title="Interstellar",
        screen_name="Screen 2 (70mm IMAX)",
        screen_pill="Screen 2 • 70mm IMAX",
        show_time="8:15 PM",
        genre_run="Sci-Fi • 2h 49m",
        date_str="21 September 2026",
        poster_icon="🚀",
        poster_title="INTER-",
        poster_sub="STELLAR",
        theme_color="#f59e0b",
        poster_gradient="linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #2e1065 100%)",
        pre_booked=["A5", "A6", "D1", "D2"]
    )
    for name, seat in [("Cooper", "B1"), ("Murph", "B2"), ("Brand", "C3")]:
        c = Customer(get_next_customer_id(), name, seat, "interstellar", interstellar.title, priority=4)
        interstellar.queue.enqueue(c)
        interstellar.seats[seat] = "queued"
    interstellar.add_log("INIT", "Screen initialized with 3 customers in queue.")

    # 3. Screen 3: Titanic
    titanic = MovieScreen(
        screen_id="titanic",
        title="Titanic",
        short_title="Titanic",
        screen_name="Screen 3 (4K Laser Dolby)",
        screen_pill="Screen 3 • 4K Laser",
        show_time="5:00 PM",
        genre_run="Romance • 3h 14m",
        date_str="21 September 2026",
        poster_icon="🚢",
        poster_title="TITANIC",
        poster_sub="DOLBY 3D",
        theme_color="#38bdf8",
        poster_gradient="linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0c4a6e 100%)",
        pre_booked=["A1", "A2", "B5", "B6", "C5", "C6"]
    )
    for name, seat in [("Jack", "C1"), ("Rose", "C2")]:
        c = Customer(get_next_customer_id(), name, seat, "titanic", titanic.title, priority=4)
        titanic.queue.enqueue(c)
        titanic.seats[seat] = "queued"
    titanic.add_log("INIT", "Screen initialized with 2 customers in queue.")

    # 4. Screen 4: La La Land
    lalaland = MovieScreen(
        screen_id="lalaland",
        title="La La Land",
        short_title="La La Land",
        screen_name="Screen 4 (Dolby Cinema Sunset)",
        screen_pill="Screen 4 • Sunset Dolby",
        show_time="7:00 PM",
        genre_run="Musical • 2h 08m",
        date_str="21 September 2026",
        poster_icon="🎷",
        poster_title="LA LA",
        poster_sub="LAND",
        theme_color="#ec4899",
        poster_gradient="linear-gradient(135deg, #581c87 0%, #831843 50%, #f43f5e 100%)",
        pre_booked=["B1", "B2", "C1", "C2", "D3", "D4"]
    )
    for name, seat in [("Sebastian", "A3"), ("Mia", "A4")]:
        c = Customer(get_next_customer_id(), name, seat, "lalaland", lalaland.title, priority=4)
        lalaland.queue.enqueue(c)
        lalaland.seats[seat] = "queued"
    lalaland.add_log("INIT", "Screen initialized with 2 customers in queue.")

    screens = {
        "endgame": endgame,
        "interstellar": interstellar,
        "titanic": titanic,
        "lalaland": lalaland
    }

    # Initialize Registered Priority Customer Pool (Demonstration Data)
    priority_pool.clear()
    pq_activity_log.clear()

    initial_priority_customers = [
        ("Benny", 1),       # VIP — Priority 1
        ("Wellesley", 2),   # Senior Citizen — Priority 2
        ("Venkat", 3)       # Regular Priority — Priority 3
    ]
    for name, p_num in initial_priority_customers:
        cust = Customer(
            customer_id=get_next_customer_id(),
            name=name,
            priority=p_num
        )
        priority_pool.enqueue(cust)

    pq_activity_log.insert(0, {
        "operation": "INIT",
        "message": "Priority Customer Pool initialized with Benny (VIP), Wellesley (Senior), and Venkat (Regular Priority).",
        "time": datetime.now().strftime("%I:%M:%S %p")
    })


# Run initial setup
init_cinema_backend()


# =============================================================================
# FLASK STATIC ROUTES
# =============================================================================

@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


# =============================================================================
# REST API ENDPOINTS (DATA STRUCTURES IN PYTHON)
# =============================================================================

@app.route("/api/status", methods=["GET"])
def get_status():
    """Returns full system status including all 4 screens and the Priority Pool."""
    return jsonify({
        "success": True,
        "engine": "Python 3 Flask Backend",
        "dataStructures": ["CombinedBookingQueue (Priority + FIFO)", "PriorityQueue (Pool)"],
        "screens": {s_id: screen.to_dict() for s_id, screen in screens.items()},
        "priorityPool": priority_pool.to_list(),
        "priorityPoolSize": priority_pool.size(),
        "priorityActivityLog": pq_activity_log[:30]
    })


@app.route("/api/priority-pool", methods=["GET", "POST"])
def handle_priority_pool():
    """
    GET: Returns registered priority customers.
    POST: Registers a new priority customer into the Priority Pool.
    """
    if request.method == "POST":
        data = request.get_json() or {}
        name = data.get("name", "").strip()
        priority_val = int(data.get("priority", 1))

        if not name:
            return jsonify({"success": False, "error": "Name is required"}), 400

        customer = Customer(
            customer_id=get_next_customer_id(),
            name=name,
            priority=priority_val
        )
        # Python Data Structure: PriorityQueue.enqueue()
        insert_idx = priority_pool.enqueue(customer)

        pq_activity_log.insert(0, {
            "operation": "REGISTER",
            "message": f"<strong>{customer.name}</strong> registered as {customer.emoji} {customer.priority_label} (Priority {customer.priority}) at position #{insert_idx + 1}",
            "time": customer.time
        })

        return jsonify({
            "success": True,
            "customer": customer.to_dict(),
            "priorityPool": priority_pool.to_list()
        })

    return jsonify({
        "success": True,
        "priorityPool": priority_pool.to_list()
    })


@app.route("/api/enqueue", methods=["POST"])
def handle_enqueue():
    """
    Books a ticket (Normal or Priority) and enqueues customer into movie queue.
    - Normal Ticket: Added at the REAR of the booking queue (behind existing normal customers).
    - Priority Ticket: Inserted ahead of lower priority customers according to rank (P1 > P2 > P3 > Normal).
      Equal priority preserves arrival order (FIFO).
    - Removes priority customer from available pool once booked.
    """
    data = request.get_json() or {}
    movie_id = data.get("movieId", "endgame")
    ticket_type = data.get("ticketType", "normal")  # 'normal' | 'priority'
    seat = data.get("seat", "").strip()

    if movie_id not in screens:
        return jsonify({"success": False, "error": "Invalid movie"}), 400

    screen = screens[movie_id]

    if not seat or screen.seats.get(seat) != "available":
        return jsonify({"success": False, "error": f"Seat {seat} is not available"}), 400

    if ticket_type == "priority":
        # Priority Ticket Booking
        customer_id = data.get("priorityCustomerId")
        if not customer_id:
            return jsonify({"success": False, "error": "Please select a registered priority customer"}), 400

        # Remove from registered Priority Pool
        priority_cust = priority_pool.remove_by_id(int(customer_id))
        if not priority_cust:
            return jsonify({"success": False, "error": "Selected priority customer is no longer available in the pool"}), 400

        customer = Customer(
            customer_id=priority_cust.id,
            name=priority_cust.name,
            seat=seat,
            movie_id=movie_id,
            movie_title=screen.title,
            priority=priority_cust.priority
        )

        # Python Data Structure: CombinedBookingQueue.enqueue()
        insert_idx = screen.queue.enqueue(customer)
        screen.seats[seat] = "queued"

        jump_msg = f" Placed at position #{insert_idx + 1} (ahead of lower priority customers)." if insert_idx < screen.queue.size() - 1 else ""
        screen.add_log(
            "PRIORITY_BOOKING",
            f"⚡ <strong>{customer.name}</strong> booked {customer.emoji} {customer.priority_label} (Priority {customer.priority}) for Seat <strong>{seat}</strong>.{jump_msg}"
        )

        pq_activity_log.insert(0, {
            "operation": "BOOKED",
            "message": f"<strong>{customer.name}</strong> ({customer.priority_label}) booked seat {seat} for {screen.short_title}.",
            "time": customer.time
        })

    else:
        # Normal Ticket Booking
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"success": False, "error": "Customer name is required"}), 400

        customer = Customer(
            customer_id=get_next_customer_id(),
            name=name,
            seat=seat,
            movie_id=movie_id,
            movie_title=screen.title,
            priority=4  # Normal Ticket
        )

        # Python Data Structure: CombinedBookingQueue.enqueue() -> placed at REAR
        insert_idx = screen.queue.enqueue(customer)
        screen.seats[seat] = "queued"

        screen.add_log(
            "ENQUEUE",
            f"<strong>{customer.name}</strong> joined the queue at REAR (Seat <strong>{seat}</strong>)."
        )

    return jsonify({
        "success": True,
        "operation": "ENQUEUE",
        "ticketType": ticket_type,
        "customer": customer.to_dict(),
        "insertIndex": insert_idx,
        "screen": screen.to_dict(),
        "priorityPool": priority_pool.to_list()
    })


@app.route("/api/dequeue", methods=["POST"])
def handle_dequeue():
    """
    Serves the customer at the FRONT of the queue.
    Because the CombinedBookingQueue is priority-ordered:
    1. Highest priority customer (P1, then P2, then P3) is served first.
    2. If no priority customers, normal customers are served in FIFO order.
    """
    data = request.get_json() or {}
    movie_id = data.get("movieId", "endgame")

    if movie_id not in screens:
        return jsonify({"success": False, "error": "Invalid movie"}), 400

    screen = screens[movie_id]

    if screen.queue.is_empty():
        return jsonify({
            "success": False,
            "message": "Queue is empty! No waiting customers to serve."
        }), 200

    # Python Data Structure: CombinedBookingQueue.dequeue() -> pop(0)
    served_customer = screen.queue.dequeue()
    screen.seats[served_customer.seat] = "booked"

    type_desc = f"{served_customer.emoji} {served_customer.priority_label} (P{served_customer.priority})" if served_customer.is_priority else "Normal"
    screen.add_log(
        "DEQUEUE",
        f"Ticket CONFIRMED: <strong>{served_customer.name}</strong> [{type_desc}] served from FRONT. Seat <strong>{served_customer.seat}</strong> is now BOOKED."
    )

    next_cust = screen.queue.peek()

    return jsonify({
        "success": True,
        "operation": "DEQUEUE",
        "servedCustomer": served_customer.to_dict(),
        "nextCustomer": next_cust.to_dict() if next_cust else None,
        "screen": screen.to_dict()
    })


@app.route("/api/peek", methods=["POST"])
def handle_peek():
    data = request.get_json() or {}
    movie_id = data.get("movieId", "endgame")

    if movie_id not in screens:
        return jsonify({"success": False, "error": "Invalid movie"}), 400

    screen = screens[movie_id]
    front = screen.queue.peek()

    return jsonify({
        "success": True,
        "front": front.to_dict() if front else None,
        "isEmpty": screen.queue.is_empty()
    })


@app.route("/api/clear", methods=["POST"])
def handle_clear():
    data = request.get_json() or {}
    movie_id = data.get("movieId", "endgame")

    if movie_id not in screens:
        return jsonify({"success": False, "error": "Invalid movie"}), 400

    screen = screens[movie_id]
    # Release queued seats back to available
    for cust_dict in screen.queue.to_list():
        seat = cust_dict["seat"]
        if screen.seats.get(seat) == "queued":
            screen.seats[seat] = "available"

    count = screen.queue.size()
    screen.queue.clear()
    screen.add_log("CLEAR", f"Queue cleared ({count} waiting customers removed).")

    return jsonify({
        "success": True,
        "clearedCount": count,
        "screen": screen.to_dict()
    })


@app.route("/api/reset", methods=["POST"])
def handle_reset():
    init_cinema_backend()
    return jsonify({
        "success": True,
        "message": "Cinema multiplex and priority pool reset to initial assignment states.",
        "screens": {s_id: screen.to_dict() for s_id, screen in screens.items()},
        "priorityPool": priority_pool.to_list()
    })


# =============================================================================
# MAIN SERVER LAUNCHER
# =============================================================================

def run_server(port: int = 8000) -> None:
    url = f"http://localhost:{port}"
    print("\n" + "=" * 75)
    print("🎬 MULTIPLEX MOVIE TICKET BOOKING — PYTHON FLASK SERVER")
    print("   Data Structures: CombinedBookingQueue (Priority + FIFO) & PriorityQueue Pool")
    print("=" * 75)
    print(f"\n🚀 Server running at: {url}")
    print("📂 Serving frontend from:", os.path.dirname(os.path.abspath(__file__)))
    print("💡 All Queue & Priority Queue logic executing in Python (data_structures.py)")
    print("\nPress Ctrl+C to stop the server.\n" + "=" * 75 + "\n")

    try:
        webbrowser.open(url)
    except Exception:
        pass

    app.run(host="localhost", port=port, debug=False)


if __name__ == "__main__":
    run_server()
