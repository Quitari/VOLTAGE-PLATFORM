from django.contrib import admin
from .models import BotSettings


@admin.register(BotSettings)
class BotSettingsAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'channel_username', 'updated_at')

    def has_add_permission(self, request):
        # Только одна запись настроек
        return not BotSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False