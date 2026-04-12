from django.contrib import admin
from .models import Punishment, Appeal, Ticket, TicketMessage, AuditLog


@admin.register(Punishment)
class PunishmentAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'punishment_type', 'platform',
        'status', 'reason', 'issued_by',
        'issued_at', 'expires_at'
    )
    list_filter = ('punishment_type', 'platform', 'status', 'ai_detected')
    search_fields = ('user__username', 'reason')
    ordering = ('-issued_at',)
    readonly_fields = ('issued_at',)


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'status', 'punishment',
        'reviewed_by', 'created_at'
    )
    list_filter = ('status',)
    search_fields = ('user__username', 'text')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        'subject', 'user', 'category',
        'status', 'assigned_to', 'created_at'
    )
    list_filter = ('status', 'category')
    search_fields = ('subject', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'author', 'is_staff', 'created_at')
    list_filter = ('is_staff',)
    ordering = ('-created_at',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'actor', 'action', 'target_user',
        'ip_address', 'created_at'
    )
    list_filter = ('action',)
    search_fields = ('actor__username', 'target_user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False