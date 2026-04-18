from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import BotSettings, TwitchCommand, ViewerStats

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
        # Публичные настройки сайта
        'streamer_name': settings.streamer_name,
        'streamer_description': settings.streamer_description,
        'streamer_avatar_url': settings.streamer_avatar_url,
        'streamer_avatar_file': request.build_absolute_uri(settings.streamer_avatar_file.url) if settings.streamer_avatar_file else None,
        'twitch_url': settings.twitch_url,
        'telegram_url': settings.telegram_url,
        'vk_url': settings.vk_url,
        'youtube_url': settings.youtube_url,
        'show_giveaways': settings.show_giveaways,
        'show_winners': settings.show_winners,
        'show_schedule': settings.show_schedule,
        'show_moments': settings.show_moments,
        'show_rules': settings.show_rules,
        'schedule': settings.schedule,
        'streamer_avatar_position': settings.streamer_avatar_position,
        'streamer_features': settings.streamer_features,
        'rules_chat': settings.rules_chat,
        'rules_giveaway': settings.rules_giveaway,
        'rules_punishments': settings.rules_punishments,
        'rules_appeals_text': settings.rules_appeals_text,
        'show_schedule_page': settings.show_schedule_page,
        'show_status_page': settings.show_status_page,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def bot_settings_update(request):
    settings = BotSettings.get()
    allowed = [
        'welcome_new', 'welcome_back', 'giveaway_post_template',
        'join_button_text', 'channel_id', 'channel_username', 'chat_id',
        'streamer_name', 'streamer_description', 'streamer_avatar_url',
        'streamer_avatar_file',
        'twitch_url', 'telegram_url', 'vk_url', 'youtube_url',
        'show_giveaways', 'show_winners', 'show_schedule',
        'show_moments', 'show_rules', 'schedule',
        'streamer_avatar_position',
        'streamer_features',
        'rules_chat',
        'rules_giveaway',
        'rules_punishments',
        'rules_appeals_text',
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

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def twitch_stats_update(request):
    """
    POST /api/bots/twitch/stats/
    Обновление статистики зрителя от Twitch бота
    """
    twitch_id = request.data.get('twitch_id')
    twitch_login = request.data.get('twitch_login')
    channel_id = request.data.get('channel_id')
    messages = request.data.get('messages', 0)
    watch_minutes = request.data.get('watch_minutes', 0)

    if not twitch_id or not channel_id:
        return Response({'error': 'twitch_id и channel_id обязательны'}, status=400)

    stats, _ = ViewerStats.objects.get_or_create(
        twitch_id=twitch_id,
        channel_id=channel_id,
        defaults={'twitch_login': twitch_login or twitch_id}
    )
    stats.twitch_login = twitch_login or stats.twitch_login
    stats.messages_count += messages
    stats.watch_time_minutes += watch_minutes
    stats.save()

    return Response({
        'watch_time_minutes': stats.watch_time_minutes,
        'messages_count': stats.messages_count,
    })


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def twitch_stats_get(request, twitch_login):
    """
    GET /api/bots/twitch/stats/<login>/
    Получить статистику зрителя
    """
    channel_id = request.query_params.get('channel_id', '')
    try:
        stats = ViewerStats.objects.get(
            twitch_login__iexact=twitch_login,
            channel_id=channel_id
        )
        hours = stats.watch_time_minutes // 60
        minutes = stats.watch_time_minutes % 60
        return Response({
            'login': stats.twitch_login,
            'watch_time_minutes': stats.watch_time_minutes,
            'watch_time_formatted': f'{hours}h {minutes}m' if hours else f'{minutes}m',
            'messages_count': stats.messages_count,
        })
    except ViewerStats.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'settings.edit'):
        return Response({'error': 'Нет доступа'}, status=403)

    file = request.FILES.get('avatar')
    if not file:
        return Response({'error': 'Файл не передан'}, status=400)

    allowed = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed:
        return Response({'error': 'Разрешены только JPG, PNG, WEBP'}, status=400)

    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'Файл не должен превышать 5 MB'}, status=400)

    s = BotSettings.get()
    if s.streamer_avatar_url:
        return Response(
            {'error': 'Удали URL аватара перед загрузкой файла'},
            status=400
        )

    s.streamer_avatar_file = file
    s.save()

    return Response({
        'url': s.streamer_avatar_file.url  # только /media/avatars/filename.jpg
    })