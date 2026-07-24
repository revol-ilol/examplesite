const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Error: BOT_TOKEN and CHAT_ID must be set in .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/send-form', async (req, res) => {
  const { name, phone, contact, message } = req.body;

  if (!name || !phone || !contact) {
    return res.status(400).json({ success: false, error: 'Name, phone and contact method are required.' });
  }

  const text = `Новая заявка:%0A` +
    `Имя: ${escapeHtml(name)}%0A` +
    `Телефон: ${escapeHtml(phone)}%0A` +
    `Связь: ${escapeHtml(contact)}%0A` +
    `Сообщение: ${escapeHtml(message || '—')}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Telegram send error:', error);
    res.status(500).json({ success: false, error: 'Не удалось отправить заявкку. Попробуйте позже.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
