from rest_framework import serializers
from .models import Giveaway, Participant, Winner
from apps.users.serializers import UserPublicSerializer

class WinnerSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Winner
        fields = (
            'id', 'user', 'status',
            'twitch_username_provided', 'twitch_verified',
            'reroll_count', 'drawn_at', 'confirmed_at'
        )

class GiveawayListSerializer(serializers.ModelSerializer):
    """Краткая версия — для списка розыгрышей"""
    participants_count = serializers.IntegerField(read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    winners = WinnerSerializer(many=True, read_only=True)
    is_participant = serializers.SerializerMethodField()

    def get_is_participant(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.participants.filter(user=request.user).exists()

    class Meta:
        model = Giveaway
        fields = (
            'id', 'title', 'prize_type', 'skin_name',
            'skin_image_url', 'platform', 'status',
            'participants_count', 'starts_at', 'ends_at',
            'created_by', 'created_at', 'winners', 'is_participant'
        )

class GiveawayDetailSerializer(serializers.ModelSerializer):
    """Полная версия — для детальной страницы"""
    participants_count = serializers.IntegerField(read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    can_participate = serializers.BooleanField(read_only=True)

    class Meta:
        model = Giveaway
        fields = '__all__'


class GiveawayCreateSerializer(serializers.ModelSerializer):
    """Создание розыгрыша"""

    class Meta:
        model = Giveaway
        fields = (
            'title', 'description', 'prize_type',
            'skin_name', 'skin_max_price', 'skin_image_url',
            'platform', 'telegram_post_text',
            'require_telegram', 'require_twitch_stream',
            'twitch_keyword', 'auto_check_twitch',
            'winner_response_timeout',
            'starts_at', 'ends_at', 'draw_manually',
        )

    def validate(self, data):
        # Если указано ключевое слово — платформа должна включать Twitch
        if data.get('twitch_keyword') and data.get('platform') == 'telegram':
            raise serializers.ValidationError({
                'twitch_keyword': 'Ключевое слово работает только с Twitch'
            })

        # Время окончания должно быть позже начала
        starts = data.get('starts_at')
        ends = data.get('ends_at')
        if starts and ends and ends <= starts:
            raise serializers.ValidationError({
                'ends_at': 'Время окончания должно быть позже начала'
            })

        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        validated_data['status'] = Giveaway.Status.DRAFT
        return super().create(validated_data)


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Participant
        fields = ('id', 'user', 'source', 'joined_at')