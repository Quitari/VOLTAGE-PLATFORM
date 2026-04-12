from django.contrib import admin
from .models import Prize


@admin.register(Prize)
class PrizeAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'recipient', 'status',
        'delivery_method', 'retry_count', 'created_at'
    )
    list_filter = ('status', 'delivery_method')
    search_fields = ('name', 'recipient__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'sent_at', 'delivered_at')