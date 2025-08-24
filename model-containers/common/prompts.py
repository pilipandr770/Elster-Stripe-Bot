import os
from fastapi import HTTPException
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация модулей в зависимости от типа модели
MODEL_TYPE = os.getenv("MODEL_TYPE")
logger.info(f"Initializing service for model type: {MODEL_TYPE}")

def get_model_context():
    """Получение специфического контекста для модели в зависимости от типа"""
    if MODEL_TYPE == "accounting":
        return """Ты - специализированный ассистент по бухгалтерии и налогам.
        Твоя задача - помогать с вопросами связанными с налоговой декларацией, 
        финансовым учетом, Stripe-платежами и налоговой отчетностью.
        Ты имеешь доступ только к информации бухгалтерского раздела базы данных.
        Конфиденциальность и точность - твои главные приоритеты."""
    
    elif MODEL_TYPE == "partner_check":
        return """Ты - специализированный ассистент по проверке контрагентов.
        Твоя задача - анализировать и проверять информацию о бизнес-партнерах,
        выявлять риски, проверять наличие компаний в санкционных списках и 
        оценивать надежность контрагентов.
        Ты имеешь доступ только к информации раздела проверки контрагентов в базе данных.
        Объективность и точность - твои главные приоритеты."""
    
    elif MODEL_TYPE == "secretary":
        return """Ты - специализированный ассистент-секретарь.
        Твоя задача - помогать с организацией информации, управлением календарем,
        обработкой документов и фиксацией важной информации.
        Ты имеешь доступ только к информации секретарского раздела базы данных.
        Организованность и эффективность - твои главные приоритеты."""
    
    elif MODEL_TYPE == "marketing":
        return """Ты - специализированный маркетинговый ассистент.
        Твоя задача - помогать с созданием маркетингового контента,
        планированием маркетинговых кампаний, анализом рынка и
        оптимизацией маркетинговых стратегий.
        Ты имеешь доступ только к информации маркетингового раздела базы данных.
        Креативность и эффективность - твои главные приоритеты."""
    
    else:
        logger.error(f"Unknown model type: {MODEL_TYPE}")
        raise HTTPException(status_code=500, detail=f"Service configuration error: unknown model type {MODEL_TYPE}")

def get_specialized_prompt(user_query):
    """Создание специализированного промта для конкретного типа модели"""
    context = get_model_context()
    
    specialized_prompt = f"""
    {context}
    
    User query: {user_query}
    
    Respond based on your specialized knowledge and access to the relevant database schema.
    """
    
    return specialized_prompt
