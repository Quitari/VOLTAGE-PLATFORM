from django.contrib import admin
from .models import Giveaway, Participant, Winner


@admin.register(Giveaway)
class GiveawayAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'platform', 'status',
        'participants_count', 'starts_at', 'ends_at', 'created_by'
    )
    list_filter = ('status', 'platform', 'prize_type')
    search_fields = ('title', 'skin_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'participants_count')


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'giveaway', 'source', 'is_active', 'joined_at')
    list_filter = ('source', 'is_active')
    search_fields = ('user__username', 'giveaway__title')
    ordering = ('-joined_at',)


@admin.register(Winner)
class WinnerAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'giveaway', 'status',
        'twitch_verified', 'reroll_count', 'drawn_at'
    )
    list_filter = ('status', 'twitch_verified')
    search_fields = ('user__username', 'giveaway__title')
    ordering = ('-drawn_at',)