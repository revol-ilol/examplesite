const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const thankYouMessage = document.getElementById('thankYouMessage');
const optionButtons = document.querySelectorAll('.contact-card');
const heroContactButtons = document.querySelectorAll('.hero-messengers .contact-card');
const phoneLabel = document.getElementById('phoneLabel');
const phoneInput = document.getElementById('phoneInput');
const contactForm = document.getElementById('contactForm');
let selectedContact = 'WhatsApp';

function isValidBelarusPhone(value) {
  return /^\+375(29|25|33)\d{7}$/.test(value);
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
  } else {
    phoneLabel.textContent = 'Номер телефона';
    phoneInput.placeholder = '+375 XX XXX XX XX';
    phoneInput.type = 'tel';
    phoneInput.inputMode = 'tel';
    phoneInput.removeAttribute('autocapitalize');
    phoneInput.removeAttribute('autocomplete');
  }
}

optionButtons.forEach(button => {
  button.addEventListener('click', () => {
    optionButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedContact = button.dataset.value;
    refreshContactInput();
  });
});

heroContactButtons.forEach(button => {
  button.addEventListener('click', () => {
    contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => phoneInput.focus({ preventScroll: true }), 350);
  });
});

refreshContactInput();

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

  if (selectedContact === 'WhatsApp' && !isValidBelarusPhone(body.phone)) {
    statusEl.textContent = 'Для WhatsApp введите номер в формате +375XXXXXXXXX, где XX — 29, 25 или 33.';
    return;
  }

  resetFormState();

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
      optionButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === selectedContact));
      refreshContactInput();
      showThankYouState();
    } else {
      statusEl.textContent = result.error || 'Ошибка при отправке заявки.';
    }
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'Ошибка сети. Попробуйте позже.';
  }
});
