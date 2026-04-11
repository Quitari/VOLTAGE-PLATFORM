from django.core.management.base import BaseCommand
from apps.users.models import Role, Permission


class Command(BaseCommand):
    help = 'Создаёт базовые системные роли и разрешения'

    def handle(self, *args, **options):
        self.stdout.write('Создание разрешений...')
        self._create_permissions()

        self.stdout.write('Создание ролей...')
        self._create_roles()

        self.stdout.write(
            self.style.SUCCESS('Базовые роли и разрешения созданы.')
        )

    def _create_permissions(self):
        permissions = [
            # Пользователи
            ('users.view',   'Просмотр пользователей'),
            ('users.edit',   'Редактирование пользователей'),
            ('users.ban',    'Блокировка пользователей'),
            # Розыгрыши
            ('giveaways.view',   'Просмотр розыгрышей'),
            ('giveaways.create', 'Создание розыгрышей'),
            ('giveaways.edit',   'Редактирование розыгрышей'),
            ('giveaways.delete', 'Удаление розыгрышей'),
            ('giveaways.draw',   'Подведение итогов'),
            # Призы
            ('prizes.view',   'Просмотр призов'),
            ('prizes.manage', 'Управление доставкой'),
            # Модерация
            ('moderation.view',    'Просмотр наказаний'),
            ('moderation.punish',  'Выдача наказаний'),
            ('moderation.revoke',  'Отмена наказаний'),
            ('appeals.view',       'Просмотр апелляций'),
            ('appeals.resolve',    'Рассмотрение апелляций'),
            ('tickets.view',       'Просмотр тикетов'),
            ('tickets.resolve',    'Закрытие тикетов'),
            # Платформа
            ('settings.view',   'Просмотр настроек'),
            ('settings.edit',   'Изменение настроек'),
            ('roles.view',      'Просмотр ролей'),
            ('roles.manage',    'Управление ролями'),
            ('logs.view',       'Просмотр журнала аудита'),
            # Контент
            ('content.schedule', 'Управление расписанием'),
            ('content.moments',  'Управление моментами'),
            ('commands.manage',  'Управление командами Twitch'),
        ]

        for codename, name in permissions:
            obj, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={'name': name}
            )
            if created:
                self.stdout.write(f'  + Разрешение: {codename}')

    def _create_roles(self):
        all_perms = list(Permission.objects.all())

        def get_perms(*codenames):
            return Permission.objects.filter(codename__in=codenames)

        roles = [
            {
                'name': 'Owner',
                'codename': 'owner',
                'level': 999,
                'color': '#FF4444',
                'is_system': True,
                'description': 'Полный доступ. Защищён от удаления.',
                'permissions': all_perms,
            },
            {
                'name': 'Admin',
                'codename': 'admin',
                'level': 100,
                'color': '#FF8C00',
                'is_system': True,
                'description': 'Административный доступ.',
                'permissions': all_perms,
            },
            {
                'name': 'Super Moderator',
                'codename': 'super_moderator',
                'level': 75,
                'color': '#FFE100',
                'is_system': True,
                'description': 'Расширенная модерация.',
                'permissions': get_perms(
                    'users.view', 'users.edit', 'users.ban',
                    'giveaways.view', 'giveaways.create',
                    'giveaways.edit', 'giveaways.draw',
                    'prizes.view', 'prizes.manage',
                    'moderation.view', 'moderation.punish', 'moderation.revoke',
                    'appeals.view', 'appeals.resolve',
                    'tickets.view', 'tickets.resolve',
                    'logs.view',
                ),
            },
            {
                'name': 'Moderator',
                'codename': 'moderator',
                'level': 50,
                'color': '#4A9EFF',
                'is_system': True,
                'description': 'Модерация сообщества.',
                'permissions': get_perms(
                    'users.view',
                    'moderation.view', 'moderation.punish', 'moderation.revoke',
                    'appeals.view', 'appeals.resolve',
                    'tickets.view', 'tickets.resolve',
                ),
            },
            {
                'name': 'Streamer',
                'codename': 'streamer',
                'level': 30,
                'color': '#9146FF',
                'is_system': True,
                'description': 'Управление контентом и розыгрышами.',
                'permissions': get_perms(
                    'giveaways.view', 'giveaways.create',
                    'giveaways.edit', 'giveaways.draw',
                    'prizes.view', 'prizes.manage',
                    'content.schedule', 'content.moments',
                    'commands.manage', 'settings.view',
                ),
            },
            {
                'name': 'Участник',
                'codename': 'member',
                'level': 0,
                'color': '#AAAAAA',
                'is_system': True,
                'description': 'Базовая роль для всех пользователей.',
                'permissions': [],
            },
        ]

        for role_data in roles:
            permissions = role_data.pop('permissions')
            role, created = Role.objects.get_or_create(
                codename=role_data['codename'],
                defaults=role_data
            )
            if created:
                role.permissions.set(permissions)
                self.stdout.write(
                    self.style.SUCCESS(f'  + Роль: {role.name} (уровень {role.level})')
                )
            else:
                self.stdout.write(f'  ~ Роль уже существует: {role.name}')