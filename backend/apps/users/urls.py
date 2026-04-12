from django.urls import path
from . import views

urlpatterns = [
    # Авторизация
    path('register/',         views.register,          name='auth-register'),
    path('login/',            views.login,             name='auth-login'),
    path('logout/',           views.logout,            name='auth-logout'),
    path('me/',               views.me,                name='auth-me'),
    path('profile/',          views.update_profile,    name='auth-profile'),

    # Роли и права
    path('roles/',            views.get_roles,         name='auth-roles'),
    path('assign-role/',      views.assign_role,       name='auth-assign-role'),
    path('check-permission/', views.check_permission,  name='auth-check-permission'),
]