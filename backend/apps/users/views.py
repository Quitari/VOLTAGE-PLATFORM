from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.authentication import BasicAuthentication
from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UpdateProfileSerializer,
)


def get_tokens_for_user(user):
    """Генерирует JWT токены для пользователя"""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/auth/register/
    Регистрация нового пользователя
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Регистрация успешна'
        }, status=status.HTTP_201_CREATED)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    POST /api/auth/login/
    Вход в систему
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        # Сохраняем IP последнего входа
        ip = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip:
            ip = ip.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        user.last_login_ip = ip
        user.save(update_fields=['last_login_ip'])

        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Вход выполнен'
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    POST /api/auth/logout/
    Выход — инвалидирует refresh токен
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Выход выполнен'})
    except Exception:
        return Response({'message': 'Выход выполнен'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET /api/auth/me/
    Данные текущего пользователя
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    PATCH /api/auth/profile/
    Обновление профиля
    """
    serializer = UpdateProfileSerializer(
        request.user,
        data=request.data,
        partial=True,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response({
            'user': UserSerializer(request.user).data,
            'message': 'Профиль обновлён'
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

from .permissions import require_permission, require_level, get_user_level
from .models import Role, UserRole
from .serializers import RoleSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_roles(request):
    """
    GET /api/auth/roles/
    Список всех ролей — доступен всем авторизованным
    """
    roles = Role.objects.all().order_by('-level')
    serializer = RoleSerializer(roles, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_role(request):
    """
    POST /api/auth/assign-role/
    Назначить роль пользователю — только Admin+
    """
    if get_user_level(request.user) < 100:
        return Response(
            {'error': 'Недостаточно прав'},
            status=status.HTTP_403_FORBIDDEN
        )

    user_id = request.data.get('user_id')
    role_codename = request.data.get('role')
    expires_at = request.data.get('expires_at')

    if not user_id or not role_codename:
        return Response(
            {'error': 'Укажи user_id и role'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target_user = User.objects.get(id=user_id)
        role = Role.objects.get(codename=role_codename)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Role.DoesNotExist:
        return Response(
            {'error': 'Роль не найдена'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Нельзя назначить роль выше своей
    if role.level >= get_user_level(request.user):
        return Response(
            {'error': 'Нельзя назначить роль выше своей'},
            status=status.HTTP_403_FORBIDDEN
        )

    user_role, created = UserRole.objects.get_or_create(
        user=target_user,
        role=role,
        defaults={
            'assigned_by': request.user,
            'expires_at': expires_at,
        }
    )

    if not created:
        user_role.is_active = True
        user_role.expires_at = expires_at
        user_role.save()

    return Response({
        'message': f'Роль {role.name} назначена пользователю {target_user.username}',
        'user': UserSerializer(target_user).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permission(request):
    """
    GET /api/auth/check-permission/?codename=moderation.punish
    Проверить есть ли у текущего пользователя конкретное разрешение
    """
    from .permissions import _user_has_permission
    codename = request.query_params.get('codename')
    if not codename:
        return Response(
            {'error': 'Укажи codename'},
            status=status.HTTP_400_BAD_REQUEST
        )

    has_perm = _user_has_permission(request.user, codename)
    level = get_user_level(request.user)

    return Response({
        'codename': codename,
        'has_permission': has_perm,
        'user_level': level,
    })

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def telegram_link(request):
    telegram_id = request.data.get('telegram_id')
    telegram_username = request.data.get('telegram_username') or ''

    if not telegram_id:
        return Response(
            {'error': 'telegram_id обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Ищем существующего пользователя
    try:
        user = User.objects.get(telegram_id=telegram_id)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        pass

    # Генерируем уникальный username
    if telegram_username:
        base_username = f'tg_{telegram_username}'
    else:
        base_username = f'tg_{telegram_id}'

    username = base_username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f'{base_username}_{counter}'
        counter += 1

    # Создаём пользователя
    import uuid as uuid_lib
    user = User(
        username=username,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        email=None,
    )
    user.set_password(str(uuid_lib.uuid4()))
    user.set_unusable_password()
    user.save()

    # Назначаем роль Участник
    try:
        from apps.users.models import Role, UserRole
        member_role = Role.objects.get(codename='member')
        UserRole.objects.create(user=user, role=member_role)
    except Role.DoesNotExist:
        pass

    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def telegram_get_user(request, telegram_id):
    """
    GET /api/auth/telegram/user/<telegram_id>/
    """
    try:
        user = User.objects.get(telegram_id=telegram_id)
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def steam_link(request):
    """
    POST /api/auth/steam/link/
    """
    telegram_id = request.data.get('telegram_id')
    steam_trade_url = request.data.get('steam_trade_url')

    if not telegram_id or not steam_trade_url:
        return Response(
            {'error': 'Укажи telegram_id и steam_trade_url'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    user.steam_trade_url = steam_trade_url
    user.save(update_fields=['steam_trade_url'])
    return Response({'message': 'Steam привязан'})

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def twitch_link(request):
    """
    POST /api/auth/twitch/link/
    Привязать Twitch через бота
    """
    telegram_id = request.data.get('telegram_id')
    twitch_username = request.data.get('twitch_username', '').strip()

    if not telegram_id or not twitch_username:
        return Response(
            {'error': 'Укажи telegram_id и twitch_username'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    user.twitch_username = twitch_username
    user.save(update_fields=['twitch_username'])

    return Response({'message': 'Twitch привязан'})