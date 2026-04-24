# ⚡ VOLTAGE Platform

> **⚠️ Статус:** Проект находится в активной разработке. Ряд функций не завершён, production-деплой требует дополнительной настройки безопасности.

Самохостируемая open source платформа для стримеров на Twitch — упрощает взаимодействие с аудиторией, автоматизирует розыгрыши скинов CS2 и управляет сообществом через единую панель.

Платформа строится вокруг идеи, что стример не должен думать об организационных процессах во время трансляции — всё должно работать само.

---

## 🚀 Что умеет платформа

- **Розыгрыши скинов CS2** — создание, управление и автоматическое проведение розыгрышей через Telegram и Twitch одновременно
- **Единая админ-панель** — управление пользователями, ролями, наказаниями, призами и настройками из одного интерфейса
- **RBAC система** — гибкая иерархия ролей (Owner → Admin → Super Moderator → Moderator → Streamer → Участник) с настраиваемыми правами
- **Telegram бот** — участие в розыгрышах, уведомления о победах, привязка аккаунтов
- **Twitch бот** — интеграция с чатом стримера, участие через команды
- **Публичный сайт** — лендинг для зрителей с активными розыгрышами, победителями и расписанием стримов
- **Система модерации** — наказания, апелляции, тикеты, аудит-лог всех действий

---

## 🛠️ Стек технологий

| Компонент | Технология |
| --- | --- |
| Backend API | Python 3.11 + Django REST Framework |
| База данных | PostgreSQL 15 |
| Кэш / Очереди | Redis 7 + Celery |
| Telegram бот | Python + aiogram 3.27 |
| Twitch бот | Python + twitchio 3.2 |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Веб-сервер | Caddy (авто HTTPS) |
| Контейнеризация | Docker + Docker Compose |
| Аутентификация | JWT (djangorestframework-simplejwt) |

---

## 📁 Структура проекта

```
VOLTAGE-PLATFORM/
├── backend/
│   ├── apps/
│   │   ├── users/        # Пользователи, роли, права, RBAC
│   │   ├── giveaways/    # Розыгрыши — создание, участие, итоги
│   │   ├── prizes/       # Призы и статусы доставки
│   │   ├── moderation/   # Наказания, тикеты, апелляции, аудит
│   │   └── bots/         # Telegram бот, Twitch бот, настройки
│   ├── config/           # Настройки Django
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # React SPA — Dashboard + Admin Panel
├── caddy/                # Конфигурация reverse proxy
├── docker-compose.yml
└── .env.example
```

---

## 🖥️ Системные требования

| | Минимум | Рекомендуется |
| --- | --- | --- |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Диск | 30 GB SSD | 60 GB SSD |
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 / 24.04 LTS |

---

## 🚀 Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Quitari/VOLTAGE-PLATFORM.git
cd VOLTAGE-PLATFORM
```

### 2. Настроить окружение

```bash
cp .env.example .env
```

Заполни `.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=voltage
POSTGRES_USER=voltage_user
POSTGRES_PASSWORD=your-db-password
DATABASE_URL=postgresql://voltage_user:your-db-password@db:5432/voltage

REDIS_URL=redis://redis:6379/0

TELEGRAM_BOT_TOKEN=your-telegram-bot-token

TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_BOT_ID=your-bot-twitch-id
TWITCH_OWNER_ID=your-twitch-id
TWITCH_REDIRECT_URI=http://localhost:4343/oauth/callback

BOT_PASSWORD=your-bot-password
```

### 3. Запустить

```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py create_roles
docker compose exec backend python manage.py createsuperuser
```

### 4. Фронтенд (dev режим)

```bash
cd frontend
npm install
npm run dev
```

Открой: **http://localhost:5173**

---

## 🌍 Деплой на VPS

```bash
# Клонировать и настроить
git clone https://github.com/Quitari/VOLTAGE-PLATFORM.git
cd VOLTAGE-PLATFORM
cp .env.example .env
# Заполнить .env production-значениями (DEBUG=False, домен и т.д.)

# Запустить
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py create_roles
docker compose exec backend python manage.py createsuperuser
```

Caddy автоматически получит TLS-сертификат если настроен домен.

---

## 🤖 Настройка ботов

### Telegram

1. Создай бота через [@BotFather](https://t.me/BotFather)
2. Скопируй токен в `.env` → `TELEGRAM_BOT_TOKEN`
3. После запуска напиши `/start` боту — аккаунт создастся автоматически

Назначь Owner:

```bash
docker compose exec backend python manage.py shell -c "
from apps.users.models import User, Role, UserRole
user = User.objects.get(telegram_id=YOUR_TELEGRAM_ID)
role = Role.objects.get(codename='owner')
UserRole.objects.get_or_create(user=user, role=role)
print('Owner назначен:', user.username)
"
```

### Twitch

1. Зарегистрируй приложение на [dev.twitch.tv/console](https://dev.twitch.tv/console)
2. OAuth Redirect URL: `https://twitch.YOUR_DOMAIN/oauth/callback`
3. Скопируй Client ID и Client Secret в `.env`
4. Открой `https://twitch.YOUR_DOMAIN/oauth` и авторизуй два аккаунта: бота и стримера

---

## 📊 Роли и права доступа

| Роль | Уровень | Описание |
| --- | --- | --- |
| Owner | 999 | Полный доступ, системная роль |
| Admin | 100 | Полное управление платформой |
| Super Moderator | 75 | Расширенная модерация + апелляции |
| Moderator | 50 | Модерация чата и наказания |
| Streamer | 30 | Управление контентом |
| Участник | 0 | Базовая роль (выдаётся автоматически) |

---

## 🔧 Полезные команды

```bash
# Логи
docker compose logs -f backend
docker compose logs -f telegram_bot
docker compose logs -f twitch_bot

# Перезапуск
docker compose restart backend

# Django shell
docker compose exec backend python manage.py shell

# БД
docker compose exec db psql -U voltage_user -d voltage

# Обновление
git pull origin main
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

---

## 🗺️ Roadmap

- [x] Backend REST API (Django REST Framework)
- [x] RBAC — роли, права, назначение через UI
- [x] Розыгрыши — полный цикл (создание → участие → итоги → приз)
- [x] Система модерации (наказания, апелляции, тикеты, аудит-лог)
- [x] Telegram бот (участие, привязка аккаунтов, уведомления)
- [x] Twitch бот (интеграция с чатом)
- [x] React Admin Panel (управление всем из браузера)
- [x] Dashboard для участников
- [ ] Celery-задачи (авто-проведение розыгрышей, снятие наказаний)
- [ ] LisSkins / CS Market интеграция (автоматическая отправка скинов)
- [ ] Steam OAuth
- [ ] Twitch OAuth (вместо ручной привязки)
- [ ] Система уведомлений
- [ ] Telegram Mini App
- [ ] OBS Overlay

---

## 📝 Лицензия

MIT License — используй, форкай, адаптируй под себя.

---

*VOLTAGE Platform — open source инструмент для стримеров*