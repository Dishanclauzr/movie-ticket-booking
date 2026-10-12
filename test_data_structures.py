"""
=============================================================================
UNIT TESTS: COMBINED BOOKING QUEUE (FIFO + PRIORITY) & PRIORITY POOL
=============================================================================
Run with:
    python test_data_structures.py
=============================================================================
"""

import unittest
from data_structures import Customer, CombinedBookingQueue, PriorityQueue


class TestCombinedBookingQueue(unittest.TestCase):
    def setUp(self):
        self.queue = CombinedBookingQueue("Test Multiplex Queue")

    def test_normal_fifo_order(self):
        """Normal customers must strictly follow FIFO (First In, First Out)."""
        c1 = Customer(1, "Dishan", "A1", priority=4)
        c2 = Customer(2, "Lokesh", "A2", priority=4)
        c3 = Customer(3, "Kevin", "B4", priority=4)

        self.queue.enqueue(c1)
        self.queue.enqueue(c2)
        self.queue.enqueue(c3)

        self.assertEqual(self.queue.size(), 3)
        self.assertEqual(self.queue.dequeue().name, "Dishan")
        self.assertEqual(self.queue.dequeue().name, "Lokesh")
        self.assertEqual(self.queue.dequeue().name, "Kevin")
        self.assertTrue(self.queue.is_empty())

    def test_priority_customer_jumps_ahead_of_normal(self):
        """
        When normal customers [Dishan, Lokesh, Kevin] are waiting,
        and Benny (VIP - P1) books a priority ticket, Benny must be placed at the FRONT!
        """
        c_dishan = Customer(1, "Dishan", "A1", priority=4)
        c_lokesh = Customer(2, "Lokesh", "A2", priority=4)
        c_kevin = Customer(3, "Kevin", "B4", priority=4)
        self.queue.enqueue(c_dishan)
        self.queue.enqueue(c_lokesh)
        self.queue.enqueue(c_kevin)

        # Benny books VIP P1
        c_benny = Customer(4, "Benny", "B3", priority=1)
        self.queue.enqueue(c_benny)

        # Wellesley books Senior Citizen P2
        c_wellesley = Customer(5, "Wellesley", "C1", priority=2)
        self.queue.enqueue(c_wellesley)

        # Expected Queue: Benny (P1) -> Wellesley (P2) -> Dishan (Normal) -> Lokesh (Normal) -> Kevin (Normal)
        self.assertEqual(self.queue.dequeue().name, "Benny")
        self.assertEqual(self.queue.dequeue().name, "Wellesley")
        self.assertEqual(self.queue.dequeue().name, "Dishan")
        self.assertEqual(self.queue.dequeue().name, "Lokesh")
        self.assertEqual(self.queue.dequeue().name, "Kevin")

    def test_same_priority_fifo_tie_breaking(self):
        """
        If two customers have the SAME priority (e.g. Wellesley P2 and Venkat P2),
        arrival order (FIFO) must be strictly maintained between them.
        """
        c_wellesley = Customer(1, "Wellesley", "C1", priority=2)
        c_venkat = Customer(2, "Venkat", "C2", priority=2)
        c_dishan = Customer(3, "Dishan", "A1", priority=4)

        self.queue.enqueue(c_wellesley)
        self.queue.enqueue(c_dishan)
        self.queue.enqueue(c_venkat)

        # Queue: Wellesley (P2) -> Venkat (P2) -> Dishan (Normal)
        first = self.queue.dequeue()
        second = self.queue.dequeue()
        third = self.queue.dequeue()

        self.assertEqual(first.name, "Wellesley")
        self.assertEqual(second.name, "Venkat")
        self.assertEqual(third.name, "Dishan")


class TestPriorityPool(unittest.TestCase):
    def setUp(self):
        self.pool = PriorityQueue("Registered Pool")

    def test_pool_registration_and_removal(self):
        c1 = Customer(101, "Benny", priority=1)
        c2 = Customer(102, "Wellesley", priority=2)
        c3 = Customer(103, "Venkat", priority=3)

        self.pool.enqueue(c1)
        self.pool.enqueue(c2)
        self.pool.enqueue(c3)

        self.assertEqual(self.pool.size(), 3)
        self.assertEqual(self.pool.peek().name, "Benny")

        # When Benny books, he is removed by ID
        removed = self.pool.remove_by_id(101)
        self.assertEqual(removed.name, "Benny")
        self.assertEqual(self.pool.size(), 2)
        self.assertEqual(self.pool.peek().name, "Wellesley")


if __name__ == "__main__":
    unittest.main()
