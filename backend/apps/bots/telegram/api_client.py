import aiohttp
import os

API_BASE = os.getenv('API_BASE_URL', 'http://backend:8000/api')
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')

# Служебный JWT токен для бота
# Бот авторизуется как отдельный пользователь с ролью Bot
BOT_JWT_TOKEN = os.getenv('BOT_JWT_TOKEN', '')


async def get_headers():
    return {
        'Authorization': f'Bearer {BOT_JWT_TOKEN}',
        'Content-Type': 'application/json',
    }


async def api_get(endpoint: str, params: dict = None):
    """GET запрос к Django API"""
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f'{API_BASE}{endpoint}',
            headers=await get_headers(),
            params=params
        ) as resp:
            return await resp.json(), resp.status


async def api_post(endpoint: str, data: dict = None):
    """POST запрос к Django API"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f'{API_BASE}{endpoint}',
            headers=await get_headers(),
            json=data or {}
        ) as resp:
            return await resp.json(), resp.status


async def register_user(
    telegram_id: int,
    telegram_username: str
):
    """Регистрация или получение пользователя по Telegram ID"""
    data, status = await api_post('/auth/telegram/link/', {
        'telegram_id': telegram_id,
        'telegram_username': telegram_username,
    })
    return data, status


async def get_active_giveaways():
    """Список активных розыгрышей"""
    data, status = await api_get('/giveaways/', {'status': 'active'})
    return data if status == 200 else []


async def join_giveaway(giveaway_id: str, telegram_id: int):
    """Участвовать в розыгрыше"""
    data, status = await api_post(
        f'/giveaways/{giveaway_id}/join/telegram/',
        {'telegram_id': telegram_id}
    )
    return data, status


async def get_user_info(telegram_id: int):
    """Получить данные пользователя по Telegram ID"""
    data, status = await api_get(
        f'/auth/telegram/user/{telegram_id}/'
    )
    return data if status == 200 else None