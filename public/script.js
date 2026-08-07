const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const thankYouMessage = document.getElementById('thankYouMessage');
const formOptionButtons = document.querySelectorAll('.contact-options .contact-card');
const heroContactButtons = document.querySelectorAll('.hero-messengers .contact-card');
const phoneLabel = document.getElementById('phoneLabel');
const phoneInput = document.getElementById('phoneInput');
const contactForm = document.getElementById('contactForm');
let selectedContact = 'WhatsApp';

function updateContactActive() {
  [...formOptionButtons, ...heroContactButtons].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === selectedContact);
  });
}

async function trackTikTokEvent(eventName, properties = {}) {
  try {
    if (window.ttq) {
      window.ttq.track(eventName, properties);
    }

    await fetch('/track-tiktok-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, properties })
    });
  } catch (error) {
    console.error('TikTok tracking error:', error);
  }
}

function showThankYouState() {
  form.querySelectorAll('input, textarea, button[type="submit"], .field-label, .contact-options, p.field-label').forEach((element) => {
    element.style.display = 'none';
  });
  thankYouMessage.hidden = false;
  statusEl.textContent = '';
}

function resetFormState() {
  form.querySelectorAll('input, textarea, button[type="submit"], .field-label, .contact-options, p.field-label').forEach((element) => {
    element.style.display = '';
  });
  thankYouMessage.hidden = true;
  statusEl.textContent = '';
}

function refreshContactInput() {
  if (selectedContact === 'Telegram') {
    phoneLabel.textContent = 'Номер (или username)';
    phoneInput.placeholder = '+375 XX ... или @username';
    phoneInput.type = 'text';
    phoneInput.inputMode = 'text';
    phoneInput.setAttribute('autocapitalize', 'none');
    phoneInput.setAttribute('autocomplete', 'off');
    if (!phoneInput.value.trim()) {
      phoneInput.value = '+375';
    }
  } else {
    phoneLabel.textContent = 'Номер телефона';
    phoneInput.placeholder = '+375 XX XXX XX XX';
    phoneInput.type = 'tel';
    phoneInput.inputMode = 'tel';
    phoneInput.removeAttribute('autocapitalize');
    phoneInput.removeAttribute('autocomplete');
    if (!phoneInput.value.trim()) {
      phoneInput.value = '+375';
    }
  }
}

formOptionButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedContact = button.dataset.value;
    updateContactActive();
    refreshContactInput();
  });
});

heroContactButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedContact = button.dataset.value;
    updateContactActive();
    refreshContactInput();
    contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => phoneInput.focus({ preventScroll: true }), 350);
  });
});

updateContactActive();
refreshContactInput();

document.querySelectorAll('.primary-button, .submit-button').forEach((button) => {
  button.addEventListener('click', () => {
    trackTikTokEvent('ClickButton', {
      content_name: button.textContent.trim(),
      button_id: button.id || 'cta'
    });
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusEl.textContent = '';

  const formData = new FormData(form);
  const body = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    message: formData.get('message').trim(),
    contact: selectedContact
  };

  if (!body.name || !body.phone) {
    statusEl.textContent = 'Пожалуйста, заполните имя и телефон.';
    return;
  }

  statusEl.textContent = 'Отправка...';
  try {
    const response = await fetch('/send-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result.success) {
      form.reset();
      selectedContact = 'WhatsApp';
      updateContactActive();
      refreshContactInput();
      await trackTikTokEvent('Lead', {
        content_name: 'Заявка',
        content_type: 'form',
        value: 1,
        currency: 'RUB',
        phone: body.phone,
        external_id: body.name
      });
      await trackTikTokEvent('Contact', {
        content_name: 'Заявка',
        content_type: 'form',
        value: 1,
        currency: 'RUB',
        phone: body.phone,
        external_id: body.name
      });
      await trackTikTokEvent('CompleteRegistration', {
        content_name: 'Заявка',
        content_type: 'form',
        value: 1,
        currency: 'RUB',
        phone: body.phone,
        external_id: body.name
      });
      showThankYouState();
    } else {
      statusEl.textContent = result.error || 'Ошибка при отправке заявки.';
    }
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'Ошибка сети. Попробуйте позже.';
  }
});
