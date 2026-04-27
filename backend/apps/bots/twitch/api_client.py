import aiohttp
import os
import logging

logger = logging.getLogger(__name__)

API_BASE = os.getenv('API_BASE_URL', 'http://backend:8000/api')
_access_token = ''
_refresh_token = ''


async def _login():
    global _access_token, _refresh_token
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{API_BASE}/auth/login/',
                json={
                    'login': 'voltage_bot',
                    'password': os.getenv('BOT_PASSWORD', '')
                }
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    _access_token = data['tokens']['access']
                    _refresh_token = data['tokens']['refresh']
                    logger.info('Twitch бот авторизован в API')
                else:
                    logger.error(f'Ошибка авторизации: {resp.status}')
    except Exception as e:
        logger.error(f'Ошибка логина: {e}')


async def _get_headers():
    return {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {_access_token}',
        'X-Internal-Secret': os.getenv('INTERNAL_API_SECRET', ''),
    }


async def api_get(endpoint: str, params: dict = None):
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f'{API_BASE}{endpoint}',
            headers=await _get_headers(),
            params=params
        ) as resp:
            if resp.status == 401:
                await _login()
                async with aiohttp.ClientSession() as s2:
                    async with s2.get(
                        f'{API_BASE}{endpoint}',
                        headers=await _get_headers(),
                        params=params
                    ) as resp2:
                        try:
                            return await resp2.json(), resp2.status
                        except Exception:
                            return {}, resp2.status
            try:
                return await resp.json(), resp.status
            except Exception:
                return {}, resp.status


async def api_post(endpoint: str, data: dict = None):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f'{API_BASE}{endpoint}',
            headers=await _get_headers(),
            json=data or {}
        ) as resp:
            if resp.status == 401:
                await _login()
                async with aiohttp.ClientSession() as s2:
                    async with s2.post(
                        f'{API_BASE}{endpoint}',
                        headers=await _get_headers(),
                        json=data or {}
                    ) as resp2:
                        try:
                            return await resp2.json(), resp2.status
                        except Exception:
                            return {}, resp2.status
            try:
                return await resp.json(), resp.status
            except Exception:
                return {}, resp.status


async def get_twitch_commands():
    """Получить все активные команды"""
    data, status = await api_get('/bots/commands/public/')
    return data if status == 200 else []


async def get_active_giveaways():
    """Получить активные розыгрыши"""
    data, status = await api_get('/giveaways/', {'status': 'active'})
    return data if status == 200 else []


async def join_giveaway_twitch(giveaway_id: str, twitch_username: str):
    """Участие в розыгрыше через Twitch"""
    return await api_post(f'/giveaways/{giveaway_id}/join/twitch/', {
        'twitch_username': twitch_username,
    })


async def update_viewer_stats(
    twitch_id: str,
    twitch_login: str,
    channel_id: str,
    messages: int = 0,
    watch_minutes: int = 0
):
    """Обновить статистику зрителя"""
    return await api_post('/bots/twitch/stats/', {
        'twitch_id': twitch_id,
        'twitch_login': twitch_login,
        'channel_id': channel_id,
        'messages': messages,
        'watch_minutes': watch_minutes,
    })


async def get_viewer_stats(twitch_login: str, channel_id: str):
    """Получить статистику зрителя"""
    data, status = await api_get(
        f'/bots/twitch/stats/{twitch_login}/',
        {'channel_id': channel_id}
    )
    return data if status == 200 else None


async def get_bot_settings():
    """Настройки бота"""
    data, status = await api_get('/bots/settings/')
    return data if status == 200 else {}