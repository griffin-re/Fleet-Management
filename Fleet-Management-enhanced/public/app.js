const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterButton = document.getElementById('show-register');
const showLoginButton = document.getElementById('show-login');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const feedback = document.getElementById('feedback');
const dashboardFeedback = document.getElementById('dashboard-feedback');
const currentUserLabel = document.getElementById('current-user');
const vehicleList = document.getElementById('vehicle-list');
const logoutButton = document.getElementById('logout-button');
const loadVehiclesButton = document.getElementById('load-vehicles');

const apiRoot = window.API_ROOT || '/api';

function setFeedback(element, message, isError = true) {
  element.textContent = message;
  element.style.color = isError ? '#dc2626' : '#16a34a';
}

function clearFeedback(element) {
  element.textContent = '';
}

function getStoredToken() {
  return localStorage.getItem('fleet_token');
}

function setStoredToken(token) {
  localStorage.setItem('fleet_token', token);
}

function clearStoredToken() {
  localStorage.removeItem('fleet_token');
}

function showDashboard(email) {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  currentUserLabel.textContent = email;
  clearFeedback(dashboardFeedback);
  fetchVehicles();
}

function showLogin() {
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
  clearFeedback(feedback);
}

function showRegister() {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  clearFeedback(feedback);
}

async function fetchVehicles() {
  dashboardFeedback.textContent = 'Loading vehicles...';
  try {
    const token = getStoredToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${apiRoot}/vehicles`, { headers });
    if (!response.ok) {
      throw new Error('Unable to load vehicles');
    }

    const vehicles = await response.json();
    vehicleList.innerHTML = vehicles.map(vehicle => `
      <tr>
        <td>${vehicle.id}</td>
        <td>${vehicle.plate_number || '-'}</td>
        <td>${vehicle.make || '-'}</td>
        <td>${vehicle.model || '-'}</td>
        <td>${vehicle.year || '-'}</td>
        <td>${vehicle.status || '-'}</td>
      </tr>
    `).join('');
    setFeedback(dashboardFeedback, `${vehicles.length} vehicles loaded.`, false);
  } catch (error) {
    setFeedback(dashboardFeedback, 'Error loading vehicles. Please refresh.', true);
    console.error(error);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  clearFeedback(feedback);

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!email || !password) {
    setFeedback(feedback, 'Email and password are required.');
    return;
  }

  try {
    const response = await fetch(`${apiRoot}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await response.json();
    if (!response.ok) {
      setFeedback(feedback, body.error || 'Login failed.');
      return;
    }

    setStoredToken(body.token);
    localStorage.setItem('fleet_user_email', body.user.email);
    showDashboard(body.user.email);
  } catch (error) {
    setFeedback(feedback, 'Unable to reach server.');
    console.error(error);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  clearFeedback(feedback);

  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  if (!email || !password) {
    setFeedback(feedback, 'Email and password are required.');
    return;
  }

  try {
    const response = await fetch(`${apiRoot}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await response.json();
    if (!response.ok) {
      setFeedback(feedback, body.error || 'Registration failed.');
      return;
    }

    setStoredToken(body.token);
    localStorage.setItem('fleet_user_email', body.user.email);
    showDashboard(body.user.email);
  } catch (error) {
    setFeedback(feedback, 'Unable to reach server.');
    console.error(error);
  }
}

function handleLogout() {
  clearStoredToken();
  localStorage.removeItem('fleet_user_email');
  dashboardSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  showLogin();
}

function restoreSession() {
  const token = getStoredToken();
  if (!token) {
    showLogin();
    return;
  }

  const savedEmail = localStorage.getItem('fleet_user_email');
  if (savedEmail) {
    showDashboard(savedEmail);
  } else {
    showLogin();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleLogin(event);
});
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleRegister(event);
});
showRegisterButton.addEventListener('click', showRegister);
showLoginButton.addEventListener('click', showLogin);
logoutButton.addEventListener('click', handleLogout);
loadVehiclesButton.addEventListener('click', fetchVehicles);

window.addEventListener('DOMContentLoaded', () => {
  restoreSession();
});
