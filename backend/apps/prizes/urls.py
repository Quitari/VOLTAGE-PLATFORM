from django.urls import path
from . import views

urlpatterns = [
    path('my/<int:telegram_id>/', views.my_prizes, name='my-prizes'),
    path('list/', views.prize_list, name='prize-list'),
]