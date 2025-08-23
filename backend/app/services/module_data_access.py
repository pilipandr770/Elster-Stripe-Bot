from sqlalchemy.orm import Session
from ..models import User, Message, Thread, ModuleEnum

class ModuleDataAccess:
    """Базовый класс для доступа к данным, специфичным для каждого модуля"""
    
    def __init__(self, session: Session, user_id: int, module: ModuleEnum):
        self.session = session
        self.user_id = user_id
        self.module = module
        
    def get_module_thread(self):
        """Получить или создать поток для модуля"""
        thread = (
            self.session.query(Thread)
            .filter(
                Thread.user_id == self.user_id,
                Thread.module == self.module
            )
            .first()
        )
        
        if not thread:
            thread = Thread(
                user_id=self.user_id,
                module=self.module
            )
            self.session.add(thread)
            self.session.commit()
            
        return thread
    
    def get_messages(self, limit=10):
        """Получить сообщения для данного модуля"""
        thread = self.get_module_thread()
        
        messages = (
            self.session.query(Message)
            .filter(Message.thread_id == thread.id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        
        return list(reversed(messages))
    
    def save_message(self, role: str, content: str):
        """Сохранить сообщение в текущий поток"""
        thread = self.get_module_thread()
        
        message = Message(
            thread_id=thread.id,
            role=role,
            content=content
        )
        
        self.session.add(message)
        self.session.commit()
        
        return message


class AccountingDataAccess(ModuleDataAccess):
    """Доступ к данным для модуля бухгалтерии"""
    
    def __init__(self, session: Session, user_id: int):
        super().__init__(session, user_id, ModuleEnum.accounting)
    
    def get_transactions(self, limit=100):
        """Получить транзакции пользователя"""
        # TODO: Реализовать запрос к таблице транзакций
        return []
    
    def get_tax_submissions(self, limit=10):
        """Получить налоговые декларации пользователя"""
        # TODO: Реализовать запрос к таблице деклараций
        return []


class PartnerCheckDataAccess(ModuleDataAccess):
    """Доступ к данным для модуля проверки партнеров"""
    
    def __init__(self, session: Session, user_id: int):
        super().__init__(session, user_id, ModuleEnum.partner_check)
    
    def get_partners(self, limit=100):
        """Получить партнеров пользователя"""
        # TODO: Реализовать запрос к таблице партнеров
        return []
    
    def get_partner_checks(self, partner_id=None, limit=10):
        """Получить результаты проверок партнеров"""
        # TODO: Реализовать запрос к таблице результатов проверок
        return []


class SecretaryDataAccess(ModuleDataAccess):
    """Доступ к данным для модуля секретаря"""
    
    def __init__(self, session: Session, user_id: int):
        super().__init__(session, user_id, ModuleEnum.secretary)
    
    def get_emails(self, limit=100):
        """Получить электронные письма пользователя"""
        # TODO: Реализовать запрос к таблице писем
        return []
    
    def get_tasks(self, status=None, limit=50):
        """Получить задачи пользователя"""
        # TODO: Реализовать запрос к таблице задач
        return []


class MarketingDataAccess(ModuleDataAccess):
    """Доступ к данным для маркетингового модуля"""
    
    def __init__(self, session: Session, user_id: int):
        super().__init__(session, user_id, ModuleEnum.marketing)
    
    def get_channels(self, limit=50):
        """Получить маркетинговые каналы пользователя"""
        # TODO: Реализовать запрос к таблице каналов
        return []
    
    def get_topics(self, limit=50):
        """Получить маркетинговые темы пользователя"""
        # TODO: Реализовать запрос к таблице тем
        return []
    
    def get_scheduled_posts(self, from_date=None, to_date=None, limit=100):
        """Получить запланированные публикации"""
        # TODO: Реализовать запрос к таблице публикаций
        return []


def get_data_access_for_module(session: Session, user_id: int, module: ModuleEnum):
    """Фабричный метод для получения соответствующего класса доступа к данным"""
    if module == ModuleEnum.accounting:
        return AccountingDataAccess(session, user_id)
    elif module == ModuleEnum.partner_check:
        return PartnerCheckDataAccess(session, user_id)
    elif module == ModuleEnum.secretary:
        return SecretaryDataAccess(session, user_id)
    elif module == ModuleEnum.marketing:
        return MarketingDataAccess(session, user_id)
    else:
        return ModuleDataAccess(session, user_id, module)
