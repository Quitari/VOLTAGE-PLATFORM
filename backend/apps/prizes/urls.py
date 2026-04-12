from django.urls import path
from . import views

urlpatterns = [
    path('my/<int:telegram_id>/', views.my_prizes, name='my-prizes'),
]