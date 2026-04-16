# ⚡ VOLTAGE Platform

Самохостируемая плптформа для управления компанентами () платформа для розыгрышей скинов CS2 и управления сообществом.

---

## 🌐 Домены

| Сервис                | URL                                        |
| --------------------- | ------------------------------------------ |
| Публичный сайт        | `https://examle.com`                       |
| Панель управления     | `https://admin.examle.comu`                |
| API                   | `https://api.examle.com`                   |
| Twitch OAuth callback | `https://twitch.examle.com/oauth/callback` |
| Telegram Mini App     | `https://app.examle.com`                   |

---

## 🖥️ Системные требования

### Минимальные

- **CPU:** 1 vCPU
- **RAM:** 2 GB
- **Диск:** 30 GB SSD
- **ОС:** Ubuntu 22.04 / 24.04 LTS
- **Сеть:** 10 Мбит/с

### Рекомендуемые

- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Диск:** 60 GB SSD
- **ОС:** Ubuntu 22.04 / 24.04 LTS
- **Сеть:** 100 Мбит/с+

---

## 🛠️ Стек технологий

| Компонент       | Технология                                  |
| --------------- | ------------------------------------------- |
| Backend API     | Python 3.11 + Django REST Framework         |
| База данных     | PostgreSQL 15                               |
| Кэш / Очереди   | Redis 7 + Celery                            |
| Telegram бот    | Python + aiogram 3.27                       |
| Twitch бот      | Python + twitchio 3.2                       |
| Frontend        | React 18 + TypeScript + Vite + Tailwind CSS |
| Веб-сервер      | Caddy (авто HTTPS)                          |
| Контейнеризация | Docker + Docker Compose                     |

---

## 📁 Структура проекта

```
VOLTAGE-PLATFORM/
├── backend/
│   ├── apps/
│   │   ├── users/        # Пользователи, роли, права
│   │   ├── giveaways/    # Розыгрыши
│   │   ├── prizes/       # Призы и доставка
│   │   ├── moderation/   # Наказания, тикеты, апелляции
│   │   └── bots/         # Telegram бот, Twitch бот, GSI
│   ├── config/           # Настройки Django
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # React приложение
├── caddy/                # Конфигурация Caddy
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env
```

---

## 🚀 Быстрый старт (локальная разработка)

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Quitari/VOLTAGE-PLATFORM.git
cd VOLTAGE-PLATFORM
```

### 2. Создать `.env` файл

```bash
cp .env.example .env
```

Заполни переменные в `.env`:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# База данных
POSTGRES_DB=voltage
POSTGRES_USER=voltage_user
POSTGRES_PASSWORD=your-db-password
DATABASE_URL=postgresql://voltage_user:your-db-password@db:5432/voltage

# Redis
REDIS_URL=redis://redis:6379/0

# Telegram бот
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Twitch бот
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_BOT_ID=your-bot-twitch-id
TWITCH_OWNER_ID=your-twitch-id
TWITCH_REDIRECT_URI=http://localhost:4343/oauth/callback

# Бот-пользователь для API
BOT_PASSWORD=your-bot-password
```

### 3. Запустить контейнеры

```bash
docker compose up -d
```

### 4. Применить миграции и настроить платформу

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py create_roles
docker compose exec backend python manage.py setup
```

### 5. Создать бот-пользователя

```bash
docker compose exec backend python manage.py shell -c "
from apps.users.models import User, Role, UserRole
bot_user, _ = User.objects.get_or_create(
    username='voltage_bot',
    defaults={'email': None, 'status': 'active'}
)
bot_user.set_password('YOUR_BOT_PASSWORD')
bot_user.save()
role = Role.objects.get(codename='streamer')
UserRole.objects.get_or_create(user=bot_user, role=role)
print('Готово')
"
```

### 6. Запустить фронтенд

```bash
cd frontend
npm install
npm run dev
```

Открой браузер: **http://localhost:5173**

---

## 🌍 Деплой на VPS

### Требования к серверу

- Ubuntu 22.04 или 24.04
- Docker + Docker Compose
- Домен направленный на IP сервера

### 1. Подключиться к серверу

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Установить Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### 3. Клонировать репозиторий

```bash
git clone https://github.com/Quitari/VOLTAGE-PLATFORM.git
cd VOLTAGE-PLATFORM
```

### 4. Создать `.env` для production

```bash
cp .env.example .env
nano .env
```

Измени на production значения:

```env
DEBUG=False
ALLOWED_HOSTS=quitari.ru,admin.quitari.ru,api.quitari.ru
DOMAIN=quitari.ru
TWITCH_REDIRECT_URI=https://twitch.quitari.ru/oauth/callback
```

### 5. Настроить DNS

Добавь A-записи в DNS панели:

```
@           →  YOUR_SERVER_IP
admin       →  YOUR_SERVER_IP
api         →  YOUR_SERVER_IP
twitch      →  YOUR_SERVER_IP
app         →  YOUR_SERVER_IP
```

### 6. Собрать и запустить

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 7. Применить миграции

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py create_roles
docker compose exec backend python manage.py createsuperuser
```

---

## 🤖 Настройка Telegram бота

### 1. Создать бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь `/newbot`
3. Укажи название и username бота
4. Скопируй токен в `.env` → `TELEGRAM_BOT_TOKEN`

### 2. Авторизовать администратора

После запуска напиши `/start` боту — аккаунт создастся автоматически.

Назначь роль Owner:

```bash
docker compose exec backend python manage.py shell -c "
from apps.users.models import User, Role, UserRole
# Замени YOUR_TELEGRAM_ID на свой Telegram ID
user = User.objects.get(telegram_id=YOUR_TELEGRAM_ID)
role = Role.objects.get(codename='owner')
UserRole.objects.get_or_create(user=user, role=role)
print('Owner назначен:', user.username)
"
```

---

## 🎮 Настройка Twitch бота

### 1. Создать приложение на Twitch

1. Зайди на [dev.twitch.tv/console](https://dev.twitch.tv/console)
2. Нажми **Register Your Application**
3. Заполни:
   - **Name:** LarkinBot (или любое)
   - **OAuth Redirect URL:** `https://twitch.quitari.ru/oauth/callback`
   - **Category:** Chat Bot
4. Скопируй **Client ID** и **Client Secret** в `.env`

### 2. Получить ID бота и стримера

```bash
# Замени USERNAME на нужный ник
curl -X GET 'https://api.twitch.tv/helix/users?login=USERNAME' \
  -H 'Client-Id: YOUR_CLIENT_ID' \
  -H 'Authorization: Bearer YOUR_APP_TOKEN'
```

Или через Python:

```python
# python get_ids.py
import asyncio
import twitchio

async def main():
    async with twitchio.Client(
        client_id="YOUR_CLIENT_ID",
        client_secret="YOUR_CLIENT_SECRET"
    ) as client:
        await client.login()
        users = await client.fetch_users(logins=["larkin_bot", "zhenyalarkin"])
        for u in users:
            print(f"{u.name}: {u.id}")

asyncio.run(main())
```

### 3. Авторизовать аккаунты

После запуска сервера открой в браузере:

```
https://twitch.quitari.ru/oauth
```

Нужно авторизовать **два аккаунта**:

1. **Аккаунт бота** (`larkin_bot`) — скопы: `user:bot`, `user:read:chat`, `user:write:chat`
2. **Аккаунт стримера** (`ZhenyaLarkin`) — скопы: `channel:bot`, `channel:manage:redemptions`

---

## 📊 Роли и уровни доступа

| Роль            | Уровень | Описание                      |
| --------------- | ------- | ----------------------------- |
| Owner           | 999     | Полный доступ, нельзя удалить |
| Admin           | 100     | Административный доступ       |
| Super Moderator | 75      | Расширенная модерация         |
| Moderator       | 50      | Модерация сообщества          |
| Streamer        | 30      | Управление контентом          |
| Участник        | 0       | Базовая роль                  |

---

## 🔧 Полезные команды

```bash
# Просмотр логов
docker compose logs -f backend
docker compose logs -f telegram_bot
docker compose logs -f twitch_bot

# Перезапуск сервиса
docker compose restart backend

# Подключение к базе данных
docker compose exec db psql -U voltage_user -d voltage

# Django shell
docker compose exec backend python manage.py shell

# Обновление кода на сервере
git pull origin main
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

---

## 🗺️ Roadmap

- [x] Backend API (Django REST Framework)
- [x] RBAC система ролей и прав
- [x] Розыгрыши (полный цикл)
- [x] Система модерации
- [x] Telegram бот
- [x] Twitch бот (базовый)
- [x] Веб панель администратора (React)
- [ ] GSI интеграция (CS2)
- [ ] LisSkins / VoltageDrops интеграция
- [ ] Overlay для OBS
- [ ] Мобильное приложение

---

## 📝 Лицензия

MIT License — используй свободно для своих проектов.

---

_VOLTAGE Platform — open source платформа для стримеров_
