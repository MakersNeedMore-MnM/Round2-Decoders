from collections import defaultdict, deque


class Memory:
    """
    Stores recent conversation history, scoped per user.

    Previously this held a single shared deque for the whole process,
    which meant every logged-in user's messages landed in the same
    history. Keying by user_id keeps conversations isolated.
    """

    def __init__(self, max_history: int = 20):
        self._max_history = max_history
        self._history: dict[int, deque] = defaultdict(
            lambda: deque(maxlen=max_history)
        )

    def add(self, user_id: int, role: str, content: str):
        self._history[user_id].append(
            {
                "role": role,
                "content": content,
            }
        )

    def get_history(self, user_id: int):
        return list(self._history[user_id])

    def clear(self, user_id: int):
        self._history[user_id].clear()