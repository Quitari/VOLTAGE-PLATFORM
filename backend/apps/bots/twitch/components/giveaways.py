import logging
from twitchio.ext import commands
from ..api_client import get_active_giveaways, join_giveaway_twitch

logger = logging.getLogger(__name__)


class GiveawaysComponent(commands.Component):
    """Розыгрыши через Twitch чат"""

    def __init__(self, bot):
        self.bot = bot

    @commands.Component.listener()
    async def event_message(self, payload) -> None:
        """Слушаем ключевые слова для участия в розыгрыше"""
        if not payload.chatter or not payload.text:
            return

        giveaways = await get_active_giveaways()

        for giveaway in giveaways:
            keyword = giveaway.get('twitch_keyword', '').strip()
            platform = giveaway.get('platform', '')

            if not keyword:
                continue
            if platform not in ['twitch', 'both']:
                continue
            if payload.text.strip().lower() != keyword.lower():
                continue

            result, status = await join_giveaway_twitch(
                giveaway['id'],
                payload.chatter.name
            )

            if status == 201:
                count = result.get('participants_count', '?')
                await payload.broadcaster.send_message(
                    sender=self.bot.bot_id,
                    message=(
                        f'@{payload.chatter.name} ✅ '
                        f'Ты участвуешь в розыгрыше «{giveaway["title"]}»! '
                        f'Участников: {count}'
                    )
                )
            elif status == 400:
                error = result.get('error', '')
                if 'уже участвуешь' in error:
                    pass  # Не спамим в чат