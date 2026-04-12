from django.db import models
from django.conf import settings
import uuid


class Prize(models.Model):
    """Приз — связан с победителем розыгрыша"""

    class Status(models.TextChoices):
        PENDING    = 'pending',    'Ожидает отправки'
        PROCESSING = 'processing', 'Обрабатывается'
        SENT       = 'sent',       'Отправлен'
        DELIVERED  = 'delivered',  'Получен'
        FAILED     = 'failed',     'Ошибка доставки'
        CANCELLED  = 'cancelled',  'Отменён'

    class DeliveryMethod(models.TextChoices):
        LISSKINS  = 'lisskins',  'LisSkins API'
        INVENTORY = 'inventory', 'Из инвентаря бота'
        MANUAL    = 'manual',    'Вручную'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    winner = models.OneToOneField(
        'giveaways.Winner',
        on_delete=models.CASCADE,
        related_name='prize',
        verbose_name='Победитель'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prizes',
        verbose_name='Получатель'
    )

    # Данные приза
    name = models.CharField(
        max_length=200,
        verbose_name='Название'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Статус'
    )
    delivery_method = models.CharField(
        max_length=20,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.LISSKINS,
        verbose_name='Метод доставки'
    )

    # Steam доставка
    steam_trade_url = models.URLField(
        blank=True,
        verbose_name='Steam Trade URL'
    )
    lisskins_order_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='ID заказа LisSkins'
    )
    trade_offer_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='ID трейд оффера Steam'
    )

    # Ошибка
    error_message = models.TextField(
        blank=True,
        verbose_name='Текст ошибки'
    )
    retry_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Попыток отправки'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Приз'
        verbose_name_plural = 'Призы'
        db_table = 'prizes'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} → {self.recipient.username}'