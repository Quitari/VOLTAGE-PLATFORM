import logging
from twitchio.ext import commands
from ..api_client import get_twitch_commands, get_bot_settings

logger = logging.getLogger(__name__)


class CommandsComponent(commands.Component):
    """Динамические команды из базы данных"""

    def __init__(self, bot):
        self.bot = bot
        self._cooldowns: dict = {}

    @commands.Component.listener()
    async def event_message(self, payload) -> None:
        """Обрабатываем все сообщения для динамических команд"""
        if not payload.text.startswith('!'):
            return

        cmd_name = payload.text.split()[0][1:].lower()
        commands_list = await get_twitch_commands()

        for cmd in commands_list:
            if cmd['name'].lower() == cmd_name:
                import time
                key = f"{cmd['name']}:{payload.broadcaster.id}"
                last_used = self._cooldowns.get(key, 0)
                now = time.time()

                if now - last_used < cmd['cooldown']:
                    return

                self._cooldowns[key] = now
                await payload.broadcaster.send_message(
                    sender=self.bot.bot_id,
                    message=cmd['response']
                )
                return