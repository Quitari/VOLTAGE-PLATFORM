from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # API
    path('api/auth/', include('apps.users.urls')),
]