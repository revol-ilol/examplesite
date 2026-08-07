const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'D9QPQP3C77U3CJ3IJ1HG';

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Error: BOT_TOKEN and CHAT_ID must be set in .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    }
  }
}));

app.post('/track-tiktok-event', async (req, res) => {
  const { eventName, properties = {} } = req.body;

  if (!eventName) {
    return res.status(400).json({ success: false, error: 'eventName is required.' });
  }

  if (!TIKTOK_ACCESS_TOKEN) {
    console.warn('TikTok access token is not configured. Skipping event tracking.');
    return res.json({ success: true, skipped: true });
  }

  const eventId = properties.event_id || crypto.randomUUID();
  const eventTime = properties.event_time || Math.floor(Date.now() / 1000);

  const payload = {
    pixel_code: TIKTOK_PIXEL_ID,
    event: eventName,
    event_id: eventId,
    timestamp: eventTime,
    context: {
      page_url: properties.url || req.headers.referer || 'https://localhost',
      user_agent: req.get('user-agent') || '',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    },
    properties: {
      ...properties,
      event_id: eventId,
      event_time: eventTime
    },
    user: {}
  };

  if (properties.phone) {
    payload.user.phone = properties.phone;
  }

  if (properties.email) {
    payload.user.email = properties.email;
  }

  if (properties.external_id) {
    payload.user.external_id = properties.external_id;
  }

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'TikTok API error');
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('TikTok event tracking error:', error);
    res.status(500).json({ success: false, error: 'Failed to send TikTok event.' });
  }
});

app.post('/send-form', async (req, res) => {
  const { name, phone, contact, message } = req.body;

  if (!name || !phone || !contact) {
    return res.status(400).json({ success: false, error: 'Name, phone and contact method are required.' });
  }

  const text = [
    '📝 <b>Новая заявка</b>',
    '━━━━━━━━━━━━━━━━━━━━━━',
    `👤 <b>Имя:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    `💬 <b>Способ связи:</b> ${escapeHtml(contact)}`,
    '━━━━━━━━━━━━━━━━━━━━━━',
    `🗂 <b>Сообщение:</b>\n${escapeHtml(message || '—')}`
  ].join('\n');

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
