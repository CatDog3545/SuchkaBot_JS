# 🤖 SuchkaBot на JavaScript

Telegram AI-бот с поддержкой множественных чатов.

## 📋 Запуск локально

### 1. Установите Node.js (версия 18+)
Скачайте с https://nodejs.org/

### 2. Установите зависимости
```bash
npm install
```

### 3. Запустите бота
```bash
npm start
```

---

## 🌐 Хостинг бота

### Вариант 1: **Railway** (рекомендуется, бесплатно)

1. Зарегистрируйтесь на https://railway.app/
2. Создайте новый проект → **Deploy from GitHub repo**
3. Подключите ваш репозиторий с ботом
4. Добавьте переменные окружения:
   - `TELEGRAM_TOKEN` — токен бота
   - `OPENROUTER_API_KEY` — API ключ OpenRouter
   - `OPENROUTER_MODEL` — модель (опционально)
5. Railway автоматически запустит бота

**Важно:** Добавьте файл `Procfile`:
```
worker: node bot.js
```

---

### Вариант 2: **Render** (бесплатно)

1. Зарегистрируйтесь на https://render.com/
2. **New +** → **Web Service**
3. Подключите репозиторий
4. Настройки:
   - **Build Command:** `npm install`
   - **Start Command:** `node bot.js`
5. Добавьте переменные окружения (Environment Variables)

---

### Вариант 3: **Replit** (бесплатно)

1. Зарегистрируйтесь на https://replit.com/
2. **Create repl** → выберите **Node.js**
3. Загрузите файлы проекта
4. В **Secrets** добавьте:
   - `TELEGRAM_TOKEN`
   - `OPENROUTER_API_KEY`
5. Нажмите **Run**

---

### Вариант 4: **VPS/VDS** (платно, ~$5/мес)

Подойдут: Timeweb, Aeza, Hetzner, DigitalOcean

```bash
# Подключение к серверу
ssh user@your-server-ip

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Загрузка проекта
git clone <your-repo>
cd SuchkaBot_JS

# Установка зависимостей
npm install

# Запуск через PM2 (менеджер процессов)
sudo npm install -g pm2
pm2 start bot.js --name suchka-bot
pm2 save
pm2 startup
```

---

### Вариант 5: **Oracle Cloud Free Tier** (бесплатно, навсегда)

1. Зарегистрируйтесь на https://oracle.com/cloud/free/
2. Создайте VM (Always Free ARM instance)
3. Подключитесь по SSH и установите Node.js
4. Запустите бота как в варианте с VPS

---

## 📁 Структура проекта

```
SuchkaBot_JS/
├── bot.js           # Основной код бота
├── package.json     # Зависимости
├── .env             # Переменные окружения (не коммитить!)
├── .gitignore       # Игнорируемые файлы
├── user_data.json   # Данные пользователей (не коммитить!)
└── README.md        # Инструкция
```

---

## ⚙️ Переменные окружения

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_TOKEN` | Токен бота от @BotFather |
| `OPENROUTER_API_KEY` | API ключ OpenRouter |
| `OPENROUTER_MODEL` | Модель ИИ (по умолчанию: nvidia/nemotron-3-super-120b-a12b:free) |

---

## 🚀 Быстрый старт на Railway

```bash
# 1. Инициализируйте Git
git init
git add .
git commit -m "Initial commit"

# 2. Создайте репозиторий на GitHub и запушьте
git remote add origin <your-repo-url>
git push -u origin main

# 3. Создайте Procfile
echo "worker: node bot.js" > Procfile

# 4. Подключите репозиторий в Railway
# https://railway.app/new
```

---

## 🔧 Решение проблем

**Бот не запускается:**
- Проверьте переменные окружения
- Убедитесь, что `node --version` показывает 18+

**Ошибки API:**
- Проверьте баланс API ключа OpenRouter
- Убедитесь, что модель доступна

**Данные не сохраняются:**
- Проверьте права доступа к файлу `user_data.json`
