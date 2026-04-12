import asyncio
import logging
import os
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.redis import RedisStorage
from .handlers import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    redis_url = os.getenv('REDIS_URL', 'redis://redis:6379/0')

    if not bot_token:
        logger.error('TELEGRAM_BOT_TOKEN не задан')
        return

    # Ждём пока backend поднимется
    import aiohttp
    api_base = os.getenv('API_BASE_URL', 'http://backend:8000/api')
    for attempt in range(10):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f'{api_base}/auth/roles/'
                ) as resp:
                    if resp.status in [200, 401, 403]:
                        logger.info('Backend доступен')
                        break
        except Exception:
            logger.info(f'Жду backend... попытка {attempt + 1}/10')
            await asyncio.sleep(3)

    storage = RedisStorage.from_url(redis_url)
    bot = Bot(
        token=bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher(storage=storage)
    dp.include_router(router)

    logger.info('Telegram бот запущен')

    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == '__main__':
    asyncio.run(main())