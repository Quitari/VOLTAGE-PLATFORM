from django.urls import path
from . import views

urlpatterns = [
    # Список и создание
    path('',
         views.giveaway_list,
         name='giveaway-list'),
    path('create/',
         views.giveaway_create,
         name='giveaway-create'),

    # Детали и редактирование
    path('<uuid:pk>/',
         views.giveaway_detail,
         name='giveaway-detail'),
    path('<uuid:pk>/update/',
         views.giveaway_update,
         name='giveaway-update'),

    # Управление
    path('<uuid:pk>/activate/',
         views.giveaway_activate,
         name='giveaway-activate'),
    path('<uuid:pk>/join/',
         views.giveaway_join,
         name='giveaway-join'),
    path('<uuid:pk>/draw/',
         views.giveaway_draw,
         name='giveaway-draw'),
    path('<uuid:pk>/reroll/',
         views.giveaway_reroll,
         name='giveaway-reroll'),
    path('<uuid:pk>/confirm-winner/',
         views.confirm_winner,
         name='giveaway-confirm-winner'),
    path('<uuid:pk>/participants/',
         views.giveaway_participants,
         name='giveaway-participants'),
]