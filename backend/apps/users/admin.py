from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission, UserRole, UserPermission


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'username', 'email', 'status',
        'has_telegram', 'has_twitch', 'has_steam',
        'is_staff', 'created_at'
    )
    list_filter = ('status', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'telegram_username', 'twitch_username')
    ordering = ('-created_at',)

    fieldsets = (
        ('Основное', {
            'fields': ('username', 'email', 'password', 'status')
        }),
        ('Telegram', {
            'fields': ('telegram_id', 'telegram_username'),
            'classes': ('collapse',)
        }),
        ('Twitch', {
            'fields': ('twitch_id', 'twitch_username'),
            'classes': ('collapse',)
        }),
        ('Steam', {
            'fields': ('steam_id', 'steam_trade_url'),
            'classes': ('collapse',)
        }),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups'),
            'classes': ('collapse',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at', 'last_login_ip'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'status'),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'codename', 'level', 'is_system', 'created_at')
    list_filter = ('is_system',)
    search_fields = ('name', 'codename')
    ordering = ('-level',)
    filter_horizontal = ('permissions',)

    def get_readonly_fields(self, request, obj=None):
        # Системные роли нельзя полностью редактировать
        if obj and obj.is_system:
            return ('codename', 'is_system')
        return ()

    def has_delete_permission(self, request, obj=None):
        # Owner нельзя удалить
        if obj and obj.codename == 'owner':
            return False
        return super().has_delete_permission(request, obj)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('codename', 'name')
    search_fields = ('codename', 'name')
    ordering = ('codename',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'role', 'assigned_by',
        'assigned_at', 'expires_at', 'is_active', 'is_expired'
    )
    list_filter = ('role', 'is_active')
    search_fields = ('user__username', 'role__name')
    ordering = ('-assigned_at',)
    readonly_fields = ('assigned_at',)


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'permission', 'granted_by', 'granted_at', 'expires_at')
    search_fields = ('user__username', 'permission__codename')
    ordering = ('-granted_at',)
    readonly_fields = ('granted_at',)