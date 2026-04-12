from rest_framework import serializers
from .models import Punishment, Appeal, Ticket, TicketMessage, AuditLog
from apps.users.serializers import UserPublicSerializer


class PunishmentSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    issued_by = UserPublicSerializer(read_only=True)
    revoked_by = UserPublicSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Punishment
        fields = '__all__'


class PunishmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Punishment
        fields = (
            'punishment_type', 'platform',
            'reason', 'expires_at'
        )

    def validate_expires_at(self, value):
        if value:
            from django.utils import timezone
            if value <= timezone.now():
                raise serializers.ValidationError(
                    'Время истечения должно быть в будущем'
                )
        return value


class AppealSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True)
    punishment = PunishmentSerializer(read_only=True)

    class Meta:
        model = Appeal
        fields = '__all__'


class AppealCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appeal
        fields = ('text',)


class TicketMessageSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = TicketMessage
        fields = ('id', 'author', 'text', 'is_staff', 'created_at')


class TicketSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    assigned_to = UserPublicSerializer(read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'


class TicketCreateSerializer(serializers.ModelSerializer):
    first_message = serializers.CharField(write_only=True)

    class Meta:
        model = Ticket
        fields = ('subject', 'category', 'first_message')

    def create(self, validated_data):
        first_message = validated_data.pop('first_message')
        user = self.context['request'].user
        ticket = Ticket.objects.create(user=user, **validated_data)
        TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            text=first_message,
            is_staff=False
        )
        return ticket


class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserPublicSerializer(read_only=True)
    target_user = UserPublicSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'