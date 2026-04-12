from django.db import models
from django.conf import settings
import uuid


class Punishment(models.Model):
    """Наказание пользователя"""

    class Type(models.TextChoices):
        WARNING = 'warning', 'Предупреждение'
        MUTE    = 'mute',    'Мут'
        BAN     = 'ban',     'Бан'

    class Platform(models.TextChoices):
        TELEGRAM = 'telegram', 'Telegram'
        TWITCH   = 'twitch',   'Twitch'
        ALL      = 'all',      'Все платформы'
        SITE     = 'site',     'Сайт'

    class Status(models.TextChoices):
        ACTIVE   = 'active',   'Активное'
        EXPIRED  = 'expired',  'Истекло'
        REVOKED  = 'revoked',  'Отменено'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='punishments',
        verbose_name='Пользователь'
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='issued_punishments',
        verbose_name='Выдал'
    )
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revoked_punishments',
        verbose_name='Отменил'
    )

    punishment_type = models.CharField(
        max_length=20,
        choices=Type.choices,
        verbose_name='Тип'
    )
    platform = models.CharField(
        max_length=20,
        choices=Platform.choices,
        default=Platform.ALL,
        verbose_name='Платформа'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name='Статус'
    )

    reason = models.TextField(verbose_name='Причина')

    # Время
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Истекает'
    )
    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Отменено в'
    )

    # AI модерация
    ai_detected = models.BooleanField(
        default=False,
        verbose_name='Обнаружено AI'
    )
    ai_confidence = models.FloatField(
        null=True,
        blank=True,
        verbose_name='Уверенность AI (%)'
    )
    ai_category = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Категория AI'
    )

    class Meta:
        verbose_name = 'Наказание'
        verbose_name_plural = 'Наказания'
        db_table = 'punishments'
        ordering = ['-issued_at']

    def __str__(self):
        return (
            f'{self.get_punishment_type_display()} — '
            f'{self.user.username}'
        )

    @property
    def is_active(self):
        if self.status != self.Status.ACTIVE:
            return False
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() < self.expires_at
        return True


class Appeal(models.Model):
    """Апелляция на наказание"""

    class Status(models.TextChoices):
        PENDING  = 'pending',  'На рассмотрении'
        APPROVED = 'approved', 'Одобрена'
        REJECTED = 'rejected', 'Отклонена'
        CLARIFY  = 'clarify',  'Запрошено уточнение'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    punishment = models.ForeignKey(
        Punishment,
        on_delete=models.CASCADE,
        related_name='appeals',
        verbose_name='Наказание'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appeals',
        verbose_name='Пользователь'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_appeals',
        verbose_name='Рассмотрел'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Статус'
    )

    text = models.TextField(verbose_name='Текст апелляции')
    moderator_response = models.TextField(
        blank=True,
        verbose_name='Ответ модератора'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Рассмотрена'
    )

    class Meta:
        verbose_name = 'Апелляция'
        verbose_name_plural = 'Апелляции'
        db_table = 'appeals'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f'Апелляция {self.user.username} — '
            f'{self.get_status_display()}'
        )


class Ticket(models.Model):
    """Тикет поддержки"""

    class Status(models.TextChoices):
        OPEN    = 'open',    'Открыт'
        IN_WORK = 'in_work', 'В работе'
        WAITING = 'waiting', 'Ожидает ответа'
        CLOSED  = 'closed',  'Закрыт'

    class Category(models.TextChoices):
        GENERAL    = 'general',    'Общий вопрос'
        PRIZE      = 'prize',      'Проблема с призом'
        PUNISHMENT = 'punishment', 'Наказание'
        BUG        = 'bug',        'Ошибка на сайте'
        OTHER      = 'other',      'Другое'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name='Пользователь'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name='Назначен модератору'
    )

    subject = models.CharField(
        max_length=200,
        verbose_name='Тема'
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
        verbose_name='Категория'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name='Статус'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Закрыт'
    )

    class Meta:
        verbose_name = 'Тикет'
        verbose_name_plural = 'Тикеты'
        db_table = 'tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f'#{str(self.id)[:8]} — {self.subject}'


class TicketMessage(models.Model):
    """Сообщение в тикете"""

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Тикет'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_messages',
        verbose_name='Автор'
    )

    text = models.TextField(verbose_name='Текст')
    is_staff = models.BooleanField(
        default=False,
        verbose_name='От модератора'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Сообщение тикета'
        verbose_name_plural = 'Сообщения тикетов'
        db_table = 'ticket_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author.username}: {self.text[:50]}'


class AuditLog(models.Model):
    """
    Журнал всех действий в системе.
    Записывается автоматически при каждом важном действии.
    """

    class Action(models.TextChoices):
        # Пользователи
        USER_REGISTER  = 'user.register',  'Регистрация'
        USER_LOGIN     = 'user.login',     'Вход'
        USER_LOGOUT    = 'user.logout',    'Выход'
        USER_BAN       = 'user.ban',       'Блокировка'
        # Роли
        ROLE_ASSIGN    = 'role.assign',    'Назначение роли'
        ROLE_REVOKE    = 'role.revoke',    'Снятие роли'
        # Розыгрыши
        GIVEAWAY_CREATE  = 'giveaway.create',  'Создание розыгрыша'
        GIVEAWAY_DRAW    = 'giveaway.draw',    'Подведение итогов'
        GIVEAWAY_CANCEL  = 'giveaway.cancel',  'Отмена розыгрыша'
        # Модерация
        PUNISHMENT_ISSUE  = 'punishment.issue',  'Выдача наказания'
        PUNISHMENT_REVOKE = 'punishment.revoke', 'Отмена наказания'
        APPEAL_RESOLVE    = 'appeal.resolve',    'Решение апелляции'
        # Настройки
        SETTINGS_CHANGE = 'settings.change', 'Изменение настроек'
        ROLE_CREATE     = 'role.create',     'Создание роли'
        ROLE_DELETE     = 'role.delete',     'Удаление роли'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        verbose_name='Кто сделал'
    )
    action = models.CharField(
        max_length=50,
        choices=Action.choices,
        verbose_name='Действие'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs_as_target',
        verbose_name='Над кем'
    )

    # Детали действия в JSON
    details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Детали'
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP адрес'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Запись аудита'
        verbose_name_plural = 'Журнал аудита'
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f'{self.actor} → {self.get_action_display()} '
            f'({self.created_at.strftime("%d.%m.%Y %H:%M")})'
        )

    @classmethod
    def log(cls, actor, action, target_user=None,
            details=None, ip_address=None):
        """
        Удобный метод для записи в журнал.

        Использование:
            AuditLog.log(
                actor=request.user,
                action=AuditLog.Action.PUNISHMENT_ISSUE,
                target_user=banned_user,
                details={'reason': 'spam', 'duration': '24h'},
                ip_address=request.META.get('REMOTE_ADDR')
            )
        """
        return cls.objects.create(
            actor=actor,
            action=action,
            target_user=target_user,
            details=details or {},
            ip_address=ip_address
        )