from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Clip


@api_view(['GET'])
@permission_classes([AllowAny])
def clips_public(request):
    """Публичный список одобренных клипов"""
    clips = Clip.objects.filter(status='approved')
    game = request.query_params.get('game')
    if game:
        clips = clips.filter(game__icontains=game)
    data = [{
        'id': str(c.id),
        'title': c.title,
        'url': c.url,
        'game': c.game,
        'preview_url': c.preview_url,
        'created_at': c.created_at.isoformat(),
        'submitted_by': c.submitted_by.username if c.submitted_by else None,
    } for c in clips]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clip_submit(request):
    """Пользователь предлагает клип"""
    url = request.data.get('url', '').strip()
    title = request.data.get('title', '').strip()
    game = request.data.get('game', '').strip()

    if not url or not title:
        return Response({'error': 'Укажи ссылку и название'}, status=400)

    clip = Clip.objects.create(
        url=url,
        title=title,
        game=game,
        submitted_by=request.user,
        status='pending',
    )
    return Response({'id': str(clip.id), 'message': 'Клип отправлен на модерацию'}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clips_admin_list(request):
    """Список всех клипов для админа"""
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'settings.edit'):
        return Response({'error': 'Нет доступа'}, status=403)

    status_filter = request.query_params.get('status', 'pending')
    clips = Clip.objects.filter(status=status_filter)
    data = [{
        'id': str(c.id),
        'title': c.title,
        'url': c.url,
        'game': c.game,
        'preview_url': c.preview_url,
        'status': c.status,
        'admin_note': c.admin_note,
        'created_at': c.created_at.isoformat(),
        'submitted_by': c.submitted_by.username if c.submitted_by else None,
    } for c in clips]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clip_create_admin(request):
    """Админ добавляет клип напрямую (без модерации)"""
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'settings.edit'):
        return Response({'error': 'Нет доступа'}, status=403)

    url = request.data.get('url', '').strip()
    title = request.data.get('title', '').strip()
    game = request.data.get('game', '').strip()
    preview_url = request.data.get('preview_url', '').strip()

    if not url or not title:
        return Response({'error': 'Укажи ссылку и название'}, status=400)

    clip = Clip.objects.create(
        url=url,
        title=title,
        game=game,
        preview_url=preview_url,
        submitted_by=request.user,
        status='approved',
    )
    return Response({'id': str(clip.id), 'message': 'Клип добавлен'}, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def clip_moderate(request, clip_id):
    """Одобрить или отклонить клип"""
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'settings.edit'):
        return Response({'error': 'Нет доступа'}, status=403)

    try:
        clip = Clip.objects.get(id=clip_id)
    except Clip.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)

    status = request.data.get('status')
    if status not in ['approved', 'rejected']:
        return Response({'error': 'Статус должен быть approved или rejected'}, status=400)

    clip.status = status
    clip.admin_note = request.data.get('admin_note', '')
    clip.save()
    return Response({'message': 'Обновлено'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clip_delete(request, clip_id):
    """Удалить клип"""
    from apps.users.permissions import _user_has_permission
    if not _user_has_permission(request.user, 'settings.edit'):
        return Response({'error': 'Нет доступа'}, status=403)

    try:
        clip = Clip.objects.get(id=clip_id)
    except Clip.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)

    clip.delete()
    return Response({'message': 'Удалён'})