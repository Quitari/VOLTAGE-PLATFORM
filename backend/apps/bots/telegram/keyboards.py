from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder


def main_menu_keyboard():
    """Главное меню бота"""
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
    return builder.as_markup()


def join_giveaway_keyboard(giveaway_id: str, participants: int):
    """Кнопка участия в розыгрыше"""
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text=f'🎯 Участвовать ({participants})',
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
    """Список розыгрышей"""
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
    """Клавиатура профиля"""
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
    """Просто кнопка назад"""
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(
            text='🔙 Главное меню',
            callback_data='main_menu'
        )
    )
    return builder.as_markup()