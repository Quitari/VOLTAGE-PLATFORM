import asyncio
import logging
import os
from typing import TYPE_CHECKING

import asqlite
import twitchio
from twitchio import eventsub
from twitchio.ext import commands

from .components.commands import CommandsComponent
from .components.giveaways import GiveawaysComponent
from .components.drops import DropsComponent
from .components.stats import StatsComponent
from .api_client import _login

if TYPE_CHECKING:
    import sqlite3

logger = logging.getLogger('twitch_bot')

CLIENT_ID = os.getenv('TWITCH_CLIENT_ID', '')
CLIENT_SECRET = os.getenv('TWITCH_CLIENT_SECRET', '')
BOT_ID = os.getenv('TWITCH_BOT_ID', '')
OWNER_ID = os.getenv('TWITCH_OWNER_ID', '')
REDIRECT_URI = os.getenv(
    'TWITCH_REDIRECT_URI',
    'https://quitari.ru/twitch/callback'
)


class VoltageBot(commands.AutoBot):

    def __init__(
        self,
        *,
        token_database: asqlite.Pool,
        subs: list[eventsub.SubscriptionPayload]
    ) -> None:
        self.token_database = token_database
        super().__init__(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            bot_id=BOT_ID,
            owner_id=OWNER_ID,
            prefix='!',
            subscriptions=subs,
            force_subscribe=True,
            redirect_uri=REDIRECT_URI,
            http_server_host='0.0.0.0',
            http_server_port=4343,
        )

    async def setup_hook(self) -> None:
        # Ждём backend
        import aiohttp
        api_base = os.getenv('API_BASE_URL', 'http://backend:8000/api')
        for attempt in range(10):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f'{api_base}/auth/roles/') as resp:
                        if resp.status in [200, 401, 403]:
                            logger.info('Backend доступен')
                            break
            except Exception:
                logger.info(f'Жду backend... попытка {attempt + 1}/10')
                await asyncio.sleep(3)

        await _login()
        await self.add_component(CommandsComponent(self))
        await self.add_component(GiveawaysComponent(self))
        await self.add_component(DropsComponent(self))
        await self.add_component(StatsComponent(self))
        logger.info('Все компоненты загружены')

    async def event_oauth_authorized(
        self,
        payload: twitchio.authentication.UserTokenPayload
    ) -> None:
        await self.add_token(payload.access_token, payload.refresh_token)
        if not payload.user_id:
            return
        if payload.user_id == self.bot_id:
            return

        subs = [
            eventsub.ChatMessageSubscription(
                broadcaster_user_id=payload.user_id,
                user_id=self.bot_id
            ),
            eventsub.ChannelPointsRedemptionAddSubscription(
                broadcaster_user_id=payload.user_id
            ),
        ]
        resp = await self.multi_subscribe(subs)
        if resp.errors:
            logger.warning(
                'Ошибки подписки: %r для пользователя: %s',
                resp.errors,
                payload.user_id
            )

    async def add_token(
        self,
        token: str,
        refresh: str
    ) -> twitchio.authentication.ValidateTokenPayload:
        resp = await super().add_token(token, refresh)
        query = """
            INSERT INTO tokens (user_id, token, refresh)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id)
            DO UPDATE SET
                token = excluded.token,
                refresh = excluded.refresh;
        """
        async with self.token_database.acquire() as connection:
            await connection.execute(query, (resp.user_id, token, refresh))
        logger.info('Токен сохранён для: %s', resp.user_id)
        return resp

    async def event_ready(self) -> None:
        logger.info('Twitch бот запущен: %s', self.bot_id)

    async def event_message(self, payload: twitchio.ChatMessage) -> None:
        logger.debug(
            '[%s] %s: %s',
            payload.broadcaster.name,
            payload.chatter.name if payload.chatter else 'system',
            payload.text
        )


async def setup_database(
    db: asqlite.Pool
) -> tuple[list[tuple[str, str]], list[eventsub.SubscriptionPayload]]:
    query = """
        CREATE TABLE IF NOT EXISTS tokens(
            user_id TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            refresh TEXT NOT NULL
        )
    """
    async with db.acquire() as connection:
        await connection.execute(query)
        rows = await connection.fetchall('SELECT * FROM tokens')

    tokens = []
    subs = []
    for row in rows:
        tokens.append((row['token'], row['refresh']))
        if row['user_id'] == BOT_ID:
            continue
        subs.append(
            eventsub.ChatMessageSubscription(
                broadcaster_user_id=row['user_id'],
                user_id=BOT_ID
            )
        )
    return tokens, subs


async def main():
    twitchio.utils.setup_logging(level=logging.INFO)

    db_path = os.getenv('TWITCH_DB_PATH', '/app/twitch_tokens.db')

    async with asqlite.create_pool(db_path) as tdb:
        tokens, subs = await setup_database(tdb)

        async with VoltageBot(token_database=tdb, subs=subs) as bot:
            for pair in tokens:
                await bot.add_token(*pair)
            await bot.start(load_tokens=False)

def run():
    twitchio.utils.setup_logging(level=logging.INFO)
    
    async def runner():
        db_path = os.getenv('TWITCH_DB_PATH', '/app/twitch_tokens.db')
        async with asqlite.create_pool(db_path) as tdb:
            tokens, subs = await setup_database(tdb)
            async with VoltageBot(token_database=tdb, subs=subs) as bot:
                for pair in tokens:
                    await bot.add_token(*pair)
                await bot.start(load_tokens=False)

    try:
        asyncio.run(runner())
    except KeyboardInterrupt:
        logger.warning('Остановка по KeyboardInterrupt')


if __name__ == '__main__':
    run()