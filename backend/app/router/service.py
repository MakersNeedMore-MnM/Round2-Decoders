from app.router.router import Router


class RouterService:

    def __init__(self):
        self.router = Router()

    async def execute(
        self,
        task: str,
    ):

        agent = await self.router.route(task)

        return await agent.run(task)