from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.bot_settings, name='bot-settings'),
    path('settings/update/', views.bot_settings_update, name='bot-settings-update'),
    path('commands/', views.twitch_commands_list, name='twitch-commands'),
    path('commands/create/', views.twitch_command_create, name='twitch-command-create'),
    path('commands/<int:cmd_id>/', views.twitch_command_detail, name='twitch-command-detail'),
    path('commands/public/', views.twitch_commands_public, name='twitch-commands-public'),
    path('twitch/stats/', views.twitch_stats_update, name='twitch-stats-update'),
    path('twitch/stats/<str:twitch_login>/', views.twitch_stats_get, name='twitch-stats-get'),
    path('avatar/upload/', views.upload_avatar, name='upload-avatar'),
]
