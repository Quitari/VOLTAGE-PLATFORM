from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Role, Permission, UserRole


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('codename', 'name')


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ('id', 'name', 'codename', 'level', 'color', 'permissions')


class UserRoleSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = UserRole
        fields = ('role', 'assigned_at', 'expires_at', 'is_active')


class UserSerializer(serializers.ModelSerializer):
    """Полные данные пользователя — для /me и Admin"""
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'status',
            'telegram_id', 'telegram_username',
            'twitch_id', 'twitch_username',
            'steam_id', 'steam_trade_url',
            'has_telegram', 'has_twitch', 'has_steam',
            'created_at', 'roles', 'permissions'
        )
        read_only_fields = (
            'id', 'created_at',
            'has_telegram', 'has_twitch', 'has_steam'
        )

    def get_roles(self, obj):
        active_roles = obj.user_roles.filter(is_active=True)
        return UserRoleSerializer(active_roles, many=True).data

    def get_permissions(self, obj):
        """Собирает все разрешения из всех ролей пользователя"""
        perms = set()
        for user_role in obj.user_roles.filter(is_active=True):
            if not user_role.is_expired:
                for perm in user_role.role.permissions.all():
                    perms.add(perm.codename)
        # Плюс персональные разрешения
        for user_perm in obj.extra_permissions.all():
            perms.add(user_perm.permission.codename)
        return list(perms)


class UserPublicSerializer(serializers.ModelSerializer):
    """Публичные данные — для других пользователей"""
    class Meta:
        model = User
        fields = ('id', 'username', 'status', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    """Регистрация через email + пароль"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={'min_length': 'Пароль минимум 8 символов'}
    )
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Этот никнейм уже занят')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Этот email уже используется')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают'
            })
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        # Назначаем базовую роль Участник
        from .models import Role, UserRole
        try:
            member_role = Role.objects.get(codename='member')
            UserRole.objects.create(user=user, role=member_role)
        except Role.DoesNotExist:
            pass

        return user


class LoginSerializer(serializers.Serializer):
    """Вход через username/email + пароль"""
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        login = data.get('login')
        password = data.get('password')

        # Пробуем найти по username или email
        user = None

        # Сначала по username
        user = authenticate(username=login, password=password)

        # Если не нашли — пробуем по email
        if not user:
            try:
                user_obj = User.objects.get(email__iexact=login)
                user = authenticate(
                    username=user_obj.username,
                    password=password
                )
            except User.DoesNotExist:
                pass

        if not user:
            raise serializers.ValidationError(
                'Неверный логин или пароль'
            )

        if user.is_banned:
            raise serializers.ValidationError(
                'Аккаунт заблокирован'
            )

        data['user'] = user
        return data


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Обновление профиля пользователя"""
    class Meta:
        model = User
        fields = (
            'username', 'email',
            'steam_trade_url'
        )

    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.filter(
            username__iexact=value
        ).exclude(id=user.id).exists():
            raise serializers.ValidationError('Этот никнейм уже занят')
        return value

    def validate_email(self, value):
        user = self.context['request'].user
        if value and User.objects.filter(
            email__iexact=value
        ).exclude(id=user.id).exists():
            raise serializers.ValidationError('Этот email уже используется')
        return value