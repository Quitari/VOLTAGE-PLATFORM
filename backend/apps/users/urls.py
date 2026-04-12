from django.urls import path
from . import views

urlpatterns = [
    # Авторизация
    path('register/',         views.register,           name='auth-register'),
    path('login/',            views.login,              name='auth-login'),
    path('logout/',           views.logout,             name='auth-logout'),
    path('me/',               views.me,                 name='auth-me'),
    path('profile/',          views.update_profile,     name='auth-profile'),

    # Роли и права
    path('roles/',            views.get_roles,          name='auth-roles'),
    path('assign-role/',      views.assign_role,        name='auth-assign-role'),
    path('check-permission/', views.check_permission,   name='auth-check-permission'),

    # Telegram бот
    path('telegram/link/',            views.telegram_link,     name='telegram-link'),
    path('telegram/user/<int:telegram_id>/', views.telegram_get_user, name='telegram-get-user'),
    path('steam/link/',               views.steam_link,        name='steam-link'),
    path('twitch/link/', views.twitch_link, name='twitch-link'),

    path('list/', views.user_list, name='user-list'),
]