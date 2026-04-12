from django.db import models
from django.conf import settings
import uuid


class Giveaway(models.Model):
    """Розыгрыш"""

    class Platform(models.TextChoices):
        TELEGRAM = 'telegram', 'Telegram'
        TWITCH   = 'twitch',   'Twitch'
        BOTH     = 'both',     'Оба'

    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Черновик'
        ACTIVE    = 'active',    'Активный'
        DRAWING   = 'drawing',   'Подведение итогов'
        FINISHED  = 'finished',  'Завершён'
        CANCELLED = 'cancelled', 'Отменён'

    class PrizeType(models.TextChoices):
        SKIN  = 'skin',  'Скин CS2'
        OTHER = 'other', 'Другое'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Основные данные
    title = models.CharField(
        max_length=200,
        verbose_name='Название приза'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    prize_type = models.CharField(
        max_length=20,
        choices=PrizeType.choices,
        default=PrizeType.SKIN,
        verbose_name='Тип приза'
    )

    # Скин CS2
    skin_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Название скина'
    )
    skin_max_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Макс. цена скина (руб)'
    )
    skin_image_url = models.URLField(
        blank=True,
        verbose_name='Фото скина'
    )

    # Платформы и статус
    platform = models.CharField(
        max_length=20,
        choices=Platform.choices,
        default=Platform.TELEGRAM,
        verbose_name='Платформа'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Статус'
    )

    # Условия участия
    require_telegram = models.BooleanField(
        default=True,
        verbose_name='Кнопка участвовать в TG'
    )
    require_twitch_stream = models.BooleanField(
        default=False,
        verbose_name='Быть на стриме Twitch'
    )
    twitch_keyword = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Ключевое слово в Twitch чат'
    )

    # Проверка победителя
    auto_check_twitch = models.BooleanField(
        default=True,
        verbose_name='Автопроверка активности Twitch'
    )
    winner_response_timeout = models.PositiveIntegerField(
        default=60,
        verbose_name='Время на ответ победителя (сек)'
    )

    # Telegram
    telegram_post_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='ID поста в Telegram'
    )
    telegram_post_text = models.TextField(
        blank=True,
        verbose_name='Текст поста'
    )

    # Время
    starts_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Начало'
    )
    ends_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Окончание'
    )
    draw_manually = models.BooleanField(
        default=False,
        verbose_name='Подвести итоги вручную'
    )

    # Метаданные
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_giveaways',
        verbose_name='Создал'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Розыгрыш'
        verbose_name_plural = 'Розыгрыши'
        db_table = 'giveaways'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'

    @property
    def participants_count(self):
        return self.participants.filter(is_active=True).count()

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE

    @property
    def can_participate(self):
        from django.utils import timezone
        if self.status != self.Status.ACTIVE:
            return False
        if self.ends_at and timezone.now() > self.ends_at:
            return False
        return True


class Participant(models.Model):
    """Участник розыгрыша"""

    giveaway = models.ForeignKey(
        Giveaway,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name='Розыгрыш'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participations',
        verbose_name='Пользователь'
    )

    # Откуда пришёл участник
    class Source(models.TextChoices):
        TELEGRAM = 'telegram', 'Telegram кнопка'
        TWITCH   = 'twitch',   'Twitch keyword'
        MANUAL   = 'manual',   'Вручную'

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.TELEGRAM,
        verbose_name='Источник'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Участник'
        verbose_name_plural = 'Участники'
        db_table = 'giveaway_participants'
        unique_together = ('giveaway', 'user')

    def __str__(self):
        return f'{self.user.username} в {self.giveaway.title}'


class Winner(models.Model):
    """Победитель розыгрыша"""

    class Status(models.TextChoices):
        PENDING    = 'pending',    'Ожидает ответа'
        RESPONDED  = 'responded',  'Ответил'
        CONFIRMED  = 'confirmed',  'Подтверждён'
        REJECTED   = 'rejected',   'Не прошёл проверку'
        REROLLED   = 'rerolled',   'Перевыбор'

    giveaway = models.ForeignKey(
        Giveaway,
        on_delete=models.CASCADE,
        related_name='winners',
        verbose_name='Розыгрыш'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wins',
        verbose_name='Победитель'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Статус'
    )

    # Twitch проверка
    twitch_username_provided = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Twitch ник от победителя'
    )
    twitch_verified = models.BooleanField(
        null=True,
        verbose_name='Проверен на Twitch'
    )

    # Перевыбор
    reroll_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Количество перевыборов'
    )
    reroll_reason = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Причина перевыбора'
    )

    drawn_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Победитель'
        verbose_name_plural = 'Победители'
        db_table = 'giveaway_winners'

    def __str__(self):
        return f'{self.user.username} → {self.giveaway.title}'