import os
from django.core.management.base import BaseCommand
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = 'Первоначальная настройка платформы VOLTAGE'

    def handle(self, *args, **kwargs):
        from apps.users.models import User, Role, UserRole

        self.stdout.write('\n⚡ VOLTAGE Platform — первоначальная настройка\n')
        self.stdout.write('=' * 50 + '\n')

        # ─── Шаг 1: Создаём Owner ─────────────────────────
        self.stdout.write('\n📋 Шаг 1: Создание аккаунта владельца\n')

        if User.objects.filter(
            user_roles__role__codename='owner'
        ).exists():
            self.stdout.write(self.style.WARNING(
                '⚠️  Owner уже существует. Пропускаем.'
            ))
        else:
            username = input('Логин администратора [admin]: ').strip() or 'admin'
            while True:
                password = input('Пароль: ').strip()
                if not password:
                    self.stdout.write('❌ Пароль не может быть пустым')
                    continue
                try:
                    validate_password(password)
                    break
                except ValidationError as e:
                    self.stdout.write(f'❌ {", ".join(e.messages)}')

            user, created = User.objects.get_or_create(
                username=username,
                defaults={'status': 'active', 'is_staff': True, 'is_superuser': True}
            )
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()

            role = Role.objects.get(codename='owner')
            UserRole.objects.get_or_create(user=user, role=role)

            self.stdout.write(self.style.SUCCESS(
                f'✅ Owner создан: {username}'
            ))

        # ─── Шаг 2: Telegram привязка ──────────────────────
        self.stdout.write('\n📋 Шаг 2: Привязка Telegram\n')

        owner_telegram_id = os.getenv('OWNER_TELEGRAM_ID', '').strip()

        if owner_telegram_id:
            self.stdout.write(f'Найден OWNER_TELEGRAM_ID={owner_telegram_id} в .env')
            try:
                owner = User.objects.filter(
                    user_roles__role__codename='owner'
                ).first()

                if owner:
                    # Удаляем старый tg_ аккаунт если есть
                    old = User.objects.filter(
                        telegram_id=int(owner_telegram_id)
                    ).exclude(pk=owner.pk).first()
                    if old and old.username.startswith('tg_'):
                        old.delete()
                        self.stdout.write('🗑️  Удалён старый tg_ аккаунт')

                    owner.telegram_id = int(owner_telegram_id)
                    owner.save()
                    self.stdout.write(self.style.SUCCESS(
                        f'✅ Telegram привязан к {owner.username}'
                    ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Ошибка: {e}'))
        else:
            self.stdout.write(
                '⏭️  OWNER_TELEGRAM_ID не указан в .env\n'
                '   Привяжи позже через бота командой /link КОД\n'
                '   или добавь OWNER_TELEGRAM_ID в .env и запусти setup снова'
            )

        # ─── Шаг 3: Бот-пользователь ───────────────────────
        self.stdout.write('\n📋 Шаг 3: Создание системного пользователя\n')

        bot_password = os.getenv('BOT_PASSWORD', '').strip()
        if not bot_password:
            self.stdout.write(self.style.WARNING(
                '⚠️  BOT_PASSWORD не указан в .env. Пропускаем.'
            ))
        else:
            bot, created = User.objects.get_or_create(
                username='voltage_bot',
                defaults={'status': 'active'}
            )
            bot.set_password(bot_password)
            bot.save()

            streamer_role = Role.objects.get(codename='streamer')
            UserRole.objects.get_or_create(user=bot, role=streamer_role)

            self.stdout.write(self.style.SUCCESS(
                f'✅ voltage_bot {"создан" if created else "обновлён"}'
            ))

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS(
            '\n🚀 Настройка завершена! Платформа готова к работе.\n'
        ))