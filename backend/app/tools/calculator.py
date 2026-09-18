from app.tools.base import BaseTool


class CalculatorTool(BaseTool):

    name = "calculator"

    description = "Perform arithmetic calculations."

    async def execute(self, expression: str):

        try:
            result = eval(expression)

            return {
                "success": True,
                "result": result,
            }

        except Exception as e:

            return {
                "success": False,
                "error": str(e),
            }