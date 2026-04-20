from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.authentication import BasicAuthentication
from .models import Permission, User, Role, UserRole
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UpdateProfileSerializer,
    RoleSerializer,
)
from .permissions import require_permission, require_level, get_user_level
from apps.moderation.models import AuditLog
 
 
def get_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')
 
 
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }
 
 
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Регистрация успешна'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        ip = get_ip(request)
        user.last_login_ip = ip
        user.save(update_fields=['last_login_ip'])
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Вход выполнен'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
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
    return Response(UserSerializer(request.user).data)
 
 
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_roles(request):
    roles = Role.objects.all().order_by('-level')
    return Response(RoleSerializer(roles, many=True).data)
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_role(request):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
 
    user_id = request.data.get('user_id')
    role_codename = request.data.get('role')
    expires_at = request.data.get('expires_at')
 
    if not user_id or not role_codename:
        return Response({'error': 'Укажи user_id и role'}, status=400)
 
    try:
        target_user = User.objects.get(id=user_id)
        role = Role.objects.get(codename=role_codename)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=404)
    except Role.DoesNotExist:
        return Response({'error': 'Роль не найдена'}, status=404)
 
    # Нельзя назначить роль выше или равную своей
    if role.level >= get_user_level(request.user):
        return Response({'error': 'Нельзя назначить роль выше или равную своей'}, status=403)
 
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
        user_role.assigned_by = request.user
        user_role.expires_at = expires_at
        user_role.save()
 
    AuditLog.log(
        actor=request.user,
        action=AuditLog.Action.ROLE_ASSIGN,
        target_user=target_user,
        details={'role': role_codename},
        ip_address=get_ip(request)
    )
 
    return Response({
        'message': f'Роль {role.name} назначена {target_user.username}',
        'user': UserSerializer(target_user).data
    })
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_role(request):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
 
    user_id = request.data.get('user_id')
    role_codename = request.data.get('role')
 
    if not user_id or not role_codename:
        return Response({'error': 'Укажи user_id и role'}, status=400)
 
    try:
        target_user = User.objects.get(id=user_id)
        role = Role.objects.get(codename=role_codename)
    except (User.DoesNotExist, Role.DoesNotExist):
        return Response({'error': 'Пользователь или роль не найдены'}, status=404)
 
    # Нельзя снять роль Owner
    if role.level >= 999:
        return Response({'error': 'Роль Owner нельзя снять'}, status=403)
 
    # Нельзя снять роль равную или выше своей
    if role.level >= get_user_level(request.user):
        return Response({'error': 'Нельзя снять роль выше или равную своей'}, status=403)
 
    # Нельзя снять роль с себя
    if target_user == request.user:
        return Response({'error': 'Нельзя снять роль с себя'}, status=403)
 
    UserRole.objects.filter(user=target_user, role=role).update(is_active=False)
 
    AuditLog.log(
        actor=request.user,
        action=AuditLog.Action.ROLE_REVOKE,
        target_user=target_user,
        details={'role': role_codename},
        ip_address=get_ip(request)
    )
 
    return Response({'message': f'Роль {role.name} снята с {target_user.username}'})
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permission(request):
    from .permissions import _user_has_permission
    codename = request.query_params.get('codename')
    if not codename:
        return Response({'error': 'Укажи codename'}, status=400)
    return Response({
        'codename': codename,
        'has_permission': _user_has_permission(request.user, codename),
        'user_level': get_user_level(request.user),
    })
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_role(request):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
 
    name = request.data.get('name', '').strip()
    codename = request.data.get('codename', '').strip()
    level = request.data.get('level', 0)
    color = request.data.get('color', '#FFFFFF')
    description = request.data.get('description', '')
 
    if not name or not codename:
        return Response({'error': 'Укажи name и codename'}, status=400)
 
    if Role.objects.filter(codename=codename).exists():
        return Response({'error': 'Роль с таким codename уже существует'}, status=400)
 
    if int(level) >= get_user_level(request.user):
        return Response({'error': 'Нельзя создать роль выше своей'}, status=403)
 
    role = Role.objects.create(
        name=name, codename=codename, level=level,
        color=color, description=description, is_system=False,
    )
 
    AuditLog.log(
        actor=request.user,
        action=AuditLog.Action.ROLE_CREATE,
        details={'role': codename},
        ip_address=get_ip(request)
    )
 
    return Response(RoleSerializer(role).data, status=201)
 
 
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_role(request, role_id):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
 
    try:
        role = Role.objects.get(id=role_id)
    except Role.DoesNotExist:
        return Response({'error': 'Роль не найдена'}, status=404)
 
    if role.is_system:
        # Системные роли — только цвет и описание
        if 'color' in request.data:
            role.color = request.data['color']
        if 'description' in request.data:
            role.description = request.data['description']
        if 'permissions' in request.data:
            perms = Permission.objects.filter(codename__in=request.data['permissions'])
            role.permissions.set(perms)
        role.save()
        return Response(RoleSerializer(role).data)
 
    if 'name' in request.data:
        role.name = request.data['name']
    if 'color' in request.data:
        role.color = request.data['color']
    if 'description' in request.data:
        role.description = request.data['description']
    if 'level' in request.data:
        new_level = int(request.data['level'])
        if new_level >= get_user_level(request.user):
            return Response({'error': 'Нельзя установить уровень выше своего'}, status=403)
        role.level = new_level
    if 'permissions' in request.data:
        perms = Permission.objects.filter(codename__in=request.data['permissions'])
        role.permissions.set(perms)
 
    role.save()
    return Response(RoleSerializer(role).data)
 
 
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_role(request, role_id):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
 
    try:
        role = Role.objects.get(id=role_id)
    except Role.DoesNotExist:
        return Response({'error': 'Роль не найдена'}, status=404)
 
    if role.is_system:
        return Response({'error': 'Нельзя удалить системную роль'}, status=403)
 
    if role.level >= get_user_level(request.user):
        return Response({'error': 'Нельзя удалить роль выше своей'}, status=403)
 
    AuditLog.log(
        actor=request.user,
        action=AuditLog.Action.ROLE_DELETE,
        details={'role': role.codename},
        ip_address=get_ip(request)
    )
 
    role.delete()
    return Response({'message': 'Роль удалена'})
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_permissions(request):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
    perms = Permission.objects.all().order_by('codename')
    return Response([{
        'codename': p.codename,
        'name': p.name,
        'description': p.description,
    } for p in perms])
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def role_assignments(request):
    if get_user_level(request.user) < 100:
        return Response({'error': 'Недостаточно прав'}, status=403)
 
    assignments = UserRole.objects.filter(
        is_active=True
    ).select_related('user', 'role', 'assigned_by').order_by('-assigned_at')
 
    return Response([{
        'id': a.id,
        'user_id': str(a.user.id),
        'username': a.user.username,
        'role_name': a.role.name,
        'role_codename': a.role.codename,
        'role_color': a.role.color,
        'assigned_by': a.assigned_by.username if a.assigned_by else 'SYSTEM',
        'assigned_at': a.assigned_at.isoformat(),
        'expires_at': a.expires_at.isoformat() if a.expires_at else None,
    } for a in assignments])
 
 
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def telegram_link(request):
    telegram_id = request.data.get('telegram_id')
    telegram_username = request.data.get('telegram_username') or ''
 
    if not telegram_id:
        return Response({'error': 'telegram_id обязателен'}, status=400)
 
    try:
        user = User.objects.get(telegram_id=telegram_id)
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        pass
 
    if telegram_username:
        base_username = f'tg_{telegram_username}'
    else:
        base_username = f'tg_{telegram_id}'
 
    username = base_username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f'{base_username}_{counter}'
        counter += 1
 
    import uuid as uuid_lib
    user = User(
        username=username,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        email=None,
    )
    user.set_unusable_password()
    user.save()
 
    try:
        member_role = Role.objects.get(codename='member')
        UserRole.objects.create(user=user, role=member_role)
    except Role.DoesNotExist:
        pass
 
    return Response(UserSerializer(user).data, status=201)
 
 
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def telegram_get_user(request, telegram_id):
    try:
        user = User.objects.get(telegram_id=telegram_id)
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=404)
 
 
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def steam_link(request):
    telegram_id = request.data.get('telegram_id')
    steam_trade_url = request.data.get('steam_trade_url')
 
    if not telegram_id or not steam_trade_url:
        return Response({'error': 'Укажи telegram_id и steam_trade_url'}, status=400)
 
    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=404)
 
    user.steam_trade_url = steam_trade_url
    user.save(update_fields=['steam_trade_url'])
    return Response({'message': 'Steam привязан'})
 
 
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def twitch_link(request):
    telegram_id = request.data.get('telegram_id')
    twitch_username = request.data.get('twitch_username', '').strip()
 
    if not telegram_id or not twitch_username:
        return Response({'error': 'Укажи telegram_id и twitch_username'}, status=400)
 
    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=404)
 
    user.twitch_username = twitch_username
    user.save(update_fields=['twitch_username'])
    return Response({'message': 'Twitch привязан'})
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    from .permissions import _user_has_permission
    if not _user_has_permission(request.user, 'users.view'):
        return Response({'error': 'Нет доступа'}, status=403)
 
    qs = User.objects.all().order_by('-created_at')
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
 
    return Response(UserSerializer(qs[:50], many=True).data)
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_link_token(request):
    import secrets
    token = secrets.token_hex(8).upper()
    request.user.link_token = token
    request.user.save()
    return Response({'token': token})
 
 
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def link_by_token(request):
    token = request.data.get('token', '').upper().strip()
    telegram_id = request.data.get('telegram_id')
    telegram_username = request.data.get('telegram_username', '')
 
    if not token or not telegram_id:
        return Response({'error': 'token и telegram_id обязательны'}, status=400)
 
    try:
        user = User.objects.get(link_token=token)
    except User.DoesNotExist:
        return Response({'error': 'Неверный код. Попробуй ещё раз.'}, status=404)
 
    existing = User.objects.filter(telegram_id=telegram_id).exclude(pk=user.pk).first()
    if existing:
        if existing.username.startswith('tg_'):
            existing.delete()
        else:
            return Response({'error': 'Этот Telegram уже привязан к другому аккаунту'}, status=400)
 
    user.telegram_id = telegram_id
    user.telegram_username = telegram_username
    user.link_token = None
    user.save()
    return Response({'message': 'Telegram привязан', 'username': user.username})
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlink_account(request):
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
 
    return Response({'error': 'Укажи platform: twitch, steam или telegram'}, status=400)
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
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
 
    total_participations = Participant.objects.filter(user=user).count()
    wins = Winner.objects.filter(
        user=user, status__in=[Winner.Status.CONFIRMED, Winner.Status.PENDING]
    ).count()
    violations_qs = Punishment.objects.filter(user=user).select_related('issued_by').order_by('-issued_at')
    active_violations = Punishment.objects.filter(user=user, status=Punishment.Status.ACTIVE).count()
    prizes_qs = Prize.objects.filter(recipient=user).select_related('winner__giveaway').order_by('-created_at')[:20]
    participations_qs = Participant.objects.filter(user=user).select_related('giveaway').order_by('-joined_at')[:20]
 
    return Response({
        'user': UserSerializer(user).data,
        'stats': {
            'total_participations': total_participations,
            'wins': wins,
            'active_violations': active_violations,
            'total_violations': violations_qs.count(),
        },
        'violations': [{
            'id': str(v.id),
            'punishment_type': v.punishment_type,
            'reason': v.reason,
            'platform': v.platform,
            'is_active': v.is_active,
            'created_at': v.issued_at.isoformat(),
            'expires_at': v.expires_at.isoformat() if v.expires_at else None,
            'moderator': v.issued_by.username if v.issued_by else None,
        } for v in violations_qs[:20]],
        'prizes': [{
            'id': str(p.id),
            'name': p.name,
            'status': p.status,
            'giveaway_title': p.winner.giveaway.title if p.winner and p.winner.giveaway else None,
            'platform': p.winner.giveaway.platform if p.winner and p.winner.giveaway else None,
            'created_at': p.created_at.isoformat(),
        } for p in prizes_qs],
        'participations': [{
            'id': str(p.id),
            'giveaway_title': p.giveaway.title,
            'giveaway_platform': p.giveaway.platform,
            'participants_count': p.giveaway.participants_count,
            'joined_at': p.joined_at.isoformat(),
        } for p in participations_qs],
    })
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    from .permissions import _user_has_permission
    if not _user_has_permission(request.user, 'users.view'):
        return Response({'error': 'Нет доступа'}, status=403)
 
    from django.utils import timezone
    from apps.moderation.models import Ticket, Punishment
    from apps.prizes.models import Prize
 
    today = timezone.now().date()
    today_start = timezone.make_aware(
        timezone.datetime.combine(today, timezone.datetime.min.time())
    )
 
    new_users_today = User.objects.filter(created_at__gte=today_start).count()
    prizes_today = Prize.objects.filter(created_at__gte=today_start).count()
    open_tickets = Ticket.objects.filter(status__in=['open', 'in_work']).count()
    recent_logs = AuditLog.objects.select_related('actor', 'target_user').order_by('-created_at')[:10]
 
    return Response({
        'new_users_today': new_users_today,
        'prizes_today': prizes_today,
        'open_tickets': open_tickets,
        'recent_logs': [{
            'id': str(log.id),
            'actor': log.actor.username if log.actor else '—',
            'action': log.get_action_display(),
            'action_code': log.action,
            'target_user': log.target_user.username if log.target_user else None,
            'created_at': log.created_at.isoformat(),
        } for log in recent_logs],
    })