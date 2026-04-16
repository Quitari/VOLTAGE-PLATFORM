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

    # ─── Настройки публичного сайта ───────────────────────────────
    # Информация о стримере
    streamer_name = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Имя стримера'
    )
    streamer_description = models.TextField(
        default='',
        blank=True,
        verbose_name='Описание стримера'
    )
    streamer_avatar_url = models.URLField(
        default='',
        blank=True,
        verbose_name='URL аватара'
    )
    streamer_avatar_file = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name='Файл аватара'
    )
    twitch_url = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Ссылка Twitch'
    )
    telegram_url = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Ссылка Telegram'
    )
    vk_url = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Ссылка VK'
    )
    youtube_url = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Ссылка YouTube'
    )

    # ─── Переключатели блоков сайта ───────────────────────────────
    show_giveaways = models.BooleanField(
        default=True,
        verbose_name='Показывать розыгрыши'
    )
    show_winners = models.BooleanField(
        default=True,
        verbose_name='Показывать победителей'
    )
    show_schedule = models.BooleanField(
        default=True,
        verbose_name='Показывать расписание'
    )
    show_moments = models.BooleanField(
        default=False,
        verbose_name='Показывать лучшие моменты'
    )
    show_rules = models.BooleanField(
        default=True,
        verbose_name='Показывать правила'
    )

    # ─── Расписание стримов ───────────────────────────────────────
    schedule = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Расписание стримов'
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
    
class ViewerStats(models.Model):
    """Статистика зрителей Twitch"""
    twitch_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Twitch ID'
    )
    twitch_login = models.CharField(
        max_length=50,
        verbose_name='Twitch логин'
    )
    channel_id = models.CharField(
        max_length=50,
        verbose_name='ID канала'
    )
    watch_time_minutes = models.PositiveIntegerField(
        default=0,
        verbose_name='Время просмотра (мин)'
    )
    messages_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Сообщений'
    )
    last_seen = models.DateTimeField(
        auto_now=True,
        verbose_name='Последний раз в чате'
    )
    first_seen = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Первый раз в чате'
    )

    class Meta:
        verbose_name = 'Статистика зрителя'
        verbose_name_plural = 'Статистика зрителей'
        db_table = 'viewer_stats'
        unique_together = ('twitch_id', 'channel_id')

    def __str__(self):
        return f'{self.twitch_login} — {self.watch_time_minutes} мин'