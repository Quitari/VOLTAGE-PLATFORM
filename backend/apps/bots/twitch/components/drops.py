import logging
from twitchio.ext import commands
from ..api_client import get_bot_settings

logger = logging.getLogger(__name__)

LINKDROPS_BOT = 'linkdrops'


class DropsComponent(commands.Component):
    """VoltageDrops / LinkDrops интеграция"""

    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='drops')
    async def drops_command(self, ctx: commands.Context) -> None:
        """!drops — ссылка на LinkDrops"""
        settings = await get_bot_settings()
        channel = settings.get('channel_username', '').lstrip('@')

        if channel:
            await ctx.send(
                f'🎁 Выигрывай CS2 айтемы у {ctx.broadcaster.name}! '
                f'Для участия регайся тут — '
                f'https://linkdrops.gg/s/{channel}'
            )
        else:
            await ctx.send(
                f'🎁 Следи за розыгрышами в Telegram!'
            )

    @commands.Component.listener()
    async def event_message(self, payload) -> None:
        """Слушаем сообщения от LinkDrops и красиво форматируем"""
        if not payload.chatter:
            return
        if payload.chatter.name.lower() != LINKDROPS_BOT:
            return

        text = payload.text
        logger.info(f'LinkDrops event: {text}')

        # Победитель выиграл предмет
        if 'выиграл' in text.lower() or 'победитель' in text.lower():
            await payload.broadcaster.send_message(
                sender=self.bot.bot_id,
                message=f'🎊 {text}'
            )