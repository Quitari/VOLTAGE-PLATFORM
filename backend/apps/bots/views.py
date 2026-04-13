from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import BotSettings

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def bot_settings(request):
    settings = BotSettings.get()
    return Response({
        'welcome_new': settings.welcome_new,
        'welcome_back': settings.welcome_back,
        'giveaway_post_template': settings.giveaway_post_template,
        'join_button_text': settings.join_button_text,
        'channel_id': settings.channel_id,
        'channel_username': settings.channel_username,
        'chat_id': settings.chat_id,
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def bot_settings_update(request):
    settings = BotSettings.get()
    allowed = [
        'welcome_new', 'welcome_back', 'giveaway_post_template',
        'join_button_text', 'channel_id', 'channel_username', 'chat_id'
    ]
    for field in allowed:
        if field in request.data:
            setattr(settings, field, request.data[field])
    settings.save()
    return Response({'message': 'Сохранено'})