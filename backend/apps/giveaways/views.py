import random
import os
from django.conf import settings as django_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.prizes.models import Prize as PrizeModel
from .models import Giveaway, Participant, Winner
from .serializers import (
    GiveawayListSerializer,
    GiveawayDetailSerializer,
    GiveawayCreateSerializer,
    ParticipantSerializer,
    WinnerSerializer,
)
from apps.users.permissions import (
    require_permission,
    get_user_level,
    _user_has_permission,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def giveaway_list(request):
    """
    GET /api/giveaways/
    Список розыгрышей. Публичный эндпоинт.
    """
    status_filter = request.query_params.get('status', 'active')
    platform = request.query_params.get('platform')

    qs = Giveaway.objects.all()

    if status_filter != 'all':
        qs = qs.filter(status=status_filter)

    if platform:
        qs = qs.filter(platform=platform)

    serializer = GiveawayListSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def giveaway_create(request):
    """
    POST /api/giveaways/
    Создать розыгрыш. Нужно право giveaways.create
    """
    if not _user_has_permission(request.user, 'giveaways.create'):
        return Response(
            {'error': 'Нет права создавать розыгрыши'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = GiveawayCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        giveaway = serializer.save()
        return Response(
            GiveawayDetailSerializer(giveaway).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def giveaway_detail(request, pk):
    """
    GET /api/giveaways/<id>/
    Детали розыгрыша
    """
    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = GiveawayDetailSerializer(giveaway)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def giveaway_update(request, pk):
    """
    PATCH /api/giveaways/<id>/
    Редактировать розыгрыш
    """
    if not _user_has_permission(request.user, 'giveaways.edit'):
        return Response(
            {'error': 'Нет права редактировать розыгрыши'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if giveaway.status == Giveaway.Status.FINISHED:
        return Response(
            {'error': 'Нельзя редактировать завершённый розыгрыш'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = GiveawayCreateSerializer(
        giveaway,
        data=request.data,
        partial=True,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response(GiveawayDetailSerializer(giveaway).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def giveaway_activate(request, pk):
    """
    POST /api/giveaways/<id>/activate/
    Запустить розыгрыш (из черновика → активный)
    """
    if not _user_has_permission(request.user, 'giveaways.edit'):
        return Response(
            {'error': 'Нет права'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if giveaway.status != Giveaway.Status.DRAFT:
        return Response(
            {'error': 'Можно запустить только черновик'},
            status=status.HTTP_400_BAD_REQUEST
        )

    giveaway.status = Giveaway.Status.ACTIVE
    giveaway.starts_at = timezone.now()
    giveaway.save()

    return Response({
        'message': 'Розыгрыш запущен',
        'giveaway': GiveawayDetailSerializer(giveaway).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def giveaway_join(request, pk):
    """
    POST /api/giveaways/<id>/join/
    Участвовать в розыгрыше
    """
    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not giveaway.can_participate:
        return Response(
            {'error': 'Розыгрыш недоступен для участия'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Проверяем что Steam привязан если нужен скин
    if giveaway.prize_type == Giveaway.PrizeType.SKIN:
        if not request.user.has_steam:
            return Response(
                {'error': 'Привяжи Steam аккаунт и трейд-ссылку'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Проверяем что не участвует уже
    if Participant.objects.filter(
        giveaway=giveaway,
        user=request.user
    ).exists():
        return Response(
            {'error': 'Ты уже участвуешь в этом розыгрыше'},
            status=status.HTTP_400_BAD_REQUEST
        )

    participant = Participant.objects.create(
        giveaway=giveaway,
        user=request.user,
        source=Participant.Source.TELEGRAM
    )

    return Response({
        'message': 'Ты в розыгрыше!',
        'participants_count': giveaway.participants_count
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def giveaway_draw(request, pk):
    """
    POST /api/giveaways/<id>/draw/
    Подвести итоги — выбрать победителя
    """
    if not _user_has_permission(request.user, 'giveaways.draw'):
        return Response(
            {'error': 'Нет права подводить итоги'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if giveaway.status != Giveaway.Status.ACTIVE:
        return Response(
            {'error': 'Можно подвести итоги только активного розыгрыша'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Получаем участников которые ещё не были победителями
    already_won = giveaway.winners.values_list('user_id', flat=True)
    eligible = giveaway.participants.filter(
        is_active=True
    ).exclude(
        user_id__in=already_won
    )

    if not eligible.exists():
        return Response(
            {'error': 'Нет доступных участников'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Случайный выбор
    winner_participant = random.choice(list(eligible))

    # Создаём запись победителя
    winner = Winner.objects.create(
        giveaway=giveaway,
        user=winner_participant.user,
        status=Winner.Status.PENDING
    )

    giveaway.status = Giveaway.Status.DRAWING
    giveaway.save()

    return Response({
        'message': f'Победитель выбран: {winner_participant.user.username}',
        'winner': WinnerSerializer(winner).data,
        'total_participants': giveaway.participants_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def giveaway_reroll(request, pk):
    """
    POST /api/giveaways/<id>/reroll/
    Перевыбор — если победитель не ответил или не прошёл проверку
    """
    if not _user_has_permission(request.user, 'giveaways.draw'):
        return Response(
            {'error': 'Нет права'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    reason = request.data.get('reason', 'Не ответил за отведённое время')

    # Помечаем текущего победителя как rerolled
    current_winner = giveaway.winners.filter(
        status=Winner.Status.PENDING
    ).last()

    if current_winner:
        current_winner.status = Winner.Status.REROLLED
        current_winner.reroll_reason = reason
        current_winner.save()

    # Выбираем нового — исключаем всех предыдущих победителей
    already_won = giveaway.winners.values_list('user_id', flat=True)
    eligible = giveaway.participants.filter(
        is_active=True
    ).exclude(
        user_id__in=already_won
    )

    if not eligible.exists():
        return Response(
            {'error': 'Все участники исчерпаны. Выберите победителя вручную или отмените розыгрыш.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    new_winner_participant = random.choice(list(eligible))
    new_winner = Winner.objects.create(
        giveaway=giveaway,
        user=new_winner_participant.user,
        status=Winner.Status.PENDING,
        reroll_count=(current_winner.reroll_count + 1) if current_winner else 1
    )

    return Response({
        'message': f'Новый победитель: {new_winner_participant.user.username}',
        'winner': WinnerSerializer(new_winner).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_winner(request, pk):
    """
    POST /api/giveaways/<id>/confirm-winner/
    Подтвердить победителя (он на стриме, приз отправляем)
    """
    if not _user_has_permission(request.user, 'giveaways.draw'):
        return Response(
            {'error': 'Нет права'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    winner = giveaway.winners.filter(
        status=Winner.Status.PENDING
    ).last()

    if not winner:
        return Response(
            {'error': 'Нет победителя для подтверждения'},
            status=status.HTTP_400_BAD_REQUEST
        )

    winner.status = Winner.Status.CONFIRMED
    winner.confirmed_at = timezone.now()
    winner.twitch_verified = True
    winner.save()

    giveaway.status = Giveaway.Status.FINISHED
    giveaway.save()

    delivery = PrizeModel.DeliveryMethod.LISSKINS if giveaway.prize_type == Giveaway.PrizeType.SKIN else PrizeModel.DeliveryMethod.MANUAL

    prize = PrizeModel.objects.create(
        winner=winner,
        recipient=winner.user,
        name=giveaway.title,
        steam_trade_url=winner.user.steam_trade_url or '',
        delivery_method=delivery
    )

    return Response({
        'message': f'Победитель подтверждён. Приз создан.',
        'winner': WinnerSerializer(winner).data,
        'prize_id': str(prize.id)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def giveaway_participants(request, pk):
    """
    GET /api/giveaways/<id>/participants/
    Список участников
    """
    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    participants = giveaway.participants.filter(
        is_active=True
    ).select_related('user')

    serializer = ParticipantSerializer(participants, many=True)
    return Response({
        'count': participants.count(),
        'participants': serializer.data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def join_giveaway_telegram(request, pk):
    """
    POST /api/giveaways/<id>/join/telegram/
    Участие через Telegram бота по telegram_id
    """
    secret = request.headers.get('X-Internal-Secret', '')
    if secret != django_settings.INTERNAL_API_SECRET or not secret:
        return Response({'error': 'Unauthorized'}, status=401)

    telegram_id = request.data.get('telegram_id')

    if not telegram_id:
        return Response(
            {'error': 'telegram_id обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        from apps.users.models import User
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден. Напиши /start боту'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not giveaway.can_participate:
        return Response(
            {'error': 'Розыгрыш недоступен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if giveaway.prize_type == Giveaway.PrizeType.SKIN:
        if not user.has_steam:
            return Response(
                {'error': 'Привяжи Steam аккаунт и трейд-ссылку'},
                status=status.HTTP_400_BAD_REQUEST
            )

    if Participant.objects.filter(giveaway=giveaway, user=user).exists():
        return Response(
            {'error': 'Ты уже участвуешь в этом розыгрыше'},
            status=status.HTTP_400_BAD_REQUEST
        )

    Participant.objects.create(
        giveaway=giveaway,
        user=user,
        source=Participant.Source.TELEGRAM
    )

    return Response({
        'message': 'Ты в розыгрыше!',
        'participants_count': giveaway.participants_count
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def join_giveaway_twitch(request, pk):
    """
    POST /api/giveaways/<id>/join/twitch/
    Участие через Twitch бота по twitch_username
    """
    secret = request.headers.get('X-Internal-Secret', '')
    if secret != django_settings.INTERNAL_API_SECRET or not secret:
        return Response({'error': 'Unauthorized'}, status=401)
    twitch_username = request.data.get('twitch_username')
    if not twitch_username:
        return Response(
            {'error': 'twitch_username обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        from apps.users.models import User
        user = User.objects.filter(
            twitch_username__iexact=twitch_username
        ).first()
        if not user:
            return Response(
                {'error': 'Привяжи Twitch в боте или на сайте'},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception:
        return Response(
            {'error': 'Ошибка поиска пользователя'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    try:
        giveaway = Giveaway.objects.get(id=pk)
    except Giveaway.DoesNotExist:
        return Response(
            {'error': 'Розыгрыш не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not giveaway.can_participate:
        return Response(
            {'error': 'Розыгрыш недоступен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Participant.objects.filter(giveaway=giveaway, user=user).exists():
        return Response(
            {'error': 'Ты уже участвуешь в этом розыгрыше'},
            status=status.HTTP_400_BAD_REQUEST
        )

    Participant.objects.create(
        giveaway=giveaway,
        user=user,
        source=Participant.Source.TWITCH
    )

    return Response({
        'message': 'Участие зарегистрировано',
        'participants_count': giveaway.participants_count
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_stats(request):
    """
    GET /api/giveaways/my-stats/
    Статистика текущего пользователя
    """
    user = request.user
    total = Participant.objects.filter(user=user).count()
    wins = Winner.objects.filter(user=user, status__in=['confirmed', 'pending']).count()
    active = Participant.objects.filter(user=user, giveaway__status='active').count()
    from apps.moderation.models import Punishment
    violations = Punishment.objects.filter(user=user, status='active').count()
    return Response({
        'total_participations': total,
        'wins': wins,
        'active_giveaways': active,
        'violations': violations,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_giveaway_image(request):
    """
    POST /api/giveaways/upload-image/
    Загрузка фото приза
    """
    if not _user_has_permission(request.user, 'giveaways.create'):
        return Response({'error': 'Нет доступа'}, status=403)

    image = request.FILES.get('image')
    if not image:
        return Response({'error': 'Файл не передан'}, status=400)

    if image.size > 5 * 1024 * 1024:
        return Response({'error': 'Файл не должен превышать 5 MB'}, status=400)

    upload_dir = os.path.join(django_settings.MEDIA_ROOT, 'giveaways')
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(image.name)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
        return Response({'error': 'Только JPG, PNG, WEBP'}, status=400)

    import uuid
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, 'wb+') as f:
        for chunk in image.chunks():
            f.write(chunk)

    url = f"{django_settings.MEDIA_URL}giveaways/{filename}"
    return Response({'url': url})