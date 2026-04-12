import aiohttp
import os

API_BASE = os.getenv('API_BASE_URL', 'http://backend:8000/api')


async def api_get(endpoint: str, params: dict = None):
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f'{API_BASE}{endpoint}',
            params=params
        ) as resp:
            try:
                return await resp.json(), resp.status
            except Exception:
                return {}, resp.status


async def api_post(endpoint: str, data: dict = None):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f'{API_BASE}{endpoint}',
            json=data or {}
        ) as resp:
            try:
                return await resp.json(), resp.status
            except Exception:
                return {}, resp.status


async def register_user(telegram_id: int, telegram_username: str):
    return await api_post('/auth/telegram/link/', {
        'telegram_id': telegram_id,
        'telegram_username': telegram_username,
    })


async def get_active_giveaways():
    data, status = await api_get('/giveaways/', {'status': 'active'})
    return data if status == 200 else []


async def join_giveaway(giveaway_id: str, telegram_id: int):
    return await api_post(
        f'/giveaways/{giveaway_id}/join/telegram/',
        {'telegram_id': telegram_id}
    )


async def get_user_info(telegram_id: int):
    data, status = await api_get(f'/auth/telegram/user/{telegram_id}/')
    return data if status == 200 else None


async def get_bot_settings():
    data, status = await api_get('/bots/settings/')
    return data if status == 200 else {}


async def get_user_level(telegram_id: int):
    """Получить уровень доступа пользователя"""
    user = await get_user_info(telegram_id)
    if not user:
        return 0
    roles = user.get('roles', [])
    if not roles:
        return 0
    return max(r['role']['level'] for r in roles if r.get('is_active', True))