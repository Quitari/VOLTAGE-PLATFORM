from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Prize


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def my_prizes(request, telegram_id):
    """
    GET /api/prizes/my/<telegram_id>/
    Призы пользователя по Telegram ID
    """
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