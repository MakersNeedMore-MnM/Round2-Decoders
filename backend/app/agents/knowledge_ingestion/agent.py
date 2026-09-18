from app.agents.knowledge_extraction.agent import KnowledgeExtractionAgent
from app.agents.knowledge_ingestion.detector import FileDetector
from app.agents.knowledge_ingestion.extractor import DataExtractor
from app.agents.knowledge_ingestion.normalizer import DataNormalizer


class KnowledgeIngestionAgent:
    """
    Coordinates the complete knowledge ingestion pipeline.

    Flow:
        Detect
            ↓
        Extract
            ↓
        Normalize
            ↓
        Knowledge Extraction (LLM)
            ↓
        Return structured knowledge
    """

    def __init__(self):
        self.knowledge_extractor = KnowledgeExtractionAgent()

    async def ingest(
        self,
        text: str | None = None,
        file_name: str | None = None,
    ):

        # Step 1: Detect input type
        source_type = FileDetector.detect(
            file_name=file_name,
            text=text,
        )

        # Step 2: Extract raw content
        extracted = DataExtractor.extract_text(
            source_type=source_type,
            content=text or "",
        )

        # Step 3: Normalize into a common format
        normalized = DataNormalizer.normalize(
            source_type=source_type,
            source_name=file_name or "chat",
            content=extracted,
        )

        # Step 4: Extract structured business knowledge
        knowledge = await self.knowledge_extractor.extract(
            extracted
        )

        # Step 5: Attach extracted knowledge
        normalized["knowledge"] = knowledge

        return normalized