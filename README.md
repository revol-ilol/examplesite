# Responsive Landing Page with Telegram Bot Form

Сайт работает на телефонах и на компьютерах.
Форма отправляет данные на сервер, а сервер пересылает их в Telegram через бота.

## Установка

1. Скопируйте `.env.example` в `.env`:

   ```bash
   copy .env.example .env
   ```

2. Откройте `.env` и заполните:

   - `BOT_TOKEN` — токен вашего Telegram-бота
   - `CHAT_ID` — идентификатор чата или пользователя
   - `PORT` — порт сервера (по умолчанию `3000`)

3. Установите зависимости:

   ```bash
   npm install
   ```

4. Запустите сервер:

   ```bash
   npm start
   ```

5. Откройте в браузере:

   ```text
   http://localhost:3000
   ```
