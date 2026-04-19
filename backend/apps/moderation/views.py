from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Punishment, Appeal, Ticket, TicketMessage, AuditLog
from .serializers import (
    PunishmentSerializer,
    PunishmentCreateSerializer,
    AppealSerializer,
    AppealCreateSerializer,
    TicketSerializer,
    TicketCreateSerializer,
    TicketMessageSerializer,
    AuditLogSerializer,
)
from apps.users.models import User
from apps.users.permissions import _user_has_permission, get_user_level


def get_ip(request):
    ip = request.META.get('HTTP_X_FORWARDED_FOR')
    if ip:
        return ip.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


# ─── Наказания ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def punish_user(request, user_id):
    """
    POST /api/moderation/users/<user_id>/punish/
    Выдать наказание пользователю
    """
    if not _user_has_permission(request.user, 'moderation.punish'):
        return Response(
            {'error': 'Нет права выдавать наказания'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Нельзя наказать пользователя с уровнем выше или равным своему
    if get_user_level(target) >= get_user_level(request.user):
        return Response(
            {'error': 'Нельзя наказать пользователя с равным или высшим уровнем'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = PunishmentCreateSerializer(data=request.data)
    if serializer.is_valid():
        punishment = serializer.save(
            user=target,
            issued_by=request.user
        )

        # Если бан — меняем статус пользователя
        if punishment.punishment_type == Punishment.Type.BAN:
            if punishment.platform in [
                Punishment.Platform.SITE,
                Punishment.Platform.ALL
            ]:
                target.status = User.Status.BANNED
                target.save(update_fields=['status'])

        # Пишем в журнал аудита
        AuditLog.log(
            actor=request.user,
            action=AuditLog.Action.PUNISHMENT_ISSUE,
            target_user=target,
            details={
                'type': punishment.punishment_type,
                'platform': punishment.platform,
                'reason': punishment.reason,
            },
            ip_address=get_ip(request)
        )

        return Response(
            PunishmentSerializer(punishment).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_punishment(request, punishment_id):
    """
    POST /api/moderation/punishments/<id>/revoke/
    Отменить наказание
    """
    if not _user_has_permission(request.user, 'moderation.revoke'):
        return Response(
            {'error': 'Нет права отменять наказания'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        punishment = Punishment.objects.get(id=punishment_id)
    except Punishment.DoesNotExist:
        return Response(
            {'error': 'Наказание не найдено'},
            status=status.HTTP_404_NOT_FOUND
        )

    if punishment.status != Punishment.Status.ACTIVE:
        return Response(
            {'error': 'Наказание уже неактивно'},
            status=status.HTTP_400_BAD_REQUEST
        )

    punishment.status = Punishment.Status.REVOKED
    punishment.revoked_by = request.user
    punishment.revoked_at = timezone.now()
    punishment.save()

    # Если был бан — снимаем блокировку
    if punishment.punishment_type == Punishment.Type.BAN:
        user = punishment.user
        if not user.punishments.filter(
            punishment_type=Punishment.Type.BAN,
            status=Punishment.Status.ACTIVE
        ).exists():
            user.status = User.Status.ACTIVE
            user.save(update_fields=['status'])

    AuditLog.log(
        actor=request.user,
        action=AuditLog.Action.PUNISHMENT_REVOKE,
        target_user=punishment.user,
        details={'punishment_id': str(punishment.id)},
        ip_address=get_ip(request)
    )

    return Response({
        'message': 'Наказание отменено',
        'punishment': PunishmentSerializer(punishment).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def punishment_list(request):
    """
    GET /api/moderation/punishments/
    Список наказаний — только для модераторов
    """
    if not _user_has_permission(request.user, 'moderation.view'):
        return Response(
            {'error': 'Нет доступа'},
            status=status.HTTP_403_FORBIDDEN
        )

    qs = Punishment.objects.select_related('user', 'issued_by')

    # Фильтры
    status_filter = request.query_params.get('status')
    type_filter   = request.query_params.get('type')
    user_filter   = request.query_params.get('user')

    if status_filter:
        qs = qs.filter(status=status_filter)
    if type_filter:
        qs = qs.filter(punishment_type=type_filter)
    if user_filter:
        qs = qs.filter(user__username__icontains=user_filter)

    serializer = PunishmentSerializer(qs[:50], many=True)
    return Response(serializer.data)


# ─── Апелляции ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_appeal(request, punishment_id):
    """
    POST /api/moderation/punishments/<id>/appeal/
    Подать апелляцию на наказание
    """
    try:
        punishment = Punishment.objects.get(
            id=punishment_id,
            user=request.user
        )
    except Punishment.DoesNotExist:
        return Response(
            {'error': 'Наказание не найдено'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Нельзя подать две апелляции на одно наказание
    if punishment.appeals.filter(
        status=Appeal.Status.PENDING
    ).exists():
        return Response(
            {'error': 'Апелляция уже подана и рассматривается'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = AppealCreateSerializer(data=request.data)
    if serializer.is_valid():
        appeal = serializer.save(
            punishment=punishment,
            user=request.user
        )
        return Response(
            AppealSerializer(appeal).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def appeal_list(request):
    """
    GET /api/moderation/appeals/
    Список апелляций — для модераторов
    """
    if not _user_has_permission(request.user, 'appeals.view'):
        return Response(
            {'error': 'Нет доступа'},
            status=status.HTTP_403_FORBIDDEN
        )

    qs = Appeal.objects.select_related('user', 'punishment', 'reviewed_by')

    status_filter = request.query_params.get('status', 'pending')
    if status_filter != 'all':
        qs = qs.filter(status=status_filter)

    serializer = AppealSerializer(qs[:50], many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_appeal(request, appeal_id):
    """
    POST /api/moderation/appeals/<id>/resolve/
    Рассмотреть апелляцию
    Body: { "decision": "approved/rejected/clarify", "response": "текст" }
    """
    if not _user_has_permission(request.user, 'appeals.resolve'):
        return Response(
            {'error': 'Нет права рассматривать апелляции'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        appeal = Appeal.objects.get(id=appeal_id)
    except Appeal.DoesNotExist:
        return Response(
            {'error': 'Апелляция не найдена'},
            status=status.HTTP_404_NOT_FOUND
        )

    if appeal.status != Appeal.Status.PENDING:
        return Response(
            {'error': 'Апелляция уже рассмотрена'},
            status=status.HTTP_400_BAD_REQUEST
        )

    decision = request.data.get('decision')
    response_text = request.data.get('response', '')

    valid_decisions = ['approved', 'rejected', 'clarify']
    if decision not in valid_decisions:
        return Response(
            {'error': f'Решение должно быть одним из: {valid_decisions}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    appeal.status = decision
    appeal.reviewed_by = request.user
    appeal.moderator_response = response_text
    appeal.resolved_at = timezone.now()
    appeal.save()

    # Если одобрена — отменяем наказание
    if decision == 'approved':
        punishment = appeal.punishment
        punishment.status = Punishment.Status.REVOKED
        punishment.revoked_by = request.user
        punishment.revoked_at = timezone.now()
        punishment.save()

    AuditLog.log(
        actor=request.user,
        action=AuditLog.Action.APPEAL_RESOLVE,
        target_user=appeal.user,
        details={
            'appeal_id': str(appeal.id),
            'decision': decision
        },
        ip_address=get_ip(request)
    )

    return Response({
        'message': f'Апелляция {decision}',
        'appeal': AppealSerializer(appeal).data
    })


# ─── Тикеты ───────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ticket_list_create(request):
    """
    GET  /api/moderation/tickets/ — мои тикеты
    POST /api/moderation/tickets/ — создать тикет
    """
    if request.method == 'GET':
        # Модераторы видят все тикеты
        if _user_has_permission(request.user, 'tickets.view'):
            qs = Ticket.objects.all()
            status_filter = request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter)
        else:
            # Обычный пользователь — только свои
            qs = Ticket.objects.filter(user=request.user)

        serializer = TicketSerializer(qs[:50], many=True)
        return Response(serializer.data)

    # POST — создать тикет
    serializer = TicketCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        ticket = serializer.save()
        return Response(
            TicketSerializer(ticket).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_detail(request, ticket_id):
    """
    GET /api/moderation/tickets/<id>/
    Детали тикета
    """
    try:
        if _user_has_permission(request.user, 'tickets.view'):
            ticket = Ticket.objects.get(id=ticket_id)
        else:
            ticket = Ticket.objects.get(id=ticket_id, user=request.user)
    except Ticket.DoesNotExist:
        return Response(
            {'error': 'Тикет не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = TicketSerializer(ticket)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_reply(request, ticket_id):
    """
    POST /api/moderation/tickets/<id>/reply/
    Ответить в тикете
    """
    try:
        if _user_has_permission(request.user, 'tickets.view'):
            ticket = Ticket.objects.get(id=ticket_id)
        else:
            ticket = Ticket.objects.get(id=ticket_id, user=request.user)
    except Ticket.DoesNotExist:
        return Response(
            {'error': 'Тикет не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if ticket.status == Ticket.Status.CLOSED:
        return Response(
            {'error': 'Тикет закрыт'},
            status=status.HTTP_400_BAD_REQUEST
        )

    text = request.data.get('text', '').strip()
    if not text:
        return Response(
            {'error': 'Текст не может быть пустым'},
            status=status.HTTP_400_BAD_REQUEST
        )

    is_staff = _user_has_permission(request.user, 'tickets.view')

    message = TicketMessage.objects.create(
        ticket=ticket,
        author=request.user,
        text=text,
        is_staff=is_staff
    )

    # Обновляем статус тикета
    if is_staff:
        ticket.status = Ticket.Status.WAITING
    else:
        ticket.status = Ticket.Status.IN_WORK
    ticket.save(update_fields=['status', 'updated_at'])

    return Response(
        TicketMessageSerializer(message).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_close(request, ticket_id):
    """
    POST /api/moderation/tickets/<id>/close/
    Закрыть тикет
    """
    try:
        if _user_has_permission(request.user, 'tickets.resolve'):
            ticket = Ticket.objects.get(id=ticket_id)
        else:
            ticket = Ticket.objects.get(id=ticket_id, user=request.user)
    except Ticket.DoesNotExist:
        return Response(
            {'error': 'Тикет не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    ticket.status = Ticket.Status.CLOSED
    ticket.closed_at = timezone.now()
    ticket.save()

    return Response({'message': 'Тикет закрыт'})


# ─── Журнал аудита ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_log_list(request):
    """
    GET /api/moderation/audit/
    Журнал аудита — только для Admin+
    """
    if not _user_has_permission(request.user, 'logs.view'):
        return Response(
            {'error': 'Нет доступа'},
            status=status.HTTP_403_FORBIDDEN
        )

    qs = AuditLog.objects.select_related('actor', 'target_user')

    action_filter = request.query_params.get('action')
    user_filter   = request.query_params.get('user')

    if action_filter:
        qs = qs.filter(action=action_filter)
    if user_filter:
        qs = qs.filter(actor__username__icontains=user_filter)

    serializer = AuditLogSerializer(qs[:100], many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_punishments(request):
    """
    GET /api/moderation/my/
    Наказания текущего пользователя
    """
    punishments = Punishment.objects.filter(
        user=request.user
    ).select_related('issued_by').order_by('-issued_at')

    data = [{
        'id': str(p.id),
        'punishment_type': p.punishment_type,
        'reason': p.reason,
        'platform': p.platform,
        'is_active': p.is_active,
        'status': p.status,
        'issued_at': p.issued_at.isoformat(),
        'expires_at': p.expires_at.isoformat() if p.expires_at else None,
        'moderator': p.issued_by.username if p.issued_by else None,
    } for p in punishments]

    return Response(data)