from app.planner.planner import Planner


class PlannerService:

    def __init__(self):

        self.planner = Planner()

    async def execute(
        self,
        task: str,
    ):

        return await self.planner.create_plan(task)