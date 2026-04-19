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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """
    GET /api/users/
    Список пользователей — только для модераторов+
    """
    from .permissions import _user_has_permission
    if not _user_has_permission(request.user, 'users.view'):
        return Response(
            {'error': 'Нет доступа'},
            status=status.HTTP_403_FORBIDDEN
        )

    qs = User.objects.all().order_by('-created_at')

    # Фильтры
    search = request.query_params.get('search')
    status_filter = request.query_params.get('status')

    if search:
        from django.db.models import Q
        qs = qs.filter(
            Q(username__icontains=search) |
            Q(telegram_username__icontains=search) |
            Q(twitch_username__icontains=search) |
            Q(email__icontains=search)
        )
    if status_filter:
        qs = qs.filter(status=status_filter)

    serializer = UserSerializer(qs[:50], many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_link_token(request):
    """Генерирует токен для привязки Telegram"""
    import secrets
    token = secrets.token_hex(8).upper()
    request.user.link_token = token
    request.user.save()
    return Response({'token': token})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def link_by_token(request):
    """Привязывает Telegram аккаунт по токену — вызывается ботом"""
    token = request.data.get('token', '').upper().strip()
    telegram_id = request.data.get('telegram_id')
    telegram_username = request.data.get('telegram_username', '')

    if not token or not telegram_id:
        return Response({'error': 'token и telegram_id обязательны'}, status=400)

    try:
        from apps.users.models import User
        user = User.objects.get(link_token=token)
    except User.DoesNotExist:
        return Response({'error': 'Неверный код. Попробуй ещё раз.'}, status=404)

    # Проверим что этот telegram_id не занят другим аккаунтом
    existing = User.objects.filter(telegram_id=telegram_id).exclude(pk=user.pk).first()
    if existing:
        if existing.username.startswith('tg_'):
            existing.delete()
        else:
            return Response({'error': 'Этот Telegram уже привязан к другому аккаунту'}, status=400)

    user.telegram_id = telegram_id
    user.telegram_username = telegram_username
    user.link_token = None  # сбрасываем токен после использования
    user.save()

    return Response({'message': 'Telegram привязан', 'username': user.username})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlink_account(request):
    """
    POST /api/auth/unlink/
    Отвязать аккаунт: platform = 'twitch' | 'steam'
    """
    platform = request.data.get('platform')
    user = request.user

    if platform == 'twitch':
        user.twitch_id = None
        user.twitch_username = None
        user.save()
        return Response({'message': 'Twitch отвязан'})

    if platform == 'steam':
        user.steam_id = None
        user.steam_trade_url = None
        user.save()
        return Response({'message': 'Steam отвязан'})
    
    if platform == 'telegram':
        user.telegram_id = None
        user.telegram_username = None
        user.save()
        return Response({'message': 'Telegram отвязан'})

    return Response({'error': 'Укажи platform: twitch или steam'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/auth/change-password/
    """
    old_password = request.data.get('old_password', '')
    new_password = request.data.get('new_password', '')

    if not request.user.check_password(old_password):
        return Response({'error': 'Неверный текущий пароль'}, status=400)

    if len(new_password) < 8:
        return Response({'error': 'Минимум 8 символов'}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    return Response({'message': 'Пароль изменён'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id):
    """
    GET /api/auth/users/<uuid>/
    Детальные данные пользователя для админки
    """
    from .permissions import _user_has_permission
    from apps.giveaways.models import Participant, Winner
    from apps.moderation.models import Punishment
    from apps.prizes.models import Prize

    if not _user_has_permission(request.user, 'users.view'):
        return Response({'error': 'Нет доступа'}, status=403)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Не найден'}, status=404)

    # Статистика
    total_participations = Participant.objects.filter(user=user).count()
    wins = Winner.objects.filter(
        user=user,
        status__in=[Winner.Status.CONFIRMED, Winner.Status.PENDING]
    ).count()

    # Нарушения — is_active это @property, фильтруем по status
    violations_qs = Punishment.objects.filter(
        user=user
    ).select_related('issued_by').order_by('-issued_at')

    active_violations = Punishment.objects.filter(
        user=user,
        status=Punishment.Status.ACTIVE
    ).count()

    # Призы
    prizes_qs = Prize.objects.filter(
        recipient=user
    ).select_related('winner__giveaway').order_by('-created_at')[:20]

    # Участия
    participations_qs = Participant.objects.filter(
        user=user
    ).select_related('giveaway').order_by('-joined_at')[:20]

    return Response({
        'user': UserSerializer(user).data,
        'stats': {
            'total_participations': total_participations,
            'wins': wins,
            'active_violations': active_violations,
            'total_violations': violations_qs.count(),
        },
        'violations': [
            {
                'id': str(v.id),
                'punishment_type': v.punishment_type,
                'reason': v.reason,
                'platform': v.platform,
                'is_active': v.is_active,
                'created_at': v.issued_at.isoformat(),
                'expires_at': v.expires_at.isoformat() if v.expires_at else None,
                'moderator': v.issued_by.username if v.issued_by else None,
            }
            for v in violations_qs[:20]
        ],
        'prizes': [
            {
                'id': str(p.id),
                'name': p.name,
                'status': p.status,
                'giveaway_title': (
                    p.winner.giveaway.title
                    if p.winner and p.winner.giveaway else None
                ),
                'platform': (
                    p.winner.giveaway.platform
                    if p.winner and p.winner.giveaway else None
                ),
                'created_at': p.created_at.isoformat(),
            }
            for p in prizes_qs
        ],
        'participations': [
            {
                'id': str(p.id),
                'giveaway_title': p.giveaway.title,
                'giveaway_platform': p.giveaway.platform,
                'participants_count': p.giveaway.participants_count,
                'joined_at': p.joined_at.isoformat(),
            }
            for p in participations_qs
        ],
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """
    GET /api/auth/admin-stats/
    Статистика для админ-дашборда
    """
    from .permissions import _user_has_permission
    if not _user_has_permission(request.user, 'users.view'):
        return Response({'error': 'Нет доступа'}, status=403)

    from django.utils import timezone
    from datetime import timedelta
    from apps.giveaways.models import Winner
    from apps.moderation.models import Ticket, Punishment, AuditLog
    from apps.prizes.models import Prize

    today = timezone.now().date()
    today_start = timezone.make_aware(
        timezone.datetime.combine(today, timezone.datetime.min.time())
    )

    new_users_today = User.objects.filter(
        created_at__gte=today_start
    ).count()

    prizes_today = Prize.objects.filter(
        created_at__gte=today_start
    ).count()

    open_tickets = Ticket.objects.filter(
        status__in=['open', 'in_work']
    ).count()

    recent_logs = AuditLog.objects.select_related(
        'actor', 'target_user'
    ).order_by('-created_at')[:10]

    logs_data = [{
        'id': str(log.id),
        'actor': log.actor.username if log.actor else '—',
        'action': log.get_action_display(),
        'action_code': log.action,
        'target_user': log.target_user.username if log.target_user else None,
        'created_at': log.created_at.isoformat(),
    } for log in recent_logs]

    return Response({
        'new_users_today': new_users_today,
        'prizes_today': prizes_today,
        'open_tickets': open_tickets,
        'recent_logs': logs_data,
    })