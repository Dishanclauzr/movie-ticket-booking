"""
=============================================================================
INTERACTIVE TERMINAL CLI DEMO (PYTHON DATA STRUCTURES)
College Assignment: Priority Queue & Queue Integrated Ticket System
Run with:
    python cli_demo.py
=============================================================================
"""

import sys
import subprocess
from data_structures import Customer, CombinedBookingQueue, PriorityQueue, MovieScreen


def print_banner():
    print("\n" + "=" * 70)
    print("🎬 MULTIPLEX MOVIE TICKET BOOKING — DATA STRUCTURES DEMO")
    print("   Data Structures: CombinedBookingQueue & Priority Queue Pool in Python 3")
    print("=" * 70)


def init_demo_system():
    screens = {
        "1": MovieScreen("endgame", "Avengers: Endgame", "Avengers", "Screen 1 (IMAX 3D)", "Screen 1", "6:30 PM", "Action", "21 Sept 2026", "🛡️", "AVENGERS", "ENDGAME", "#06b6d4", "", ["D5", "D6"]),
        "2": MovieScreen("interstellar", "Interstellar", "Interstellar", "Screen 2 (70mm IMAX)", "Screen 2", "8:15 PM", "Sci-Fi", "21 Sept 2026", "🚀", "INTER-", "STELLAR", "#f59e0b", "", ["A5", "A6"]),
        "3": MovieScreen("titanic", "Titanic", "Titanic", "Screen 3 (4K Laser)", "Screen 3", "5:00 PM", "Romance", "21 Sept 2026", "🚢", "TITANIC", "DOLBY", "#38bdf8", "", ["A1", "A2"]),
        "4": MovieScreen("lalaland", "La La Land", "La La Land", "Screen 4 (Dolby)", "Screen 4", "7:00 PM", "Musical", "21 Sept 2026", "🎷", "LA LA", "LAND", "#ec4899", "", ["B1", "B2"])
    }

    # Initial normal students in Avengers queue
    for name, seat in [("Dishan", "A1"), ("Lokesh", "A2"), ("Kevin", "B4")]:
        c = Customer(1, name, seat, "endgame", "Avengers: Endgame", priority=4)
        screens["1"].queue.enqueue(c)
        screens["1"].seats[seat] = "queued"

    # Initial registered Priority Pool
    pq_pool = PriorityQueue("Registered Priority Customers Pool")
    initial_priority = [
        ("Benny", 1),       # VIP — P1
        ("Wellesley", 2),   # Senior Citizen — P2
        ("Venkat", 3)       # Regular Priority — P3
    ]
    for name, p_num in initial_priority:
        c = Customer(99, name, priority=p_num)
        pq_pool.enqueue(c)

    return screens, pq_pool


def display_queues(screens):
    print("\n--- 🎟️ 4 CINEMA HALL BOOKING QUEUES (COMBINED PRIORITY + FIFO) ---")
    for key, sc in screens.items():
        q_list = sc.queue.to_list()
        print(f"\n[{key}] {sc.title} ({sc.screen} • {sc.time})")
        print(f"    Available Seats: {sc.get_available_seats_count()} / 24 | Booked: {sc.get_booked_seats_count()}")
        if not q_list:
            print("    Queue: (EMPTY)")
        else:
            names = [f"#{i+1} {cust['emoji']} {cust['name']} [{cust['priorityLabel']} - Seat {cust['seat']}]" for i, cust in enumerate(q_list)]
            print("    FRONT ➔ " + " ➔ ".join(names) + " ➔ REAR")


def display_priority_pool(pool):
    print("\n--- ⚡ REGISTERED PRIORITY CUSTOMER POOL ---")
    print("Priority Order: 🔴 VIP (P1) > 🟠 Senior (P2) > 🟡 Regular Priority (P3)")
    q_list = pool.to_list()
    if not q_list:
        print("    Priority Pool is currently EMPTY.")
        return

    print("\n    Available for Priority Ticket Booking:")
    for i, c in enumerate(q_list):
        print(f"      [{i+1}] {c['emoji']} {c['name']} — {c['priorityLabel']} (Priority {c['priority']})")


def main():
    print_banner()
    screens, pool = init_demo_system()

    while True:
        print("\n" + "-" * 70)
        print("MAIN MENU:")
        print("1. Display All 4 Movie Booking Queues (Shows Priority & Normal order)")
        print("2. Book Normal Ticket (Adds customer to REAR / FIFO)")
        print("3. Book Priority Ticket (Selects from Priority Pool & JUMPS AHEAD by rank)")
        print("4. Register New Priority Customer into Pool")
        print("5. Display Registered Priority Pool")
        print("6. Serve Next Customer from Movie Queue (DEQUEUE from FRONT)")
        print("7. Peek Next Customer in Line")
        print("8. Run Automated Unit Tests (unittest)")
        print("9. Launch Flask Web Application (app.py)")
        print("0. Exit")
        print("-" * 70)

        choice = input("Enter choice (0-9): ").strip()

        if choice == "1":
            display_queues(screens)

        elif choice == "2":
            print("\nSelect Screen (1: Avengers, 2: Interstellar, 3: Titanic, 4: La La Land):")
            s_choice = input("Screen (1-4): ").strip()
            if s_choice in screens:
                sc = screens[s_choice]
                name = input("Enter customer name: ").strip() or "Sample Student"
                seat = input("Enter seat code (e.g. C1): ").strip() or "C1"
                c = Customer(99, name, seat, sc.id, sc.title, priority=4)
                idx = sc.queue.enqueue(c)
                sc.seats[seat] = "queued"
                print(f"\n✅ NORMAL TICKET ENQUEUED: {c.name} added at REAR (position #{idx+1}) for {sc.title} (Seat {seat}).")
            else:
                print("Invalid screen choice.")

        elif choice == "3":
            if pool.is_empty():
                print("\n⚠️ Priority Pool is empty! Please register a priority customer first (Option 4).")
                continue

            print("\nAvailable Priority Customers:")
            p_list = pool.to_list()
            for i, p_cust in enumerate(p_list):
                print(f"{i+1}. {p_cust['emoji']} {p_cust['name']} ({p_cust['priorityLabel']} - P{p_cust['priority']})")

            p_choice = input(f"Select customer (1-{len(p_list)}): ").strip()
            try:
                p_idx = int(p_choice) - 1
                if 0 <= p_idx < len(p_list):
                    selected_p = pool.remove_by_id(p_list[p_idx]["id"])
                    print("\nSelect Screen (1: Avengers, 2: Interstellar, 3: Titanic, 4: La La Land):")
                    s_choice = input("Screen (1-4): ").strip()
                    if s_choice in screens:
                        sc = screens[s_choice]
                        seat = input("Enter seat code (e.g. B3): ").strip() or "B3"
                        selected_p.seat = seat
                        selected_p.movie_id = sc.id
                        selected_p.movie_title = sc.title
                        idx = sc.queue.enqueue(selected_p)
                        sc.seats[seat] = "queued"
                        print(f"\n⚡ PRIORITY TICKET BOOKED: {selected_p.name} ({selected_p.priority_label} - P{selected_p.priority}) jumped ahead to position #{idx+1} in {sc.title} queue!")
                    else:
                        print("Invalid screen. Customer restored to pool.")
                        pool.enqueue(selected_p)
                else:
                    print("Invalid customer selection.")
            except ValueError:
                print("Invalid input.")

        elif choice == "4":
            name = input("Enter customer name: ").strip() or "VIP Guest"
            print("Choose Priority:")
            print("1. 🔴 VIP — Priority 1 (Highest)")
            print("2. 🟠 Senior Citizen — Priority 2")
            print("3. 🟡 Regular Priority — Priority 3")
            p_str = input("Priority (1-3): ").strip()
            p_val = int(p_str) if p_str in ["1", "2", "3"] else 3
            c = Customer(99, name, priority=p_val)
            idx = pool.enqueue(c)
            print(f"\n⚡ REGISTERED: {c.name} ({c.priority_label}) added to Priority Pool at position #{idx+1}!")

        elif choice == "5":
            display_priority_pool(pool)

        elif choice == "6":
            print("\nSelect Screen (1: Avengers, 2: Interstellar, 3: Titanic, 4: La La Land):")
            s_choice = input("Screen: ").strip()
            if s_choice in screens:
                sc = screens[s_choice]
                served = sc.queue.dequeue()
                if served:
                    sc.seats[served.seat] = "booked"
                    print(f"\n🎟️ SERVE NEXT: {served.name} [{served.emoji} {served.priorityLabel}] served from FRONT! Seat {served.seat} is now BOOKED.")
                else:
                    print(f"\n⚠️ Queue for {sc.title} is empty!")
            else:
                print("Invalid screen choice.")

        elif choice == "7":
            print("\nSelect Screen (1-4):")
            s_choice = input("Screen: ").strip()
            if s_choice in screens:
                sc = screens[s_choice]
                front = sc.queue.peek()
                if front:
                    print(f"\n👁️ PEEK: Next customer in line for {sc.title} is {front.emoji} {front.name} [{front.priorityLabel}] (Seat {front.seat}).")
                else:
                    print(f"\nQueue for {sc.title} is empty.")
            else:
                print("Invalid screen choice.")

        elif choice == "8":
            print("\nRunning automated unit tests...")
            subprocess.run([sys.executable, "test_data_structures.py"])

        elif choice == "9":
            print("\nLaunching Flask Web Server on http://localhost:8000 ...")
            subprocess.run([sys.executable, "app.py"])

        elif choice == "0":
            print("\nExiting. Goodbye!\n")
            break

        else:
            print("Invalid choice. Please enter a number between 0 and 9.")


if __name__ == "__main__":
    main()
