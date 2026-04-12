from rest_framework.permissions import BasePermission
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


class HasPermission(BasePermission):
    """
    Проверяет наличие конкретного разрешения.
    Использование:
        permission_classes = [HasPermission]
        required_permission = 'moderation.punish'
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        required = getattr(view, 'required_permission', None)
        if not required:
            return True

        return _user_has_permission(request.user, required)


class HasRoleLevel(BasePermission):
    """
    Проверяет минимальный уровень роли.
    Использование:
        permission_classes = [HasRoleLevel]
        required_level = 75
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        required = getattr(view, 'required_level', 0)
        return _user_has_level(request.user, required)


class IsOwner(BasePermission):
    """Только Owner (уровень 999)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return _user_has_level(request.user, 999)


class IsAdminOrOwner(BasePermission):
    """Admin или Owner (уровень 100+)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return _user_has_level(request.user, 100)


class IsModerator(BasePermission):
    """Moderator и выше (уровень 50+)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return _user_has_level(request.user, 50)


class IsStreamer(BasePermission):
    """Streamer и выше (уровень 30+)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return _user_has_level(request.user, 30)


# ─── Вспомогательные функции ──────────────────────────────────────────────

def _user_has_permission(user, codename):
    """
    Проверяет есть ли у пользователя конкретное разрешение.
    Смотрит в роли + персональные разрешения.
    """
    # Суперпользователь Django — всё разрешено
    if user.is_superuser:
        return True

    # Проверяем через роли
    for user_role in user.user_roles.filter(is_active=True):
        if not user_role.is_expired:
            if user_role.role.permissions.filter(codename=codename).exists():
                return True

    # Проверяем персональные разрешения
    if user.extra_permissions.filter(
        permission__codename=codename
    ).exists():
        return True

    return False


def _user_has_level(user, min_level):
    """
    Проверяет достаточно ли высокий уровень роли.
    """
    if user.is_superuser:
        return True

    for user_role in user.user_roles.filter(is_active=True):
        if not user_role.is_expired:
            if user_role.role.level >= min_level:
                return True

    return False


def get_user_level(user):
    """Возвращает максимальный уровень пользователя"""
    if user.is_superuser:
        return 999

    max_level = 0
    for user_role in user.user_roles.filter(is_active=True):
        if not user_role.is_expired:
            if user_role.role.level > max_level:
                max_level = user_role.role.level

    return max_level


# ─── Декораторы для function-based views ──────────────────────────────────

def require_permission(codename):
    """
    Декоратор для проверки разрешения.

    Использование:
        @require_permission('moderation.punish')
        @api_view(['POST'])
        def ban_user(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Требуется авторизация'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if not _user_has_permission(request.user, codename):
                return Response(
                    {'error': f'Недостаточно прав: {codename}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_level(min_level):
    """
    Декоратор для проверки уровня роли.

    Использование:
        @require_level(75)  # Super Moderator и выше
        @api_view(['POST'])
        def create_giveaway(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Требуется авторизация'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if not _user_has_level(request.user, min_level):
                return Response(
                    {'error': 'Недостаточный уровень доступа'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return func(request, *args, **kwargs)
        return wrapper
    return decorator