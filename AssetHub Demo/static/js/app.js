const TOKEN_KEY = "advisor_pulse_auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiCall(baseUrl, path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

async function login(email, password) {
  const result = await apiCall(window.APP_CONFIG.authBaseUrl, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(result.authToken);
  return result.user;
}

async function getCurrentUser() {
  return apiCall(window.APP_CONFIG.authBaseUrl, "/auth/me");
}

async function getMyPulse() {
  return apiCall(window.APP_CONFIG.pulseBaseUrl, "/pulse/me");
}

function logout() {
  clearToken();
  window.location.reload();
}

function reasonLabel(reason) {
  switch (reason) {
    case "stalled_application":
      return "Stalled application";
    case "negative_sentiment":
      return "Negative sentiment";
    case "high_value_stale":
      return "High value, stale";
    case "no_recent_contact":
      return "No recent contact";
    default:
      return reason;
  }
}

function renderPulseList(items) {
  const list = document.getElementById("pulse-list");
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<p class="empty">No clients need attention right now.</p>`;
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "pulse-card";
    card.innerHTML = `
      <div class="pulse-card__header">
        <div>
          <h3>${item.name}</h3>
          <p class="muted">Client #${item.client_id}</p>
        </div>
        <span class="badge badge--${item.reason}">${reasonLabel(item.reason)}</span>
      </div>
      <p>${item.reason_detail}</p>
      <div class="pulse-card__meta">
        <span>${item.days_since_last_contact} days since last contact</span>
        <span>Priority ${item.priority_score}</span>
      </div>
    `;
    list.appendChild(card);
  }
}

async function boot() {
  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const userName = document.getElementById("user-name");
  const advisorMeta = document.getElementById("advisor-meta");
  const refreshButton = document.getElementById("refresh-button");
  const logoutButton = document.getElementById("logout-button");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  emailInput.value = window.APP_CONFIG.demoEmail;
  passwordInput.value = window.APP_CONFIG.demoPassword;

  async function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    loginError.textContent = "";

    const user = await getCurrentUser();
    userName.textContent = user.name;
    advisorMeta.textContent = `Advisor id ${user.advisor_id} · Mock Data Hub`;

    const pulse = await getMyPulse();
    renderPulseList(pulse);
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    try {
      await login(emailInput.value.trim(), passwordInput.value);
      await showDashboard();
    } catch (error) {
      loginError.textContent = error.message;
    }
  });

  refreshButton.addEventListener("click", async () => {
    try {
      const pulse = await getMyPulse();
      renderPulseList(pulse);
    } catch (error) {
      alert(error.message);
    }
  });

  logoutButton.addEventListener("click", logout);

  if (getToken()) {
    try {
      await showDashboard();
    } catch {
      clearToken();
    }
  }
}

document.addEventListener("DOMContentLoaded", boot);
