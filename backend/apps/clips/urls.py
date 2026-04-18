from django.urls import path
from . import views

urlpatterns = [
    path('', views.clips_public, name='clips-public'),
    path('submit/', views.clip_submit, name='clip-submit'),
    path('admin/', views.clips_admin_list, name='clips-admin-list'),
    path('admin/create/', views.clip_create_admin, name='clip-create-admin'),
    path('admin/<int:clip_id>/moderate/', views.clip_moderate, name='clip-moderate'),
    path('admin/<int:clip_id>/delete/', views.clip_delete, name='clip-delete'),
]