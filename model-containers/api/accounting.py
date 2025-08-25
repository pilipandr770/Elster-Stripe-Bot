from fastapi import FastAPI, HTTPException, Depends, Body
from pydantic import BaseModel
import os
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание FastAPI приложения
app = FastAPI(title="Accounting API")

class AccountingRequest(BaseModel):
    document_text: str
    document_type: str = None
    context: str = None

class AccountingResponse(BaseModel):
    result: str
    suggestions: list
    tax_implications: list = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "accounting-model"}

@app.post("/api/accounting", response_model=AccountingResponse)
async def process_accounting(request: AccountingRequest):
    try:
        logger.info(f"Получен запрос на обработку бухгалтерского документа типа: {request.document_type}")
        
        # В реальном сервисе здесь будет логика обработки с использованием Gemini
        # Для тестирования возвращаем макет данных
        return {
            "result": "Анализ документа завершен",
            "suggestions": [
                "Рекомендуется уточнить детали по статье расходов №3",
                "Добавить детализацию по налогу на добавленную стоимость"
            ],
            "tax_implications": [
                "Возможна налоговая оптимизация по статье №2",
                "Требуется дополнительная документация для подтверждения расходов"
            ]
        }
    except Exception as e:
        logger.error(f"Ошибка при обработке бухгалтерского документа: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
