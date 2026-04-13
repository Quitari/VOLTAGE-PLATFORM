from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import BotSettings, TwitchCommand


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def twitch_commands_list(request):
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'commands.manage'):
        return Response({'error': 'Нет доступа'}, status=403)
    commands = TwitchCommand.objects.all()
    data = [{
        'id': c.id,
        'name': c.name,
        'response': c.response,
        'is_active': c.is_active,
        'cooldown': c.cooldown,
        'updated_at': c.updated_at.isoformat(),
    } for c in commands]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def twitch_command_create(request):
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'commands.manage'):
        return Response({'error': 'Нет доступа'}, status=403)
    name = request.data.get('name', '').strip().lstrip('!')
    response_text = request.data.get('response', '').strip()
    cooldown = request.data.get('cooldown', 5)
    if not name or not response_text:
        return Response({'error': 'Укажи название и ответ'}, status=400)
    if TwitchCommand.objects.filter(name=name).exists():
        return Response({'error': 'Команда уже существует'}, status=400)
    cmd = TwitchCommand.objects.create(
        name=name,
        response=response_text,
        cooldown=cooldown
    )
    return Response({'id': cmd.id, 'name': cmd.name, 'message': 'Создана'}, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def twitch_command_detail(request, cmd_id):
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'commands.manage'):
        return Response({'error': 'Нет доступа'}, status=403)
    try:
        cmd = TwitchCommand.objects.get(id=cmd_id)
    except TwitchCommand.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)
    if request.method == 'DELETE':
        cmd.delete()
        return Response({'message': 'Удалена'})
    for field in ['name', 'response', 'cooldown', 'is_active']:
        if field in request.data:
            setattr(cmd, field, request.data[field])
    cmd.save()
    return Response({'message': 'Обновлена'})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def twitch_commands_public(request):
    commands = TwitchCommand.objects.filter(is_active=True)
    data = [{
        'name': c.name,
        'response': c.response,
        'cooldown': c.cooldown,
    } for c in commands]
    return Response(data)