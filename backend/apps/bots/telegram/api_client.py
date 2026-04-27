import aiohttp
import os
import logging

logger = logging.getLogger(__name__)

API_BASE = os.getenv('API_BASE_URL', 'http://backend:8000/api')
BOT_USERNAME = 'voltage_bot'
BOT_PASSWORD_ENV = os.getenv('BOT_PASSWORD', '')

# Кэш токена в памяти
_access_token = os.getenv('BOT_JWT_TOKEN', '')
_refresh_token = ''


async def _refresh_access_token():
    """Обновляет access токен через refresh"""
    global _access_token, _refresh_token
    if not _refresh_token:
        await _login()
        return
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{API_BASE}/auth/refresh/',
                json={'refresh': _refresh_token}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    _access_token = data['access']
                    logger.info('Токен бота обновлён')
                else:
                    await _login()
    except Exception as e:
        logger.error(f'Ошибка обновления токена: {e}')
        await _login()


async def _login():
    """Логинится как voltage_bot и получает токены"""
    global _access_token, _refresh_token
    # Используем telegram_link для получения токена бота
    try:
        async with aiohttp.ClientSession() as session:
            # Получаем пользователя бота
            async with session.post(
                f'{API_BASE}/auth/telegram/link/',
                json={'telegram_id': 0, 'telegram_username': 'voltage_bot_system'}
            ) as resp:
                pass  # просто проверяем что API доступен

        # Логинимся напрямую
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{API_BASE}/auth/login/',
                json={'login': 'voltage_bot', 'password': os.getenv('BOT_PASSWORD', '')}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    _access_token = data['tokens']['access']
                    _refresh_token = data['tokens']['refresh']
                    logger.info('Бот авторизован')
                else:
                    logger.error(f'Ошибка авторизации бота: {resp.status}')
    except Exception as e:
        logger.error(f'Ошибка логина бота: {e}')


async def _get_headers():
    return {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {_access_token}' if _access_token else '',
        'X-Internal-Secret': os.getenv('INTERNAL_API_SECRET', ''),
    }


async def api_get(endpoint: str, params: dict = None):
    global _access_token
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f'{API_BASE}{endpoint}',
            headers=await _get_headers(),
            params=params
        ) as resp:
            if resp.status == 401:
                await _refresh_access_token()
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
    global _access_token
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f'{API_BASE}{endpoint}',
            headers=await _get_headers(),
            json=data or {}
        ) as resp:
            if resp.status == 401:
                await _refresh_access_token()
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
    user = await get_user_info(telegram_id)
    if not user:
        return 0
    roles = user.get('roles', [])
    if not roles:
        return 0
    return max(r['role']['level'] for r in roles if r.get('is_active', True))