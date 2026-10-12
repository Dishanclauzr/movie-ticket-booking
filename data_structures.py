"""
=============================================================================
DATA STRUCTURES: QUEUE (FIFO) & PRIORITY QUEUE FOR TICKET BOOKING
College Assignment: Movie Ticket Booking System (Python + Flask)
=============================================================================
This module implements the core Data Structures for the Movie Ticket Booking
System using clean Object-Oriented Programming (OOP) in Python.

Data Structures Implemented:
1. Customer: Data model for cinema customers with Priority ranks (P1, P2, P3, Normal).
2. CombinedBookingQueue: Main movie booking queue that combines Priority Queue
   and FIFO rules. Highest-priority customers jump ahead of normal customers,
   while equal-priority customers maintain strict arrival order (FIFO).
3. PriorityQueue: Pool of registered priority customers (VIP, Senior Citizen,
   Regular Priority) available for booking priority tickets.
4. MovieScreen: Manages 24-seat hall matrix, dedicated booking queue, and logs.
=============================================================================
"""

from typing import Any, List, Optional, Dict
from datetime import datetime


class Customer:
    """
    Represents a cinema customer requesting or purchasing a ticket.
    
    Priority Ranks:
    - 1: 🔴 VIP — Priority 1 (Highest)
    - 2: 🟠 Senior Citizen — Priority 2
    - 3: 🟡 Regular Priority — Priority 3
    - 4: 🔵 Normal Ticket — Priority 4 / Non-Priority (Lowest, standard FIFO)
    """

    PRIORITY_LEVELS = {
        1: {"label": "VIP", "emoji": "🔴", "desc": "Priority 1 (Highest)", "cssClass": "node-p1"},
        2: {"label": "Senior Citizen", "emoji": "🟠", "desc": "Priority 2", "cssClass": "node-p2"},
        3: {"label": "Regular Priority", "emoji": "🟡", "desc": "Priority 3", "cssClass": "node-p3"},
        4: {"label": "Normal", "emoji": "🔵", "desc": "Normal Ticket (FIFO)", "cssClass": "node-normal"}
    }

    def __init__(
        self,
        customer_id: int,
        name: str,
        seat: str = "",
        movie_id: str = "endgame",
        movie_title: str = "Avengers: Endgame",
        priority: int = 4,
        time_str: Optional[str] = None
    ):
        self.id = customer_id
        self.name = name.strip()
        self.seat = seat.strip()
        self.movie_id = movie_id
        self.movie_title = movie_title
        self.priority = priority  # 1 = VIP, 2 = Senior, 3 = Regular Priority, 4 = Normal
        
        meta = self.PRIORITY_LEVELS.get(priority, self.PRIORITY_LEVELS[4])
        self.priority_label = meta["label"]
        self.emoji = meta["emoji"]
        self.css_class = meta["cssClass"]
        self.is_priority = (priority < 4)
        self.time = time_str or datetime.now().strftime("%I:%M:%S %p")

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the customer object to a dictionary for JSON response."""
        return {
            "id": self.id,
            "name": self.name,
            "seat": self.seat,
            "movieId": self.movie_id,
            "movieTitle": self.movie_title,
            "priority": self.priority,
            "priorityLabel": self.priority_label,
            "emoji": self.emoji,
            "cssClass": self.css_class,
            "isPriority": self.is_priority,
            "time": self.time
        }

    def __repr__(self) -> str:
        return f"Customer({self.name}, Seat={self.seat}, P={self.priority} [{self.priority_label}])"


# =============================================================================
# 1. COMBINED BOOKING QUEUE (PRIORITY-BASED + FIFO)
# =============================================================================

class CombinedBookingQueue:
    """
    Combined Booking Queue:
    - Highest Priority (P1: VIP, P2: Senior, P3: Regular Priority) is served FIRST.
    - Normal customers (P4) remain behind priority customers at the REAR.
    - If two customers have the SAME priority (including Normal vs Normal),
      arrival order (FIFO) is strictly preserved!
    """

    def __init__(self, name: str = "Multiplex Booking Queue"):
        self.name = name
        self._items: List[Customer] = []

    def enqueue(self, customer: Customer) -> int:
        """
        Inserts customer into their correct position based on priority rank.
        Maintains stable FIFO order for customers with identical priority.
        
        Returns the 0-based insertion index where customer was placed.
        Time Complexity: O(n)
        """
        insert_idx = len(self._items)
        for i, existing in enumerate(self._items):
            # Strict inequality: lower number = higher priority
            # If priority is equal, loop continues, placing new customer behind existing ones (FIFO).
            if customer.priority < existing.priority:
                insert_idx = i
                break

        self._items.insert(insert_idx, customer)
        return insert_idx

    def dequeue(self) -> Optional[Customer]:
        """
        Serves and removes the customer at the FRONT (highest priority / earliest arrival).
        Time Complexity: O(1)
        """
        if self.is_empty():
            return None
        return self._items.pop(0)

    def peek(self) -> Optional[Customer]:
        """
        Inspects the customer at the FRONT without removing them.
        Time Complexity: O(1)
        """
        if self.is_empty():
            return None
        return self._items[0]

    def is_empty(self) -> bool:
        """Checks if queue is empty."""
        return len(self._items) == 0

    def size(self) -> int:
        """Returns total waiting customers in queue."""
        return len(self._items)

    def to_list(self) -> List[Dict[str, Any]]:
        """Returns customer dictionaries in queue order (index 0 = FRONT)."""
        return [cust.to_dict() for cust in self._items]

    def clear(self) -> None:
        """Empties the queue."""
        self._items.clear()

    def __repr__(self) -> str:
        names = [f"{c.name}(P{c.priority})" for c in self._items]
        return f"BookingQueue: FRONT -> {' -> '.join(names) if names else 'EMPTY'} <- REAR"


# Backwards compatibility alias
Queue = CombinedBookingQueue


# =============================================================================
# 2. PRIORITY QUEUE (REGISTERED PRIORITY CUSTOMER POOL)
# =============================================================================

class PriorityQueue:
    """
    Priority Queue managing registered priority customers (VIP, Senior, Regular Priority).
    These customers appear in the 'Priority Customer' dropdown for booking priority tickets.
    """

    def __init__(self, name: str = "Registered Priority Pool"):
        self.name = name
        self._items: List[Customer] = []

    def enqueue(self, customer: Customer) -> int:
        """
        Adds a registered priority customer sorted by priority (P1 -> P2 -> P3).
        Preserves FIFO for equal priority.
        """
        insert_idx = len(self._items)
        for i, existing in enumerate(self._items):
            if customer.priority < existing.priority:
                insert_idx = i
                break

        self._items.insert(insert_idx, customer)
        return insert_idx

    def dequeue(self) -> Optional[Customer]:
        """Removes highest priority customer."""
        if self.is_empty():
            return None
        return self._items.pop(0)

    def remove_by_id(self, customer_id: int) -> Optional[Customer]:
        """
        Removes a customer from the pool once they book their ticket,
        preventing duplicate priority bookings.
        """
        for i, cust in enumerate(self._items):
            if cust.id == customer_id:
                return self._items.pop(i)
        return None

    def peek(self) -> Optional[Customer]:
        """Inspects front customer."""
        if self.is_empty():
            return None
        return self._items[0]

    def is_empty(self) -> bool:
        return len(self._items) == 0

    def size(self) -> int:
        return len(self._items)

    def to_list(self) -> List[Dict[str, Any]]:
        return [cust.to_dict() for cust in self._items]

    def clear(self) -> None:
        self._items.clear()


# =============================================================================
# 3. MOVIE SCREEN & SEAT MATRIX
# =============================================================================

class MovieScreen:
    """
    Manages a single Cinema Hall screen, including:
    - 24-Seat Seating Grid (Rows A-D, Columns 1-6)
    - Dedicated CombinedBookingQueue instance for this screen
    - Pre-booked seats and activity logs
    """

    ROWS = ['A', 'B', 'C', 'D']
    COLS = 6
    TOTAL_SEATS = 24

    def __init__(
        self,
        screen_id: str,
        title: str,
        short_title: str,
        screen_name: str,
        screen_pill: str,
        show_time: str,
        genre_run: str,
        date_str: str,
        poster_icon: str,
        poster_title: str,
        poster_sub: str,
        theme_color: str,
        poster_gradient: str,
        pre_booked: List[str]
    ):
        self.id = screen_id
        self.title = title
        self.short_title = short_title
        self.screen = screen_name
        self.screen_pill = screen_pill
        self.time = show_time
        self.genre_run = genre_run
        self.date = date_str
        self.poster_icon = poster_icon
        self.poster_title = poster_title
        self.poster_sub = poster_sub
        self.theme_color = theme_color
        self.poster_gradient = poster_gradient
        self.pre_booked_seats = pre_booked

        # Dedicated Combined Booking Queue for this movie
        self.queue = CombinedBookingQueue(name=f"{title} Booking Queue")
        
        # Seat map: seat_code -> 'available' | 'queued' | 'booked'
        self.seats: Dict[str, str] = {}
        self.activity_log: List[Dict[str, str]] = []

        self.reset_screen()

    def reset_screen(self) -> None:
        """Resets all seats and clears queue."""
        self.seats.clear()
        for r in self.ROWS:
            for c in range(1, self.COLS + 1):
                self.seats[f"{r}{c}"] = "available"

        for s in self.pre_booked_seats:
            self.seats[s] = "booked"

        self.queue.clear()
        self.activity_log.clear()

    def get_available_seats_count(self) -> int:
        return sum(1 for status in self.seats.values() if status == "available")

    def get_booked_seats_count(self) -> int:
        return sum(1 for status in self.seats.values() if status == "booked")

    def get_queued_seats_count(self) -> int:
        return sum(1 for status in self.seats.values() if status == "queued")

    def add_log(self, operation: str, message: str) -> None:
        self.activity_log.insert(0, {
            "operation": operation,
            "message": message,
            "time": datetime.now().strftime("%I:%M:%S %p")
        })

    def to_dict(self) -> Dict[str, Any]:
        """Returns complete screen state for frontend rendering."""
        return {
            "id": self.id,
            "title": self.title,
            "shortTitle": self.short_title,
            "screen": self.screen,
            "screenPill": self.screen_pill,
            "time": self.time,
            "genreRun": self.genre_run,
            "date": self.date,
            "posterIcon": self.poster_icon,
            "posterTitle": self.poster_title,
            "posterSub": self.poster_sub,
            "themeColor": self.theme_color,
            "posterGradient": self.poster_gradient,
            "queue": self.queue.to_list(),
            "queueLength": self.queue.size(),
            "seats": self.seats,
            "availableSeats": self.get_available_seats_count(),
            "bookedSeats": self.get_booked_seats_count(),
            "queuedSeats": self.get_queued_seats_count(),
            "totalSeats": self.TOTAL_SEATS,
            "activityLog": self.activity_log[:30]
        }
