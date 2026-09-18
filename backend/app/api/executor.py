import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.executor.service import ExecutionService
from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

from sqlalchemy.orm import Session
from app.database.session import get_db
router = APIRouter(
    prefix="/executor",
    tags=["Execution"],
)

service = ExecutionService()


@router.get("/run")
async def run(
    prompt: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await service.execute(
        task=prompt,
        current_user=current_user,
        db=db,
    )


def _sse(event_type: str, data: dict) -> str:
    """Format one Server-Sent Events frame."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@router.get("/stream")
async def stream(
    prompt: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Live version of /executor/run: streams each agent's real progress
    (Planner -> Router -> Research/Sales-Analysis pipeline) to the
    client as it happens via Server-Sent Events, then a final event
    carrying the same Supervisor result /executor/run returns.

    Frame types:
      step  -> {"id", "label", "status", "agent"?, "detail"?}
      final -> the Supervisor's full result: {task, plan, agent, result, memory}
      error -> {"message"}
    """

    async def event_source():
        async for item in service.engine.execute_stream(
            task=prompt,
            current_user=current_user,
            db=db,
        ):
            yield _sse(item["type"], item["data"])

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            # Prevent proxies (e.g. nginx) from buffering the stream.
            "X-Accel-Buffering": "no",
        },
    )