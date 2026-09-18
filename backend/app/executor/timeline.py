from datetime import datetime


class ExecutionTimeline:
    """
    Stores execution events for a single request.
    """

    def __init__(self):
        self.events = []

    def add_event(self, event: str):
        self.events.append(
            {
                "time": datetime.now().strftime("%H:%M:%S"),
                "event": event,
            }
        )

    def get_events(self):
        return self.events