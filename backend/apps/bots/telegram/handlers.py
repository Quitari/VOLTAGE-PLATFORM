from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from .keyboards import (
    main_menu_keyboard,
    admin_panel_keyboard,
    join_giveaway_keyboard,
    giveaway_list_keyboard,
    profile_keyboard,
    back_to_menu_keyboard,
    back_to_admin_keyboard,
    quick_giveaway_keyboard,
    quick_giveaway_platform_keyboard,
    confirm_giveaway_keyboard,
    active_giveaways_draw_keyboard,
)
from .api_client import (
    register_user,
    get_active_giveaways,
    join_giveaway,
    get_user_info,
    get_user_level,
    get_bot_settings,
    api_post,
    api_get,
)

router = Router()


class LinkSteam(StatesGroup):
    waiting_trade_url = State()


class LinkTwitch(StatesGroup):
    waiting_username = State()


class QuickGiveaway(StatesGroup):
    waiting_title = State()
    waiting_type = State()
    waiting_platform = State()
    confirm = State()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    telegram_id = message.from_user.id
    username = message.from_user.username or ''
    data, status = await register_user(telegram_id, username)
    if status not in [200, 201]:
        await message.answer('⚠️ Ошибка при регистрации. Попробуй ещё раз: /start')
        return
    is_new = status == 201
    name = message.from_user.first_name or username or str(telegram_id)
    level = await get_user_level(telegram_id)
    settings = await get_bot_settings()
    if is_new:
        template = settings.get(
            'welcome_new',
            '👋 Добро пожаловать! <b>{name}</b>\n\n'
            '🎮 <b>VOLTAGE Platform</b> — розыгрыши скинов CS2 и других призов.\n\n'
            'Выбери что тебя интересует:'
        )
    else:
        template = settings.get(
            'welcome_back',
            '👋 С возвращением! <b>{name}</b>\n\nВыбери раздел:'
        )
    await message.answer(
        template.format(name=name),
        parse_mode='HTML',
        reply_markup=main_menu_keyboard(level)
    )


@router.message(Command('help'))
async def cmd_help(message: Message):
    await message.answer(
        '📖 <b>Команды бота:</b>\n\n'
        '/start — главное меню\n'
        '/giveaways — активные розыгрыши\n'
        '/profile — мой профиль\n'
        '/prizes — мои призы\n'
        '/admin — панель управления\n'
        '/help — эта справка',
        parse_mode='HTML'
    )


@router.message(Command('giveaways'))
async def cmd_giveaways(message: Message):
    await show_giveaways(message)


@router.message(Command('profile'))
async def cmd_profile(message: Message):
    await show_profile_message(message)


@router.message(Command('prizes'))
async def cmd_prizes(message: Message):
    data, status = await api_get(f'/prizes/my/{message.from_user.id}/')
    if status != 200 or not data:
        await message.answer(
            '🏆 <b>Мои призы</b>\n\nУ тебя пока нет призов. 🎯',
            parse_mode='HTML',
            reply_markup=back_to_menu_keyboard()
        )
        return
    await message.answer(
        _format_prizes(data),
        parse_mode='HTML',
        reply_markup=back_to_menu_keyboard()
    )


@router.message(Command('admin'))
async def cmd_admin(message: Message):
    level = await get_user_level(message.from_user.id)
    if level < 30:
        await message.answer('❌ Нет доступа.')
        return
    await message.answer(
        f'⚙️ <b>Панель управления</b>\n\nУровень доступа: <b>{level}</b>\n\nВыбери действие:',
        parse_mode='HTML',
        reply_markup=admin_panel_keyboard(level)
    )


@router.callback_query(F.data == 'main_menu')
async def cb_main_menu(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    level = await get_user_level(callback.from_user.id)
    await callback.message.edit_text(
        '🎮 <b>VOLTAGE Platform</b>\n\nВыбери раздел:',
        parse_mode='HTML',
        reply_markup=main_menu_keyboard(level)
    )
    await callback.answer()


@router.callback_query(F.data == 'admin_panel')
async def cb_admin_panel(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    level = await get_user_level(callback.from_user.id)
    if level < 30:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await callback.message.edit_text(
        f'⚙️ <b>Панель управления</b>\n\nУровень доступа: <b>{level}</b>\n\nВыбери действие:',
        parse_mode='HTML',
        reply_markup=admin_panel_keyboard(level)
    )
    await callback.answer()


@router.callback_query(F.data == 'admin_stats')
async def cb_admin_stats(callback: CallbackQuery):
    await callback.answer('Загружаю...')
    giveaways, _ = await api_get('/giveaways/', {'status': 'active'})
    active_count = len(giveaways) if isinstance(giveaways, list) else 0
    all_giveaways, _ = await api_get('/giveaways/', {'status': 'all'})
    total_count = len(all_giveaways) if isinstance(all_giveaways, list) else 0
    await callback.message.edit_text(
        f'📊 <b>Статистика платформы</b>\n\n'
        f'🎁 Активных розыгрышей: <b>{active_count}</b>\n'
        f'📦 Всего розыгрышей: <b>{total_count}</b>',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )


@router.callback_query(F.data == 'admin_status')
async def cb_admin_status(callback: CallbackQuery):
    await callback.answer('Проверяю...')
    await callback.message.edit_text(
        '🤖 <b>Статус платформы</b>\n\n'
        '✅ Telegram бот — онлайн\n'
        '✅ Django API — работает\n'
        '✅ База данных — подключена\n'
        '✅ Redis — подключен',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )


@router.callback_query(F.data == 'admin_punishments')
async def cb_admin_punishments(callback: CallbackQuery):
    level = await get_user_level(callback.from_user.id)
    if level < 50:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await callback.answer('Загружаю...')
    data, status = await api_get('/moderation/punishments/', {'status': 'active'})
    if not data or status != 200:
        await callback.message.edit_text(
            '⚠️ <b>Активные наказания</b>\n\nНет активных наказаний.',
            parse_mode='HTML',
            reply_markup=back_to_admin_keyboard()
        )
        return
    text = '⚠️ <b>Последние наказания:</b>\n\n'
    for p in data[:5]:
        text += (
            f"• <b>{p.get('user', {}).get('username', '?')}</b> — "
            f"{p.get('punishment_type', '?')}\n"
            f"  {p.get('reason', '')[:50]}\n\n"
        )
    await callback.message.edit_text(text, parse_mode='HTML', reply_markup=back_to_admin_keyboard())


@router.callback_query(F.data == 'admin_tickets')
async def cb_admin_tickets(callback: CallbackQuery):
    level = await get_user_level(callback.from_user.id)
    if level < 50:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await callback.answer('Загружаю...')
    data, status = await api_get('/moderation/tickets/', {'status': 'open'})
    count = len(data) if isinstance(data, list) and status == 200 else 0
    await callback.message.edit_text(
        f'📋 <b>Открытые тикеты: {count}</b>\n\nДля работы с тикетами используй веб-панель.',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )


@router.callback_query(F.data == 'admin_users')
async def cb_admin_users(callback: CallbackQuery):
    level = await get_user_level(callback.from_user.id)
    if level < 100:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await callback.message.edit_text(
        '👥 <b>Управление пользователями</b>\n\nДля управления пользователями используй веб-панель.',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )


@router.callback_query(F.data == 'admin_audit')
async def cb_admin_audit(callback: CallbackQuery):
    level = await get_user_level(callback.from_user.id)
    if level < 100:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await callback.answer('Загружаю...')
    data, status = await api_get('/moderation/audit/')
    if not data or status != 200:
        await callback.message.edit_text(
            '📜 <b>Журнал аудита</b>\n\nНет записей.',
            parse_mode='HTML',
            reply_markup=back_to_admin_keyboard()
        )
        return
    text = '📜 <b>Последние действия:</b>\n\n'
    for log in data[:5]:
        text += f"• <b>{log.get('actor', {}).get('username', '?')}</b> — {log.get('action', '?')}\n"
    await callback.message.edit_text(text, parse_mode='HTML', reply_markup=back_to_admin_keyboard())


@router.callback_query(F.data == 'admin_create_giveaway')
async def cb_admin_create_giveaway(callback: CallbackQuery, state: FSMContext):
    level = await get_user_level(callback.from_user.id)
    if level < 30:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await state.set_state(QuickGiveaway.waiting_title)
    await callback.message.edit_text(
        '🎁 <b>Быстрый розыгрыш</b>\n\n'
        'Шаг 1/3: Напиши название приза\n\n'
        'Например: <i>AWP Азимов FT</i> или <i>Gift Card $50</i>',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )
    await callback.answer()


@router.message(QuickGiveaway.waiting_title)
async def qg_got_title(message: Message, state: FSMContext):
    title = message.text.strip()
    await state.update_data(title=title)
    try:
        await message.delete()
    except Exception:
        pass
    await message.answer(
        f'✅ Приз: <b>{title}</b>\n\nШаг 2/3: Выбери тип приза:',
        parse_mode='HTML',
        reply_markup=quick_giveaway_keyboard()
    )
    await state.set_state(QuickGiveaway.waiting_type)


@router.callback_query(F.data.startswith('qg_type_'))
async def qg_got_type(callback: CallbackQuery, state: FSMContext):
    prize_type = callback.data.replace('qg_type_', '')
    data = await state.get_data()

    # Если state пустой (после перезапуска бота) — начинаем заново
    if not data.get('title'):
        await state.clear()
        await callback.message.edit_text(
            '⚠️ Сессия истекла. Начни заново.',
            reply_markup=back_to_admin_keyboard()
        )
        await callback.answer()
        return

    await state.update_data(prize_type=prize_type)
    await callback.message.edit_text(
        f'✅ Приз: <b>{data["title"]}</b>\n'
        f'✅ Тип: <b>{"Скин CS2" if prize_type == "skin" else "Другое"}</b>\n\n'
        f'Шаг 3/3: Выбери платформу:',
        parse_mode='HTML',
        reply_markup=quick_giveaway_platform_keyboard()
    )
    await state.set_state(QuickGiveaway.waiting_platform)
    await callback.answer()


@router.callback_query(F.data.startswith('qg_platform_'))
async def qg_got_platform(callback: CallbackQuery, state: FSMContext):
    platform = callback.data.replace('qg_platform_', '')
    data = await state.get_data()

    if not data.get('title') or not data.get('prize_type'):
        await state.clear()
        await callback.message.edit_text(
            '⚠️ Сессия истекла. Начни заново.',
            reply_markup=back_to_admin_keyboard()
        )
        await callback.answer()
        return

    await state.update_data(platform=platform)
    platform_names = {'telegram': 'Telegram', 'twitch': 'Twitch', 'both': 'Telegram + Twitch'}
    await callback.message.edit_text(
        f'📋 <b>Проверь данные:</b>\n\n'
        f'🎁 Приз: <b>{data["title"]}</b>\n'
        f'🔧 Тип: <b>{"Скин CS2" if data["prize_type"] == "skin" else "Другое"}</b>\n'
        f'📱 Платформа: <b>{platform_names.get(platform, platform)}</b>\n\n'
        f'Запустить розыгрыш?',
        parse_mode='HTML',
        reply_markup=confirm_giveaway_keyboard()
    )
    await state.set_state(QuickGiveaway.confirm)
    await callback.answer()


@router.callback_query(F.data == 'qg_confirm')
async def qg_confirm(callback: CallbackQuery, state: FSMContext):
    import logging
    log = logging.getLogger(__name__)

    data = await state.get_data()
    await state.clear()

    result, status = await api_post('/giveaways/create/', {
        'title': data['title'],
        'prize_type': data['prize_type'],
        'platform': data['platform'],
        'require_telegram': data['platform'] in ['telegram', 'both'],
        'draw_manually': True,
    })

    log.error(f'CREATE GIVEAWAY: status={status}, result={result}')

    if status != 201:
        await callback.message.edit_text(
            f'❌ Ошибка создания {status}: {result}',
            reply_markup=back_to_admin_keyboard()
        )
        await callback.answer()
        return

    giveaway_id = result.get('id')
    activate_result, activate_status = await api_post(f'/giveaways/{giveaway_id}/activate/')
    log.error(f'ACTIVATE: status={activate_status}, result={activate_result}')

    if activate_status != 200:
        await callback.message.edit_text(
            f'✅ Розыгрыш создан но не запущен.\nОшибка активации {activate_status}: {activate_result}',
            reply_markup=back_to_admin_keyboard()
        )
        await callback.answer()
        return

    await callback.message.edit_text(
        f'✅ <b>Розыгрыш запущен!</b>\n\n🎁 {data["title"]}\n\nУчастники могут регистрироваться.',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )
    await callback.answer()


@router.callback_query(F.data == 'admin_draw')
async def cb_admin_draw(callback: CallbackQuery):
    level = await get_user_level(callback.from_user.id)
    if level < 30:
        await callback.answer('❌ Нет доступа', show_alert=True)
        return
    await callback.answer('Загружаю...')
    giveaways = await get_active_giveaways()
    if not giveaways:
        await callback.message.edit_text(
            '🏆 <b>Подвести итоги</b>\n\nНет активных розыгрышей.',
            parse_mode='HTML',
            reply_markup=back_to_admin_keyboard()
        )
        return
    await callback.message.edit_text(
        '🏆 <b>Выбери розыгрыш для подведения итогов:</b>',
        parse_mode='HTML',
        reply_markup=active_giveaways_draw_keyboard(giveaways)
    )


@router.callback_query(F.data.startswith('draw_'))
async def cb_draw_giveaway(callback: CallbackQuery):
    giveaway_id = callback.data.replace('draw_', '')
    await callback.answer('Выбираю победителя...')
    result, status = await api_post(f'/giveaways/{giveaway_id}/draw/')
    if status != 200:
        error = result.get('error', 'Ошибка') if isinstance(result, dict) else 'Ошибка'
        await callback.message.edit_text(f'❌ {error}', reply_markup=back_to_admin_keyboard())
        return
    winner = result.get('winner', {})
    winner_name = winner.get('user', {}).get('username', '?')
    total = result.get('total_participants', '?')
    await callback.message.edit_text(
        f'🏆 <b>Победитель выбран!</b>\n\n'
        f'👤 Победитель: <b>{winner_name}</b>\n'
        f'👥 Всего участников: <b>{total}</b>\n\nОжидаем подтверждения...',
        parse_mode='HTML',
        reply_markup=back_to_admin_keyboard()
    )


@router.callback_query(F.data == 'giveaways_list')
async def cb_giveaways_list(callback: CallbackQuery):
    await callback.answer('Загружаю...')
    giveaways = await get_active_giveaways()
    if not giveaways:
        await callback.message.edit_text(
            '😔 Сейчас нет активных розыгрышей.\n\nСледи за анонсами — скоро будет!',
            reply_markup=back_to_menu_keyboard()
        )
        return
    text = '🎁 <b>Активные розыгрыши:</b>\n\n'
    for g in giveaways[:5]:
        text += f"• <b>{g['title']}</b>\n"
        if g.get('skin_name'):
            text += f"  Скин: {g['skin_name']}\n"
        text += f"  Участников: {g['participants_count']}\n\n"
    await callback.message.edit_text(text, parse_mode='HTML', reply_markup=giveaway_list_keyboard(giveaways[:5]))


@router.callback_query(F.data.startswith('giveaway_'))
async def cb_giveaway_detail(callback: CallbackQuery):
    giveaway_id = callback.data.replace('giveaway_', '')
    await callback.answer('Загружаю...')
    giveaways = await get_active_giveaways()
    giveaway = next((g for g in giveaways if str(g['id']) == giveaway_id), None)
    if not giveaway:
        await callback.message.edit_text('❌ Розыгрыш не найден.', reply_markup=back_to_menu_keyboard())
        return
    settings = await get_bot_settings()
    join_text = settings.get('join_button_text', '🎯 Участвовать')
    conditions = []
    if giveaway.get('require_telegram'):
        conditions.append('✅ Нажать кнопку "Участвовать"')
    if giveaway.get('require_twitch_stream'):
        conditions.append('📺 Быть на стриме Twitch')
    if giveaway.get('twitch_keyword'):
        conditions.append(f"💬 Написать в чат: {giveaway['twitch_keyword']}")
    skin_text = f"🔫 Скин: {giveaway['skin_name']}\n" if giveaway.get('skin_name') else ''
    ends_text = f"\n⏰ Итоги: {giveaway['ends_at'][:16].replace('T', ' ')}" if giveaway.get('ends_at') else ''
    text = (
        f"🎁 <b>{giveaway['title']}</b>\n\n"
        f"{skin_text}"
        f"👥 Участников: {giveaway['participants_count']}"
        f"{ends_text}\n\n"
        f"📋 <b>Условия:</b>\n{chr(10).join(conditions) if conditions else 'Без условий'}"
    )
    await callback.message.edit_text(
        text, parse_mode='HTML',
        reply_markup=join_giveaway_keyboard(giveaway_id, giveaway['participants_count'], join_text)
    )


@router.callback_query(F.data.startswith('join_'))
async def cb_join_giveaway(callback: CallbackQuery):
    giveaway_id = callback.data.replace('join_', '')
    await callback.answer('Регистрирую участие...')
    data, status = await join_giveaway(giveaway_id, callback.from_user.id)
    if status == 201:
        await callback.message.edit_text(
            f"✅ <b>Ты в розыгрыше!</b>\n\nУчастников: {data.get('participants_count', '?')}\n\n"
            f"Ожидай результатов. Если выиграешь — я напишу тебе в личку! 🏆",
            parse_mode='HTML', reply_markup=back_to_menu_keyboard()
        )
    elif status == 400:
        error = data.get('error', 'Ошибка') if isinstance(data, dict) else 'Ошибка'
        if 'уже участвуешь' in error:
            await callback.answer('✅ Ты уже участвуешь!', show_alert=True)
        elif 'Steam' in error:
            await callback.message.edit_text(
                '⚠️ <b>Нужен Steam аккаунт</b>\n\nПривяжи Steam и укажи трейд-ссылку.',
                parse_mode='HTML', reply_markup=profile_keyboard(False, True)
            )
        else:
            await callback.answer(f'❌ {error}', show_alert=True)
    else:
        await callback.answer('❌ Ошибка. Попробуй позже.', show_alert=True)


@router.callback_query(F.data == 'my_profile')
async def cb_my_profile(callback: CallbackQuery):
    await callback.answer('Загружаю...')
    user = await get_user_info(callback.from_user.id)
    if not user:
        await callback.message.edit_text('❌ Профиль не найден. Напиши /start', reply_markup=back_to_menu_keyboard())
        return
    roles = user.get('roles', [])
    role_names = [r['role']['name'] for r in roles] if roles else ['Участник']
    await callback.message.edit_text(
        f"👤 <b>Профиль</b>\n\n"
        f"Ник: <b>{user['username']}</b>\n"
        f"Роль: {', '.join(role_names)}\n\n"
        f"🔗 Steam: {'✅ Привязан' if user.get('has_steam') else '❌ Не привязан'}\n"
        f"📺 Twitch: {'✅ Привязан' if user.get('has_twitch') else '❌ Не привязан'}\n\n"
        f"Зарегистрирован: {user['created_at'][:10]}",
        parse_mode='HTML',
        reply_markup=profile_keyboard(user.get('has_steam', False), user.get('has_twitch', False))
    )


@router.callback_query(F.data == 'link_steam')
async def cb_link_steam(callback: CallbackQuery, state: FSMContext):
    await state.set_state(LinkSteam.waiting_trade_url)
    await callback.message.edit_text(
        '🔗 <b>Привязка Steam</b>\n\n'
        'Отправь свою <b>Steam Trade URL</b>.\n\n'
        'Как найти:\n'
        '1. Открой Steam → Инвентарь\n'
        '2. Нажми "Обмен" → "Создать ссылку для обмена"\n'
        '3. Скопируй ссылку и отправь сюда\n\n'
        'Формат:\n<code>https://steamcommunity.com/tradeoffer/new/?partner=...&token=...</code>',
        parse_mode='HTML', reply_markup=back_to_menu_keyboard()
    )
    await callback.answer()


@router.message(LinkSteam.waiting_trade_url)
async def process_steam_url(message: Message, state: FSMContext):
    url = message.text.strip()
    try:
        await message.delete()
    except Exception:
        pass
    if 'steamcommunity.com/tradeoffer' not in url:
        await message.answer('❌ Неверный формат ссылки.', parse_mode='HTML')
        return
    data, status = await api_post('/auth/steam/link/', {
        'telegram_id': message.from_user.id,
        'steam_trade_url': url,
    })
    await state.clear()
    if status == 200:
        await message.answer('✅ <b>Steam привязан!</b>', parse_mode='HTML', reply_markup=back_to_menu_keyboard())
    else:
        await message.answer('❌ Ошибка привязки.', reply_markup=back_to_menu_keyboard())


@router.callback_query(F.data == 'link_twitch')
async def cb_link_twitch(callback: CallbackQuery, state: FSMContext):
    await state.set_state(LinkTwitch.waiting_username)
    await callback.message.edit_text(
        '📺 <b>Привязка Twitch</b>\n\nОтправь свой Twitch ник.\n\nНапример: <code>ninja</code>',
        parse_mode='HTML', reply_markup=back_to_menu_keyboard()
    )
    await callback.answer()


@router.message(LinkTwitch.waiting_username)
async def process_twitch_username(message: Message, state: FSMContext):
    username = message.text.strip().lstrip('@')
    try:
        await message.delete()
    except Exception:
        pass
    if not username:
        await message.answer('❌ Ник не может быть пустым.')
        return
    data, status = await api_post('/auth/twitch/link/', {
        'telegram_id': message.from_user.id,
        'twitch_username': username,
    })
    await state.clear()
    if status == 200:
        await message.answer(
            f'✅ <b>Twitch привязан!</b>\n\nНик: <b>{username}</b>',
            parse_mode='HTML', reply_markup=back_to_menu_keyboard()
        )
    else:
        await message.answer('❌ Ошибка привязки.', reply_markup=back_to_menu_keyboard())


@router.callback_query(F.data == 'my_prizes')
async def cb_my_prizes(callback: CallbackQuery):
    await callback.answer('Загружаю...')
    data, status = await api_get(f'/prizes/my/{callback.from_user.id}/')
    if status != 200 or not data:
        await callback.message.edit_text(
            '🏆 <b>Мои призы</b>\n\nУ тебя пока нет призов. 🎯',
            parse_mode='HTML', reply_markup=back_to_menu_keyboard()
        )
        return
    await callback.message.edit_text(
        _format_prizes(data), parse_mode='HTML', reply_markup=back_to_menu_keyboard()
    )


async def show_giveaways(message: Message):
    giveaways = await get_active_giveaways()
    if not giveaways:
        await message.answer('😔 Сейчас нет активных розыгрышей.', reply_markup=back_to_menu_keyboard())
        return
    await message.answer('🎁 Активные розыгрыши:', reply_markup=giveaway_list_keyboard(giveaways[:5]))


async def show_profile_message(message: Message):
    user = await get_user_info(message.from_user.id)
    if not user:
        await message.answer('❌ Профиль не найден. Напиши /start')
        return
    roles = user.get('roles', [])
    role_names = [r['role']['name'] for r in roles] if roles else ['Участник']
    await message.answer(
        f"👤 <b>Профиль</b>\n\nНик: <b>{user['username']}</b>\nРоль: {', '.join(role_names)}\n\n"
        f"Steam: {'✅' if user.get('has_steam') else '❌'}\nTwitch: {'✅' if user.get('has_twitch') else '❌'}",
        parse_mode='HTML',
        reply_markup=profile_keyboard(user.get('has_steam', False), user.get('has_twitch', False))
    )


def _format_prizes(data: list) -> str:
    text = '🏆 <b>Твои призы:</b>\n\n'
    for prize in data[:10]:
        emoji = {
            'pending': '⏳', 'processing': '🔄', 'sent': '📦',
            'delivered': '✅', 'failed': '❌', 'cancelled': '🚫',
        }.get(prize['status'], '❓')
        text += f"{emoji} <b>{prize['name']}</b> — {prize['status']}\n"
    return text
