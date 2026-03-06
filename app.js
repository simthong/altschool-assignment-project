const header = document.querySelector('.site-header');
const progressBar = document.querySelector('.scroll-progress');
const revealElements = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('.data-item h5[data-target]');
const parallaxItems = document.querySelectorAll('.parallax-target');
const buttons = document.querySelectorAll('.interactive-btn');

const signupForm = document.querySelector('#signup-form');
const loginForm = document.querySelector('#login-form');
const authState = document.querySelector('#auth-state');
const portalMessage = document.querySelector('#portal-message');
const payProfessionalBtn = document.querySelector('#pay-professional');
const payTeamsBtn = document.querySelector('#pay-teams');
const logoutBtn = document.querySelector('#logout');
const historyEl = document.querySelector('#payment-history');

const API_BASE = '/api';

const setScrollEffects = () => {
  const scrollTop = window.scrollY;
  const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxHeight > 0 ? (scrollTop / maxHeight) * 100 : 0;

  progressBar.style.width = `${progress}%`;
  header.classList.toggle('scrolled', scrollTop > 20);
};

const revealOnScroll = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealOnScroll.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2
  }
);

revealElements.forEach((item) => revealOnScroll.observe(item));

const animateCounter = (counter) => {
  const end = Number(counter.dataset.target);
  const suffix = counter.dataset.suffix || '';
  const duration = 1200;
  const startTime = performance.now();

  const frame = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = end * eased;

    counter.textContent = `${Math.floor(current)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      counter.textContent = `${end}${suffix}`;
    }
  };

  requestAnimationFrame(frame);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.6
  }
);

counters.forEach((counter) => counterObserver.observe(counter));

window.addEventListener('mousemove', (event) => {
  const xPosition = (event.clientX / window.innerWidth - 0.5) * 10;
  const yPosition = (event.clientY / window.innerHeight - 0.5) * 10;

  parallaxItems.forEach((item, index) => {
    const depth = index + 1;
    item.style.transform = `translate3d(${xPosition / depth}px, ${yPosition / depth}px, 0)`;
  });
});

buttons.forEach((button) => {
  button.addEventListener('mousemove', (event) => {
    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    button.style.transform = `translate(${offsetX * 0.08}px, ${offsetY * 0.08}px)`;
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = '';
  });
});

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const clearToken = () => localStorage.removeItem('token');

const setMessage = (message, isError = false) => {
  portalMessage.textContent = message;
  portalMessage.style.color = isError ? '#c13131' : '#005ae2';
};

const updateAuthUI = (user) => {
  const isAuthenticated = Boolean(user);
  payProfessionalBtn.disabled = !isAuthenticated;
  payTeamsBtn.disabled = !isAuthenticated;
  authState.textContent = isAuthenticated ? `Logged in as ${user.name} (${user.email})` : 'Not logged in.';
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

const loadHistory = async () => {
  try {
    const data = await apiRequest('/payments/history');
    if (!data.transactions.length) {
      historyEl.innerHTML = '<p>No transactions yet.</p>';
      return;
    }

    historyEl.innerHTML = `<h5>Payment History</h5><ul>${data.transactions
      .map(
        (item) =>
          `<li>${item.plan.toUpperCase()} - ${(item.amount / 100).toFixed(2)} ${item.currency.toUpperCase()} - ${item.status}</li>`
      )
      .join('')}</ul>`;
  } catch (_error) {
    historyEl.innerHTML = '';
  }
};

const checkCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    updateAuthUI(null);
    return;
  }

  try {
    const data = await apiRequest('/auth/me');
    updateAuthUI(data.user);
    await loadHistory();
  } catch (_error) {
    clearToken();
    updateAuthUI(null);
  }
};

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: document.querySelector('#signup-name').value,
    email: document.querySelector('#signup-email').value,
    password: document.querySelector('#signup-password').value
  };

  try {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(data.token);
    updateAuthUI(data.user);
    setMessage('Signup successful. You are now logged in.');
    signupForm.reset();
    await loadHistory();
  } catch (error) {
    setMessage(error.message, true);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    email: document.querySelector('#login-email').value,
    password: document.querySelector('#login-password').value
  };

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(data.token);
    updateAuthUI(data.user);
    setMessage('Login successful.');
    loginForm.reset();
    await loadHistory();
  } catch (error) {
    setMessage(error.message, true);
  }
});

const startPayment = async (plan) => {
  try {
    const data = await apiRequest('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });

    window.location.href = data.checkoutUrl;
  } catch (error) {
    setMessage(error.message, true);
  }
};

payProfessionalBtn.addEventListener('click', () => startPayment('professional'));
payTeamsBtn.addEventListener('click', () => startPayment('teams'));

logoutBtn.addEventListener('click', () => {
  clearToken();
  updateAuthUI(null);
  historyEl.innerHTML = '';
  setMessage('You have been logged out.');
});

const handlePostPaymentConfirmation = async () => {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId || !getToken()) {
    return;
  }

  try {
    const data = await apiRequest(`/payments/confirm-session/${sessionId}`);
    if (data.status === 'paid') {
      setMessage('Payment successful and confirmed.');
    } else {
      setMessage('Payment is still processing. Refresh in a moment.', true);
    }
    await loadHistory();
    window.history.replaceState({}, document.title, '/');
  } catch (error) {
    setMessage(error.message, true);
  }
};

window.addEventListener('scroll', setScrollEffects);
setScrollEffects();
checkCurrentUser();
handlePostPaymentConfirmation();
