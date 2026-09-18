"""
Lightweight helper for the live-orchestration event stream.

Every agent/service in the pipeline that does real work (Supervisor,
Planner, Router, ResearchAgentV2, AssistantService's multi-agent
pipeline...) accepts an optional `emit` callable and reports its
progress through `emit_step()` instead of managing the queue/SSE
plumbing itself.

`emit` is `None` for every *existing* caller (the plain
/executor/run and /supervisor/execute endpoints, background jobs,
tests, etc.) — `emit_step()` just no-ops in that case, so nothing
about the non-streaming code paths changes. Only the new
/executor/stream endpoint passes a real `emit` (see
app/executor/engine.py), so this is purely additive.
"""

from typing import Awaitable, Callable, Optional

# An emit callback takes one event dict and schedules it for delivery
# to the client (in practice: puts it on an asyncio.Queue that the SSE
# endpoint is draining).
Emit = Optional[Callable[[dict], Awaitable[None]]]


async def emit_step(
    emit: Emit,
    *,
    id: str,
    label: str,
    status: str,
    agent: Optional[str] = None,
    detail: Optional[str] = None,
):
    """
    Report one orchestration event. Safe to call unconditionally —
    no-ops when `emit` is None.

    id:     stable identifier for this step (e.g. "persona") so the
            frontend can find-and-update the matching row instead of
            appending a new one for every status change.
    label:  human-readable text to show in the UI right now (backend
            owns the copy, not the frontend).
    status: "active" | "done" | "error"
    agent:  optional real agent/service name behind this step.
    detail: optional short extra context (e.g. tool used, error msg).
    """
    if emit is None:
        return

    payload: dict = {"id": id, "label": label, "status": status}

    if agent:
        payload["agent"] = agent
    if detail:
        payload["detail"] = detail

    await emit(payload)