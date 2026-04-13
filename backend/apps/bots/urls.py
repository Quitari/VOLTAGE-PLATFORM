from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.bot_settings, name='bot-settings'),
    path('settings/update/', views.bot_settings_update, name='bot-settings-update'),
]