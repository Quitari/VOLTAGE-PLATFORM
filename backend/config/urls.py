from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',       include('apps.users.urls')),
    path('api/giveaways/',  include('apps.giveaways.urls')),
    path('api/moderation/', include('apps.moderation.urls')),
    path('api/prizes/',     include('apps.prizes.urls')),
    path('api/bots/',       include('apps.bots.urls')),
]

# Media всегда, не только при DEBUG=True
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)