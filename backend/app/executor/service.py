from app.executor.engine import ExecutionEngine


class ExecutionService:

    def __init__(self):
        self.engine = ExecutionEngine()

    async def execute(
        self,
        task: str,
        current_user,
        db,
    ):
        return await self.engine.execute(
            task=task,
            current_user=current_user,
            db=db,
        )