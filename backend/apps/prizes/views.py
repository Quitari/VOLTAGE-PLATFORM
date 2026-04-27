from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Prize
from apps.users.permissions import _user_has_permission

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def my_prizes(request, telegram_id):
    """
    GET /api/prizes/my/<telegram_id>/
    Призы пользователя по Telegram ID — только для внутренних ботов
    """
    from django.conf import settings as django_settings
    secret = request.headers.get('X-Internal-Secret', '')
    if secret != django_settings.INTERNAL_API_SECRET or not secret:
        return Response({'error': 'Unauthorized'}, status=401)
    from apps.users.models import User
    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response([])

    prizes = Prize.objects.filter(
        recipient=user
    ).select_related('winner__giveaway').order_by('-created_at')

    data = []
    for prize in prizes[:10]:
        data.append({
            'id': str(prize.id),
            'name': prize.name,
            'status': prize.status,
            'delivery_method': prize.delivery_method,
            'created_at': prize.created_at.isoformat(),
            'sent_at': prize.sent_at.isoformat() if prize.sent_at else None,
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prize_list(request):
    if not _user_has_permission(request.user, 'prizes.view'):
        return Response({'error': 'Нет доступа'}, status=403)

    prizes = Prize.objects.select_related(
        'recipient', 'winner__giveaway'
    ).order_by('-created_at')[:50]

    data = []
    for p in prizes:
        data.append({
            'id': str(p.id),
            'name': p.name,
            'status': p.status,
            'delivery_method': p.delivery_method,
            'steam_trade_url': p.steam_trade_url,
            'recipient': {
                'username': p.recipient.username if p.recipient else None
            },
            'giveaway_title': p.winner.giveaway.title if p.winner and p.winner.giveaway else None,
            'created_at': p.created_at.isoformat(),
            'sent_at': p.sent_at.isoformat() if p.sent_at else None,
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_prizes_auth(request):
    """
    GET /api/prizes/my/
    Призы текущего авторизованного пользователя
    """
    prizes = Prize.objects.filter(
        recipient=request.user
    ).select_related('winner__giveaway').order_by('-created_at')

    data = [{
        'id': str(p.id),
        'name': p.name,
        'status': p.status,
        'delivery_method': p.delivery_method,
        'created_at': p.created_at.isoformat(),
        'sent_at': p.sent_at.isoformat() if p.sent_at else None,
        'skin_image_url': p.winner.giveaway.skin_image_url if p.winner and p.winner.giveaway else None,
    } for p in prizes[:20]]

    return Response(data)