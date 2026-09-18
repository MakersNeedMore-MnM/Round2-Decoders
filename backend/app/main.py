from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.core.config import settings
from app.core.logger import logger

from app.api.llm import router as llm_router
from app.api.tools import router as tool_router
from app.api.agents import router as agent_router
from app.api.router import router as router_api
from app.api.planner import router as planner_router
from app.api.supervisor import router as supervisor_router
from app.api.memory import router as memory_router
from app.api.executor import router as executor_router
from app.api.auth import router as auth_router
from app.api.knowledge import router as knowledge_router
from app.api.persona import router as persona_router
from app.api.intent import router as intent_router
from app.api.strategy import router as strategy_router
from app.api.guardrail import router as guardrail_router
from app.api.assistant import router as assistant_router
from app.api.analysis import router as analysis_router
from app.api.upload import router as upload_router
from app.api.website import router as website_router
from app.api.workspace import router as workspace_router
from app.api.queue import router as queue_router
from app.api.audit import router as audit_router

from app.database.database import engine
from app.database.base import Base

from app.models.user import User
from app.models.connected_account import ConnectedAccount
from app.api.enrichment import router as enrichment_router


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ProspectIQ",
)

# =========================
# CORS Configuration
# =========================
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    # Vercel Frontend
    "https://sales-agent-ai-jet.vercel.app",

    # Preview deployments
    "https://sales-agent-csgz0v8qi-gaurav88s-projects.vercel.app/",
    "https://sales-agent-ai-git-main-gaurav88s-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Routers
# =========================

app.include_router(health_router)
app.include_router(llm_router)
app.include_router(tool_router)
app.include_router(agent_router)
app.include_router(router_api)
app.include_router(planner_router)
app.include_router(supervisor_router)
app.include_router(memory_router)
app.include_router(executor_router)
app.include_router(auth_router)
app.include_router(knowledge_router)
app.include_router(persona_router)
app.include_router(intent_router)
app.include_router(strategy_router)
app.include_router(guardrail_router)
app.include_router(assistant_router)
app.include_router(analysis_router)
app.include_router(upload_router)
app.include_router(website_router)
app.include_router(workspace_router)
app.include_router(queue_router)
app.include_router(audit_router)
app.include_router(enrichment_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to ProspectIQ 🚀",
        "version": settings.APP_VERSION,
    }
Base.metadata.create_all(bind=engine)

logger.info("ProspectIQ initialized successfully.")