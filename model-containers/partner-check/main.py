import os
import logging
from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Импортируем общие модули
import sys
sys.path.append("/app")
from common.database import init_db
from common.gemini_service import generate_response
from common.prompts import get_specialized_prompt

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация базы данных
init_db()

# Создание FastAPI приложения
app = FastAPI(title="Partner Check Module API")

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    text: str
    model: str
    conversation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Эндпоинт для обработки запросов чата для модуля проверки контрагентов"""
    try:
        # Специализированный промт для модуля проверки контрагентов
        specialized_prompt = get_specialized_prompt(request.message)
        
        # Генерация ответа
        response = await generate_response(specialized_prompt)
        
        # Формирование ответа
        return ChatResponse(
            text=response["text"],
            model=response.get("model", "gemini-partner-check"),
            conversation_id=request.conversation_id,
            metadata=request.metadata
        )
    
    except Exception as e:
        logger.error(f"Error processing partner check chat request: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Эндпоинт для проверки работоспособности сервиса"""
    return {"status": "ok", "module": "partner_check"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
