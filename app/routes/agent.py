from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AgentQueryRequest
from app.services.agent_service import AgentService

router = APIRouter(prefix="/agent", tags=["AI Agent"])

@router.post("/ask")
async def ask_agent(payload: AgentQueryRequest, db: Session = Depends(get_db)):
    """
    Endpoint that processes the user's question securely via POST body payload,
    using predictive intelligence and real inventory data processed via Pandas.
    """
    response = await AgentService.get_ai_recommendation(payload.query, db)
    
    return {"status": "success", "agent_response": response}