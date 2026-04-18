from django.urls import path
from . import views

urlpatterns = [
    # Наказания
    path('punishments/',
         views.punishment_list,
         name='punishment-list'),
    path('users/<uuid:user_id>/punish/',
         views.punish_user,
         name='punish-user'),
    path('punishments/<uuid:punishment_id>/revoke/',
         views.revoke_punishment,
         name='revoke-punishment'),
    path('punishments/<uuid:punishment_id>/appeal/',
         views.create_appeal,
         name='create-appeal'),

    # Апелляции
    path('appeals/',
         views.appeal_list,
         name='appeal-list'),
    path('appeals/<uuid:appeal_id>/resolve/',
         views.resolve_appeal,
         name='resolve-appeal'),

    # Тикеты
    path('tickets/',
         views.ticket_list_create,
         name='ticket-list-create'),
    path('tickets/<uuid:ticket_id>/',
         views.ticket_detail,
         name='ticket-detail'),
    path('tickets/<uuid:ticket_id>/reply/',
         views.ticket_reply,
         name='ticket-reply'),
    path('tickets/<uuid:ticket_id>/close/',
         views.ticket_close,
         name='ticket-close'),

    # Аудит
    path('audit/',
         views.audit_log_list,
         name='audit-log-list'),

     path('my/', views.my_punishments, name='my-punishments'),
]