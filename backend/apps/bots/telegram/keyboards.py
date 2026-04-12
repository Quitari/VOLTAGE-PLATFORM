from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder


# ─── Главное меню (динамическое) ──────────────────────────────────────────

def main_menu_keyboard(user_level: int = 0):
    """
    Главное меню — кнопка управления появляется если уровень >= 30
    """
    builder = InlineKeyboardBuilder()

    builder.row(
        InlineKeyboardButton(
            text='🎁 Активные розыгрыши',
            callback_data='giveaways_list'
        )
    )
    builder.row(
        InlineKeyboardButton(
            text='👤 Мой профиль',
            callback_data='my_profile'
        ),
        InlineKeyboardButton(
            text='🏆 Мои призы',
            callback_data='my_prizes'
        )
    )
    builder.row(
        InlineKeyboardButton(
            text='🔗 Привязать Steam',
            callback_data='link_steam'
        ),
        InlineKeyboardButton(
            text='📺 Привязать Twitch',
            callback_data='link_twitch'
        )
    )

    # Кнопка управления — только для Streamer+ (уровень >= 30)
    if user_level >= 30:
        builder.row(
            InlineKeyboardButton(
                text='⚙️ Управление платформой',
                callback_data='admin_panel'
            )
        )

    return builder.as_markup()


# ─── Админ панель (по уровням) ────────────────────────────────────────────

def admin_panel_keyboard(user_level: int):
    """Кнопки управления в зависимости от уровня доступа"""
    builder = InlineKeyboardBuilder()

    if user_level >= 30:
        builder.row(
            InlineKeyboardButton(
                text='🎁 Создать розыгрыш',
                callback_data='admin_create_giveaway',
                style='success'
            )
        )
        builder.row(
            InlineKeyboardButton(
                text='🏆 Подвести итоги',
                callback_data='admin_draw',
                style='primary'
            ),
            InlineKeyboardButton(
                text='📊 Статистика',
                callback_data='admin_stats'
            )
        )

    if user_level >= 50:
        builder.row(
            InlineKeyboardButton(
                text='⚠️ Последние нарушения',
                callback_data='admin_punishments',
                style='danger'
            ),
            InlineKeyboardButton(
                text='📋 Тикеты',
                callback_data='admin_tickets'
            )
        )

    if user_level >= 100:
        builder.row(
            InlineKeyboardButton(
                text='👥 Пользователи',
                callback_data='admin_users'
            ),
            InlineKeyboardButton(
                text='📜 Журнал аудита',
                callback_data='admin_audit'
            )
        )
        builder.row(
            InlineKeyboardButton(
                text='🤖 Статус платформы',
                callback_data='admin_status',
                style='primary'
            )
        )

    builder.row(
        InlineKeyboardButton(
            text='🔙 Главное меню',
            callback_data='main_menu'
        )
    )

    return builder.as_markup()


# ─── Быстрое создание розыгрыша ───────────────────────────────────────────

def quick_giveaway_keyboard():
    """Тип приза для быстрого розыгрыша"""
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text='🔫 Скин CS2',
            callback_data='qg_type_skin'
        ),
        InlineKeyboardButton(
            text='🎁 Другое',
            callback_data='qg_type_other'
        )
    )
    builder.row(
        InlineKeyboardButton(
            text='❌ Отмена',
            callback_data='admin_panel'
        )
    )
    return builder.as_markup()


def quick_giveaway_platform_keyboard():
    """Платформа для быстрого розыгрыша"""
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text='📱 Telegram',
            callback_data='qg_platform_telegram'
        ),
        InlineKeyboardButton(
            text='📺 Twitch',
            callback_data='qg_platform_twitch'
        ),
        InlineKeyboardButton(
            text='🌐 Оба',
            callback_data='qg_platform_both'
        )
    )
    builder.row(
        InlineKeyboardButton(
            text='❌ Отмена',
            callback_data='admin_panel'
        )
    )
    return builder.as_markup()


def confirm_giveaway_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text='✅ Запустить',
            callback_data='qg_confirm',
            style='success'
        ),
        InlineKeyboardButton(
            text='❌ Отмена',
            callback_data='admin_panel',
            style='danger'
        )
    )
    return builder.as_markup()


def active_giveaways_draw_keyboard(giveaways: list):
    """Список активных розыгрышей для подведения итогов"""
    builder = InlineKeyboardBuilder()
    for g in giveaways[:5]:
        builder.row(
            InlineKeyboardButton(
                text=f"🏆 {g['title']} ({g['participants_count']} уч.)",
                callback_data=f"draw_{g['id']}"
            )
        )
    builder.row(
        InlineKeyboardButton(
            text='🔙 Назад',
            callback_data='admin_panel'
        )
    )
    return builder.as_markup()


# ─── Остальные клавиатуры ─────────────────────────────────────────────────

def join_giveaway_keyboard(giveaway_id: str, participants: int,
                           join_text: str = '🎯 Участвовать'):
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text=f'{join_text} ({participants})',
            callback_data=f'join_{giveaway_id}'
        )
    )
    builder.row(
        InlineKeyboardButton(
            text='📋 Условия участия',
            callback_data=f'conditions_{giveaway_id}'
        )
    )
    return builder.as_markup()


def giveaway_list_keyboard(giveaways: list):
    builder = InlineKeyboardBuilder()
    for g in giveaways:
        builder.row(
            InlineKeyboardButton(
                text=f"🎁 {g['title']}",
                callback_data=f"giveaway_{g['id']}"
            )
        )
    builder.row(
        InlineKeyboardButton(
            text='🔙 Главное меню',
            callback_data='main_menu'
        )
    )
    return builder.as_markup()


def profile_keyboard(has_steam: bool, has_twitch: bool):
    builder = InlineKeyboardBuilder()
    if not has_steam:
        builder.row(
            InlineKeyboardButton(
                text='🔗 Привязать Steam',
                callback_data='link_steam'
            )
        )
    if not has_twitch:
        builder.row(
            InlineKeyboardButton(
                text='📺 Привязать Twitch',
                callback_data='link_twitch'
            )
        )
    builder.row(
        InlineKeyboardButton(
            text='🔙 Главное меню',
            callback_data='main_menu'
        )
    )
    return builder.as_markup()


def back_to_menu_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text='🔙 Главное меню',
            callback_data='main_menu'
        )
    )
    return builder.as_markup()


def back_to_admin_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text='🔙 Назад',
            callback_data='admin_panel'
        )
    )
    return builder.as_markup()