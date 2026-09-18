from app.supervisor.supervisor import Supervisor


class SupervisorService:

    def __init__(self):
        self.supervisor = Supervisor()

    async def execute(
        self,
        task: str,
        current_user,
        db,
        emit=None,
    ):
        return await self.supervisor.execute(task, current_user, db, emit=emit)