from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """
    Основная модель пользователя.
    Расширяем стандартную модель Django.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Основные данные
    email = models.EmailField(unique=True, null=True, blank=True)
    username = models.CharField(max_length=50, unique=True)

    # Привязки к платформам
    telegram_id = models.BigIntegerField(
        unique=True, null=True, blank=True,
        verbose_name='Telegram ID'
    )
    telegram_username = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name='Telegram Username'
    )
    twitch_id = models.CharField(
        max_length=50, unique=True, null=True, blank=True,
        verbose_name='Twitch ID'
    )
    twitch_username = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name='Twitch Username'
    )
    steam_id = models.CharField(
        max_length=50, unique=True, null=True, blank=True,
        verbose_name='Steam ID'
    )
    steam_trade_url = models.URLField(
        null=True, blank=True,
        verbose_name='Steam Trade URL'
    )

    # Статус
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Активен'
        INACTIVE = 'inactive', 'Неактивен'
        BANNED = 'banned', 'Заблокирован'
        PENDING = 'pending', 'Ожидает подтверждения'

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        db_table = 'users'

    def __str__(self):
        return self.username

    @property
    def is_banned(self):
        return self.status == self.Status.BANNED

    @property
    def has_steam(self):
        return bool(self.steam_id and self.steam_trade_url)

    @property
    def has_telegram(self):
        return bool(self.telegram_id)

    @property
    def has_twitch(self):
        return bool(self.twitch_id)


class Permission(models.Model):
    """
    Отдельное разрешение — например 'giveaways.create'
    """
    codename = models.CharField(
        max_length=100, unique=True,
        verbose_name='Код разрешения'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )

    class Meta:
        verbose_name = 'Разрешение'
        verbose_name_plural = 'Разрешения'
        db_table = 'permissions'

    def __str__(self):
        return f'{self.codename} — {self.name}'


class Role(models.Model):
    """
    Роль пользователя — Owner, Admin, Moderator и т.д.
    Чем выше level — тем больше прав.
    """
    name = models.CharField(
        max_length=50, unique=True,
        verbose_name='Название роли'
    )
    codename = models.CharField(
        max_length=50, unique=True,
        verbose_name='Код роли'
    )
    level = models.PositiveIntegerField(
        default=0,
        verbose_name='Уровень доступа'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    color = models.CharField(
        max_length=7, default='#FFFFFF',
        verbose_name='Цвет роли'
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Системная роль'
    )
    permissions = models.ManyToManyField(
        Permission,
        blank=True,
        verbose_name='Разрешения'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Роль'
        verbose_name_plural = 'Роли'
        db_table = 'roles'
        ordering = ['-level']

    def __str__(self):
        return f'{self.name} (уровень {self.level})'

    def can_be_deleted(self):
        # Owner нельзя удалить
        return not (self.is_system and self.codename == 'owner')


class UserRole(models.Model):
    """
    Связь пользователя с ролью.
    Одному пользователю можно назначить несколько ролей
    с разными сроками действия.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles',
        verbose_name='Пользователь'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles',
        verbose_name='Роль'
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_roles',
        verbose_name='Назначил'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Истекает'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Роль пользователя'
        verbose_name_plural = 'Роли пользователей'
        db_table = 'user_roles'
        unique_together = ('user', 'role')

    def __str__(self):
        return f'{self.user.username} → {self.role.name}'

    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        from django.utils import timezone
        return timezone.now() > self.expires_at


class UserPermission(models.Model):
    """
    Дополнительное разрешение для конкретного пользователя
    поверх его базовой роли. Может быть временным.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='extra_permissions',
        verbose_name='Пользователь'
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        verbose_name='Разрешение'
    )
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='granted_permissions',
        verbose_name='Выдал'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Истекает'
    )

    class Meta:
        verbose_name = 'Доп. разрешение'
        verbose_name_plural = 'Доп. разрешения'
        db_table = 'user_permissions_extra'
        unique_together = ('user', 'permission')

    def __str__(self):
        return f'{self.user.username} → {self.permission.codename}'