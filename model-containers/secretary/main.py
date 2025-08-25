import os
import logging
from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Импортируем общие модули
import sys
import os
sys.path.append("/app")
from common.database import init_db
from common.gemini_service import generate_response
from common.prompts import get_specialized_prompt

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация базы данных
init_db()

# Создаем роутер здоровья напрямую
from fastapi import APIRouter

# Создаем роутер здоровья вместо импорта
health_router = APIRouter()

@health_router.get("/health")
async def health_check():
    """Simple health check endpoint for this module."""
    return {"status": "healthy", "service": "secretary-model"}

# Создание FastAPI приложения
app = FastAPI(title="Secretary Module API")

# Регистрируем роутер здоровья
app.include_router(health_router)

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
    """Эндпоинт для обработки запросов чата для модуля секретаря"""
    try:
        # Специализированный промт для модуля секретаря
        specialized_prompt = get_specialized_prompt(request.message)
        
        # Генерация ответа
        response = await generate_response(specialized_prompt)
        
        # Формирование ответа
        return ChatResponse(
            text=response["text"],
            model=response.get("model", "gemini-secretary"),
            conversation_id=request.conversation_id,
            metadata=request.metadata
        )
    
    except Exception as e:
        logger.error(f"Error processing secretary chat request: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/calendar_data_extraction")
async def extract_calendar_data(request: ChatRequest):
    """Специализированный эндпоинт для извлечения календарных данных"""
    try:
        # Специализированный промт для извлечения календарных данных
        specialized_prompt = f"""
        Ты специалист по извлечению информации о календарных событиях.
        Проанализируй следующее сообщение и извлеки из него информацию о событиях в календаре,
        если такая информация присутствует.
        
        Сообщение пользователя: {request.message}
        
        Представь результат в структурированном JSON-формате, включая следующие поля:
        - event_detected (true/false): обнаружено ли событие
        - event_type: тип события (встреча, звонок, задача и т.д.)
        - date: дата события
        - start_time: время начала
        - end_time: время окончания
        - participants: участники
        - location: место проведения
        - description: описание события
        
        Если какие-то поля не могут быть заполнены из-за отсутствия информации, оставь их пустыми.
        """
        
        response = await generate_response(specialized_prompt)
        
        return {
            "extracted_data": response["text"],
            "model": response.get("model", "gemini-secretary"),
        }
    
    except Exception as e:
        logger.error(f"Error extracting calendar data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Эндпоинт для проверки работоспособности сервиса"""
    return {"status": "ok", "module": "secretary"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
