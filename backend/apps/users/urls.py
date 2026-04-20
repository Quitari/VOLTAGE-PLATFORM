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

    path('telegram/generate-token/', views.generate_link_token, name='generate-link-token'),
    path('telegram/link-by-token/', views.link_by_token, name='link-by-token'),

    path('unlink/', views.unlink_account, name='unlink-account'),
    path('change-password/', views.change_password, name='change-password'),
    path('users/<uuid:user_id>/', views.user_detail, name='user-detail'),
    path('admin-stats/', views.admin_dashboard_stats, name='admin-stats'),
    path('roles/create/', views.create_role, name='role-create'),
    path('roles/<int:role_id>/', views.update_role, name='role-update'),
    path('roles/<int:role_id>/delete/', views.delete_role, name='role-delete'),
    path('revoke-role/', views.revoke_role, name='role-revoke'),
    path('permissions/', views.get_permissions, name='permissions'),
    path('role-assignments/', views.role_assignments, name='role-assignments'),
]