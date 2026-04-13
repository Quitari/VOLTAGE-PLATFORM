from django.db import models


class BotSettings(models.Model):
    """Настройки Telegram бота — редактируются через Admin панель"""

    # Тексты приветствия
    welcome_new = models.TextField(
        default='👋 Добро пожаловать! <b>{name}</b>\n\n'
                '🎮 <b>VOLTAGE Platform</b> — розыгрыши скинов CS2 '
                'и других призов.\n\nВыбери что тебя интересует:',
        verbose_name='Приветствие (новый пользователь)'
    )
    welcome_back = models.TextField(
        default='👋 С возвращением! <b>{name}</b>\n\nВыбери раздел:',
        verbose_name='Приветствие (возвращающийся)'
    )

    # Текст поста розыгрыша
    giveaway_post_template = models.TextField(
        default='🎁 <b>РОЗЫГРЫШ: {title}</b>\n\n'
                '{description}\n\n'
                '👥 Участников: {count}\n'
                '⏰ Итоги: {ends_at}\n\n'
                '👇 Нажми кнопку чтобы участвовать!',
        verbose_name='Шаблон поста розыгрыша'
    )

    # Текст кнопки участия
    join_button_text = models.CharField(
        max_length=50,
        default='🎯 Участвовать',
        verbose_name='Текст кнопки участия'
    )

    # ID Telegram канала для публикации
    channel_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='ID Telegram канала'
    )
    channel_username = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Username канала (@voltage)'
    )

    # ID чата канала (если есть)
    chat_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='ID чата канала'
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Настройки бота'
        verbose_name_plural = 'Настройки бота'
        db_table = 'bot_settings'

    def __str__(self):
        return 'Настройки Telegram бота'

    @classmethod
    def get(cls):
        """Получить настройки или создать с дефолтными значениями"""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
    
class TwitchCommand(models.Model):
    """Команды Twitch чата"""

    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Команда'
    )
    response = models.TextField(
        verbose_name='Ответ'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    cooldown = models.PositiveIntegerField(
        default=5,
        verbose_name='Кулдаун (сек)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Команда Twitch'
        verbose_name_plural = 'Команды Twitch'
        db_table = 'twitch_commands'
        ordering = ['name']

    def __str__(self):
        return f'!{self.name}'