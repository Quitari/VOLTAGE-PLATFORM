import asyncio
import logging
from twitchio.ext import commands
from ..api_client import get_viewer_stats, update_viewer_stats

logger = logging.getLogger(__name__)


class StatsComponent(commands.Component):
    """Статистика зрителей"""

    def __init__(self, bot):
        self.bot = bot
        self._message_counts: dict = {}
        self._watch_task = None

    async def cog_load(self):
        self._watch_task = asyncio.create_task(self._track_watch_time())

    async def cog_unload(self):
        if self._watch_task:
            self._watch_task.cancel()

    async def _track_watch_time(self):
        """Каждые 5 минут добавляем время просмотра активным зрителям"""
        while True:
            await asyncio.sleep(300)
            try:
                for key, count in list(self._message_counts.items()):
                    twitch_id, channel_id = key.split(':')
                    if count > 0:
                        await update_viewer_stats(
                            twitch_id=twitch_id,
                            twitch_login='',
                            channel_id=channel_id,
                            watch_minutes=5
                        )
            except Exception as e:
                logger.error(f'Ошибка трекинга времени: {e}')

    @commands.Component.listener()
    async def event_message(self, payload) -> None:
        """Считаем сообщения"""
        if not payload.chatter:
            return

        key = f"{payload.chatter.id}:{payload.broadcaster.id}"
        self._message_counts[key] = self._message_counts.get(key, 0) + 1

        await update_viewer_stats(
            twitch_id=str(payload.chatter.id),
            twitch_login=payload.chatter.name,
            channel_id=str(payload.broadcaster.id),
            messages=1
        )

    @commands.command(name='myaccount')
    async def myaccount_command(self, ctx: commands.Context) -> None:
        """!myaccount — статистика зрителя"""
        stats = await get_viewer_stats(
            ctx.chatter.name,
            str(ctx.broadcaster.id)
        )

        if not stats:
            await ctx.send(
                f'@{ctx.chatter.name} — ты ещё не в базе. '
                f'Напиши что-нибудь в чат!'
            )
            return

        wt = stats['watch_time_formatted']
        msgs = stats['messages_count']
        await ctx.send(
            f'@{ctx.chatter.name} ⏱ '
            f'Время: {wt} | '
            f'Сообщений: {msgs}'
        )