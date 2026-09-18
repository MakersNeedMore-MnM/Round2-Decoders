from loguru import logger
import sys

logger.remove()

logger.add(
    sys.stdout,
    level="INFO",
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | "
           "<level>{level}</level> | "
           "<cyan>{name}</cyan>:<cyan>{function}</cyan> | "
           "{message}",
)

__all__ = ["logger"]