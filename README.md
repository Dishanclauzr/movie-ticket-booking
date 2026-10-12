# 🎬 Multiplex Movie Ticket Booking System (Python Flask + Priority Queue)

A modern, cinematic, and full-stack **Python Flask & Data Structures (DSA)** project demonstrating how a **Queue (FIFO)** and **Priority Queue (Priority-Based)** integrate seamlessly inside a real-world movie ticket booking system.

---

## 📌 Main Booking Concepts

```
                       BOOK TICKET
                            ↓
                    Choose Ticket Type
                            ↓
               ┌────────────────────────┐
               │                        │
         Normal Ticket            Priority Ticket
               │                        │
               ↓                        ↓
          Enter Name        Select Priority Customer
               │            (From Registered Pool)
               ↓                        │
          Select Seat                   ↓
               │                   Select Seat
               ↓                        │
          Add to REAR                   ↓
             (FIFO)          Insert by Priority Rank
               │             (P1 > P2 > P3 > Normal)
               └───────────┬────────────┘
                           ↓
                     BOOKING QUEUE
                           ↓
                      SERVE NEXT
```

---

## 🎟️ 1. Ticket Types in the Booking Process

### 🔹 Normal Ticket (Standard FIFO Queue)
* User enters customer name (e.g. `Dishan`, `Lokesh`, `Kevin`) and selects a seat.
* Customer is enqueued at the **REAR** of the booking line.
* Follows **FIFO (First In, First Out)**.

### ⚡ Priority Ticket (Priority Queue)
* User selects a customer from the **Registered Priority Pool** (`Benny - VIP - P1`, `Wellesley - Senior - P2`, `Venkat - Regular Priority - P3`).
* When booked, the customer **jumps ahead of normal customers** according to their priority number:
  * 🔴 **VIP — Priority 1** (Highest)
  * 🟠 **Senior Citizen — Priority 2**
  * 🟡 **Regular Priority — Priority 3**
* Equal priorities preserve arrival order (stable FIFO among same priority).
* Once booked, the customer is removed from the priority pool so they cannot book the same priority ticket again.

---

## 👥 Demonstration Example

1. **Initial Queue:**
   ```
   FRONT ➔ [ Dishan (Normal) ] ➔ [ Lokesh (Normal) ] ➔ [ Kevin (Normal) ] ➔ REAR
   ```
2. **Benny books VIP (Priority 1) Ticket:**
   ```
   FRONT ➔ [ 🔴 Benny (P1) ] ➔ [ Dishan (Normal) ] ➔ [ Lokesh (Normal) ] ➔ [ Kevin (Normal) ] ➔ REAR
   ```
3. **Wellesley books Senior Citizen (Priority 2) Ticket:**
   ```
   FRONT ➔ [ 🔴 Benny (P1) ] ➔ [ 🟠 Wellesley (P2) ] ➔ [ Dishan (Normal) ] ➔ [ Lokesh (Normal) ] ➔ [ Kevin (Normal) ] ➔ REAR
   ```
4. **Clicking [ SERVE NEXT / CONFIRM TICKET ]:**
   * 1st click: Serves **Benny** (VIP - P1)
   * 2nd click: Serves **Wellesley** (Senior Citizen - P2)
   * 3rd click: Serves **Dishan** (Normal)

---

## 🐍 Python Architecture (`data_structures.py` & `app.py`)

* **`data_structures.py`**:
  * `class Customer`: Represents customers with priority levels (1, 2, 3, 4/Normal).
  * `class CombinedBookingQueue`: Implements priority insertion with FIFO tie-breaking.
  * `class PriorityQueue`: Manages the pool of registered priority customers awaiting tickets.
  * `class MovieScreen`: Manages screen seats and dedicated queue instances.
* **`app.py`**:
  * Flask REST API backend managing all cinema queues and priority pools in Python memory.
* **`cli_demo.py`**:
  * Interactive terminal program for command prompt evaluation and viva defense.
* **`test_data_structures.py`**:
  * Automated unit test suite verifying FIFO order and Priority Queue sorting.

---

## 🚀 How to Run the Project

### 1. Launch the Flask Web Application (Recommended ⭐)
```bash
python app.py
```
* Opens the web application in your browser at **`http://localhost:8000`**.

### 2. Launch the Interactive Terminal CLI
```bash
python cli_demo.py
```

### 3. Run Automated Unit Tests
```bash
python test_data_structures.py
```

---

## 📂 Moving / Continuing on a Different Account or Computer

Because all project files are stored locally in:
```
C:\Users\Dishan\.gemini\antigravity\scratch\movie-ticket-queue\
```
* **On the same computer with a different account:** Simply open this folder as the workspace in Antigravity or your editor.
* **On a different computer:** Copy the `movie-ticket-queue` folder over to the new machine and run `python app.py` (requires Python + Flask: `pip install flask`).
