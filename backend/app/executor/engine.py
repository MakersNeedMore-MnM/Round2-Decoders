import asyncio

from app.executor.timeline import ExecutionTimeline
from app.supervisor.supervisor import Supervisor


class ExecutionEngine:
    """
    Executes a complete ProspectIQ workflow.
    """

    def __init__(self):
        self.supervisor = Supervisor()

    async def execute(
        self,
        task: str,
        current_user,
        db,
    ):

        timeline = ExecutionTimeline()

        timeline.add_event("Request received")

        timeline.add_event("Calling Supervisor")

        result = await self.supervisor.execute(
            task=task,
            current_user=current_user,
            db=db,
        )

        timeline.add_event("Supervisor completed")

        timeline.add_event("Execution finished")

        return {
            "timeline": timeline.get_events(),
            "result": result,
        }

    async def execute_stream(
        self,
        task: str,
        current_user,
        db,
    ):
        """
        Same workflow as execute(), but yields live progress events as
        an async generator instead of returning one blocking result.

        Each yielded item is a dict with a "type" key:
          - {"type": "step",  "data": {...}}   one per agent's progress
          - {"type": "final", "data": {...}}   the Supervisor's full result
          - {"type": "error", "data": {...}}   task failed

        Internally: the Supervisor runs as a background asyncio task
        against an emit() callback that pushes onto a queue; this
        generator just drains that queue and yields until it sees the
        sentinel that marks the task is done. Real work (LLM calls, DB
        writes, tool calls) still all happens on the Supervisor side —
        this is only wiring, it does not fake or reorder anything.
        """

        queue: asyncio.Queue = asyncio.Queue()
        DONE = object()

        async def emit(event: dict):
            await queue.put({"type": "step", "data": event})

        async def run_supervisor():
            try:
                result = await self.supervisor.execute(
                    task=task,
                    current_user=current_user,
                    db=db,
                    emit=emit,
                )
                await queue.put({"type": "final", "data": result})
            except Exception as exc:  # noqa: BLE001 - surface any failure to the client
                await queue.put(
                    {
                        "type": "error",
                        "data": {"message": str(exc) or exc.__class__.__name__},
                    }
                )
            finally:
                await queue.put(DONE)

        task_handle = asyncio.create_task(run_supervisor())

        try:
            while True:
                item = await queue.get()
                if item is DONE:
                    break
                yield item
        finally:
            # Make sure the background task is never left dangling if
            # the client disconnects mid-stream.
            if not task_handle.done():
                task_handle.cancel()