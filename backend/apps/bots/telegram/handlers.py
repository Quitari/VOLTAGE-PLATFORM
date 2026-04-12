from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from .keyboards import (
    main_menu_keyboard,
    join_giveaway_keyboard,
    giveaway_list_keyboard,
    profile_keyboard,
    back_to_menu_keyboard,
)
from .api_client import (
    register_user,
    get_active_giveaways,
    join_giveaway,
    get_user_info,
    api_post,
    api_get,
)

router = Router()


# ─── FSM состояния ────────────────────────────────────────────────────────

class LinkSteam(StatesGroup):
    waiting_trade_url = State()


class LinkTwitch(StatesGroup):
    waiting_username = State()


# ─── Команды ──────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message):
    """/start — приветствие и регистрация"""
    telegram_id = message.from_user.id
    username = message.from_user.username or ''

    data, status = await register_user(telegram_id, username)

    if status in [200, 201]:
        is_new = status == 201
        greeting = '👋 Добро пожаловать!' if is_new else '👋 С возвращением!'
        name = message.from_user.first_name or username or str(telegram_id)
        await message.answer(
            f'{greeting} <b>{name}</b>\n\n'
            f'🎮 <b>VOLTAGE Platform</b> — розыгрыши скинов CS2 '
            f'и других призов.\n\n'
            f'Выбери что тебя интересует:',
            parse_mode='HTML',
            reply_markup=main_menu_keyboard()
        )
    else:
        await message.answer(
            '⚠️ Произошла ошибка при регистрации. '
            'Попробуй ещё раз: /start'
        )


@router.message(Command('help'))
async def cmd_help(message: Message):
    """Справка"""
    await message.answer(
        '📖 <b>Команды бота:</b>\n\n'
        '/start — главное меню\n'
        '/giveaways — активные розыгрыши\n'
        '/profile — мой профиль\n'
        '/prizes — мои призы\n'
        '/help — эта справка\n\n'
        '❓ Если что-то не работает — '
        'напиши в поддержку через сайт.',
        parse_mode='HTML'
    )


@router.message(Command('giveaways'))
async def cmd_giveaways(message: Message):
    """Список активных розыгрышей"""
    await show_giveaways(message)


@router.message(Command('profile'))
async def cmd_profile(message: Message):
    """Профиль пользователя"""
    await show_profile_message(message)


@router.message(Command('prizes'))
async def cmd_prizes(message: Message):
    """Мои призы"""
    data, status = await api_get(
        f'/prizes/my/{message.from_user.id}/'
    )
    if status != 200 or not data:
        await message.answer(
            '🏆 <b>Мои призы</b>\n\n'
            'У тебя пока нет призов.\n'
            'Участвуй в розыгрышах! 🎯',
            parse_mode='HTML',
            reply_markup=back_to_menu_keyboard()
        )
        return
    await _send_prizes(message, data)


# ─── Callback handlers ────────────────────────────────────────────────────

@router.callback_query(F.data == 'main_menu')
async def cb_main_menu(callback: CallbackQuery):
    """Вернуться в главное меню"""
    await callback.message.edit_text(
        '🎮 <b>VOLTAGE Platform</b>\n\nВыбери раздел:',
        parse_mode='HTML',
        reply_markup=main_menu_keyboard()
    )
    await callback.answer()


@router.callback_query(F.data == 'giveaways_list')
async def cb_giveaways_list(callback: CallbackQuery):
    """Список розыгрышей"""
    await callback.answer('Загружаю...')
    giveaways = await get_active_giveaways()

    if not giveaways:
        await callback.message.edit_text(
            '😔 Сейчас нет активных розыгрышей.\n\n'
            'Следи за анонсами — скоро будет!',
            reply_markup=back_to_menu_keyboard()
        )
        return

    text = '🎁 <b>Активные розыгрыши:</b>\n\n'
    for g in giveaways[:5]:
        text += f"• <b>{g['title']}</b>\n"
        if g.get('skin_name'):
            text += f"  Скин: {g['skin_name']}\n"
        text += f"  Участников: {g['participants_count']}\n\n"

    await callback.message.edit_text(
        text,
        parse_mode='HTML',
        reply_markup=giveaway_list_keyboard(giveaways[:5])
    )


@router.callback_query(F.data.startswith('giveaway_'))
async def cb_giveaway_detail(callback: CallbackQuery):
    """Детали розыгрыша"""
    giveaway_id = callback.data.replace('giveaway_', '')
    await callback.answer('Загружаю...')

    giveaways = await get_active_giveaways()
    giveaway = next(
        (g for g in giveaways if str(g['id']) == giveaway_id),
        None
    )

    if not giveaway:
        await callback.message.edit_text(
            '❌ Розыгрыш не найден или уже завершён.',
            reply_markup=back_to_menu_keyboard()
        )
        return

    conditions = []
    if giveaway.get('require_telegram'):
        conditions.append('✅ Нажать кнопку "Участвовать"')
    if giveaway.get('require_twitch_stream'):
        conditions.append('📺 Быть на стриме Twitch')
    if giveaway.get('twitch_keyword'):
        conditions.append(
            f"💬 Написать в чат: {giveaway['twitch_keyword']}"
        )

    conditions_text = '\n'.join(conditions) if conditions else 'Без условий'

    ends_text = ''
    if giveaway.get('ends_at'):
        ends_text = f"\n⏰ Итоги: {giveaway['ends_at'][:16].replace('T', ' ')}"

    skin_text = ''
    if giveaway.get('skin_name'):
        skin_text = f"🔫 Скин: {giveaway['skin_name']}\n"

    text = (
        f"🎁 <b>{giveaway['title']}</b>\n\n"
        f"{skin_text}"
        f"👥 Участников: {giveaway['participants_count']}"
        f"{ends_text}\n\n"
        f"📋 <b>Условия:</b>\n{conditions_text}"
    )

    await callback.message.edit_text(
        text,
        parse_mode='HTML',
        reply_markup=join_giveaway_keyboard(
            giveaway_id,
            giveaway['participants_count']
        )
    )


@router.callback_query(F.data.startswith('join_'))
async def cb_join_giveaway(callback: CallbackQuery):
    """Участвовать в розыгрыше"""
    giveaway_id = callback.data.replace('join_', '')
    telegram_id = callback.from_user.id

    await callback.answer('Регистрирую участие...')

    data, status = await join_giveaway(giveaway_id, telegram_id)

    if status == 201:
        await callback.message.edit_text(
            f"✅ <b>Ты в розыгрыше!</b>\n\n"
            f"Участников: {data.get('participants_count', '?')}\n\n"
            f"Ожидай результатов. Если выиграешь — "
            f"я напишу тебе в личку! 🏆",
            parse_mode='HTML',
            reply_markup=back_to_menu_keyboard()
        )
    elif status == 400:
        error = data.get('error', 'Ошибка')
        if 'уже участвуешь' in error:
            await callback.answer(
                '✅ Ты уже участвуешь в этом розыгрыше!',
                show_alert=True
            )
        elif 'Steam' in error:
            await callback.message.edit_text(
                '⚠️ <b>Нужен Steam аккаунт</b>\n\n'
                'Для участия в розыгрыше скинов '
                'привяжи Steam аккаунт и укажи '
                'трейд-ссылку в профиле.',
                parse_mode='HTML',
                reply_markup=profile_keyboard(False, True)
            )
        else:
            await callback.answer(f'❌ {error}', show_alert=True)
    else:
        await callback.answer(
            '❌ Ошибка. Попробуй позже.',
            show_alert=True
        )


@router.callback_query(F.data == 'my_profile')
async def cb_my_profile(callback: CallbackQuery):
    """Профиль пользователя"""
    await callback.answer('Загружаю...')
    user = await get_user_info(callback.from_user.id)

    if not user:
        await callback.message.edit_text(
            '❌ Профиль не найден. Напиши /start',
            reply_markup=back_to_menu_keyboard()
        )
        return

    steam_status = '✅ Привязан' if user.get('has_steam') else '❌ Не привязан'
    twitch_status = '✅ Привязан' if user.get('has_twitch') else '❌ Не привязан'

    roles = user.get('roles', [])
    role_names = [r['role']['name'] for r in roles] if roles else ['Участник']

    text = (
        f"👤 <b>Профиль</b>\n\n"
        f"Ник: <b>{user['username']}</b>\n"
        f"Роль: {', '.join(role_names)}\n\n"
        f"🔗 Steam: {steam_status}\n"
        f"📺 Twitch: {twitch_status}\n\n"
        f"Зарегистрирован: {user['created_at'][:10]}"
    )

    await callback.message.edit_text(
        text,
        parse_mode='HTML',
        reply_markup=profile_keyboard(
            user.get('has_steam', False),
            user.get('has_twitch', False)
        )
    )


@router.callback_query(F.data == 'link_steam')
async def cb_link_steam(callback: CallbackQuery, state: FSMContext):
    """Начало привязки Steam"""
    await state.set_state(LinkSteam.waiting_trade_url)
    await callback.message.edit_text(
        '🔗 <b>Привязка Steam</b>\n\n'
        'Отправь свою <b>Steam Trade URL</b>.\n\n'
        'Как найти:\n'
        '1. Открой Steam → Инвентарь\n'
        '2. Нажми "Обмен" → "Создать ссылку для обмена"\n'
        '3. Скопируй ссылку и отправь сюда\n\n'
        'Формат:\n'
        '<code>https://steamcommunity.com/tradeoffer/new/?partner=...&token=...</code>',
        parse_mode='HTML',
        reply_markup=back_to_menu_keyboard()
    )
    await callback.answer()


@router.message(LinkSteam.waiting_trade_url)
async def process_steam_url(message: Message, state: FSMContext):
    """Обработка Steam Trade URL"""
    url = message.text.strip()

    if 'steamcommunity.com/tradeoffer' not in url:
        await message.answer(
            '❌ Неверный формат ссылки.\n\n'
            'Ссылка должна начинаться с:\n'
            '<code>https://steamcommunity.com/tradeoffer/new/</code>',
            parse_mode='HTML'
        )
        return

    data, status = await api_post('/auth/steam/link/', {
        'telegram_id': message.from_user.id,
        'steam_trade_url': url,
    })

    await state.clear()

    if status == 200:
        await message.answer(
            '✅ <b>Steam привязан!</b>\n\n'
            'Теперь ты можешь участвовать '
            'в розыгрышах скинов.',
            parse_mode='HTML',
            reply_markup=back_to_menu_keyboard()
        )
    else:
        await message.answer(
            '❌ Ошибка привязки. Попробуй ещё раз.',
            reply_markup=back_to_menu_keyboard()
        )


@router.callback_query(F.data == 'link_twitch')
async def cb_link_twitch(callback: CallbackQuery, state: FSMContext):
    """Начало привязки Twitch"""
    await state.set_state(LinkTwitch.waiting_username)
    await callback.message.edit_text(
        '📺 <b>Привязка Twitch</b>\n\n'
        'Отправь свой Twitch ник.\n\n'
        'Например: <code>ninja</code> или <code>@ninja</code>',
        parse_mode='HTML',
        reply_markup=back_to_menu_keyboard()
    )
    await callback.answer()


@router.message(LinkTwitch.waiting_username)
async def process_twitch_username(message: Message, state: FSMContext):
    """Обработка Twitch юзернейма"""
    username = message.text.strip().lstrip('@')

    if not username:
        await message.answer('❌ Ник не может быть пустым. Попробуй ещё раз.')
        return

    data, status = await api_post('/auth/twitch/link/', {
        'telegram_id': message.from_user.id,
        'twitch_username': username,
    })

    await state.clear()

    if status == 200:
        await message.answer(
            f'✅ <b>Twitch привязан!</b>\n\n'
            f'Ник: <b>{username}</b>\n\n'
            f'Теперь бот сможет проверить твою '
            f'активность на стриме.',
            parse_mode='HTML',
            reply_markup=back_to_menu_keyboard()
        )
    else:
        await message.answer(
            '❌ Ошибка привязки. Попробуй ещё раз.',
            reply_markup=back_to_menu_keyboard()
        )


@router.callback_query(F.data == 'my_prizes')
async def cb_my_prizes(callback: CallbackQuery):
    """Мои призы"""
    await callback.answer('Загружаю...')

    data, status = await api_get(
        f'/prizes/my/{callback.from_user.id}/'
    )

    if status != 200 or not data:
        await callback.message.edit_text(
            '🏆 <b>Мои призы</b>\n\n'
            'У тебя пока нет призов.\n'
            'Участвуй в розыгрышах! 🎯',
            parse_mode='HTML',
            reply_markup=back_to_menu_keyboard()
        )
        return

    await _send_prizes_edit(callback.message, data)


# ─── Вспомогательные функции ──────────────────────────────────────────────

async def show_giveaways(message: Message):
    giveaways = await get_active_giveaways()
    if not giveaways:
        await message.answer(
            '😔 Сейчас нет активных розыгрышей.',
            reply_markup=back_to_menu_keyboard()
        )
        return
    await message.answer(
        '🎁 Активные розыгрыши:',
        reply_markup=giveaway_list_keyboard(giveaways[:5])
    )


async def show_profile_message(message: Message):
    user = await get_user_info(message.from_user.id)
    if not user:
        await message.answer('❌ Профиль не найден. Напиши /start')
        return

    roles = user.get('roles', [])
    role_names = [r['role']['name'] for r in roles] if roles else ['Участник']

    await message.answer(
        f"👤 <b>Профиль</b>\n\n"
        f"Ник: <b>{user['username']}</b>\n"
        f"Роль: {', '.join(role_names)}\n\n"
        f"Steam: {'✅' if user.get('has_steam') else '❌'}\n"
        f"Twitch: {'✅' if user.get('has_twitch') else '❌'}",
        parse_mode='HTML',
        reply_markup=profile_keyboard(
            user.get('has_steam', False),
            user.get('has_twitch', False)
        )
    )


async def _send_prizes(message: Message, data: list):
    text = '🏆 <b>Твои призы:</b>\n\n'
    for prize in data[:10]:
        status_emoji = {
            'pending': '⏳',
            'processing': '🔄',
            'sent': '📦',
            'delivered': '✅',
            'failed': '❌',
            'cancelled': '🚫',
        }.get(prize['status'], '❓')
        text += (
            f"{status_emoji} <b>{prize['name']}</b>\n"
            f"Статус: {prize['status']}\n\n"
        )
    await message.answer(
        text,
        parse_mode='HTML',
        reply_markup=back_to_menu_keyboard()
    )


async def _send_prizes_edit(message, data: list):
    text = '🏆 <b>Твои призы:</b>\n\n'
    for prize in data[:10]:
        status_emoji = {
            'pending': '⏳',
            'processing': '🔄',
            'sent': '📦',
            'delivered': '✅',
            'failed': '❌',
            'cancelled': '🚫',
        }.get(prize['status'], '❓')
        text += (
            f"{status_emoji} <b>{prize['name']}</b>\n"
            f"Статус: {prize['status']}\n\n"
        )
    await message.edit_text(
        text,
        parse_mode='HTML',
        reply_markup=back_to_menu_keyboard()
    )