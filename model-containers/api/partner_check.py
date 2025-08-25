from fastapi import FastAPI, HTTPException, Depends, Body
from pydantic import BaseModel
import os
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(title="Partner Check API")

class PartnerCheckRequest(BaseModel):
    partner_name: str
    additional_info: str = None

class PartnerCheckResponse(BaseModel):
    result: str
    reliability_score: float
    recommendations: list

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "partner-check-model"}

@app.post("/api/partner-check", response_model=PartnerCheckResponse)
async def check_partner(request: PartnerCheckRequest):
    try:
        logger.info(f"Получен запрос на проверку партнера: {request.partner_name}")
        
        # В реальном сервисе здесь будет логика проверки с использованием Gemini
        # Для тестирования возвращаем макет данных
        return {
            "result": f"Анализ для партнера {request.partner_name} завершен",
            "reliability_score": 0.85,
            "recommendations": [
                "Рекомендуется провести дополнительную проверку финансовых показателей",
                "Установить четкие сроки выполнения работ в договоре"
            ]
        }
    except Exception as e:
        logger.error(f"Ошибка при проверке партнера: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
