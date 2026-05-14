const API_URL = import.meta.env.VITE_API_URL || "https://hsjmelipilla-api.onrender.com/api";

function getCSRFToken() {
  const name = "csrftoken=";
  const decoded = decodeURIComponent(document.cookie);
  for (const cookie of decoded.split(";")) {
    const c = cookie.trim();
    if (c.startsWith(name)) return c.substring(name.length);
  }
  return "";
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (options.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method)) {
    headers["X-CSRFToken"] = getCSRFToken();
  }
  const res = await fetch(url, {
    headers,
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(msg.error || msg.detail || `Error ${res.status}`);
  }
  return res.json();
}

export function login(username, password) {
  return request("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request("/auth/logout/", { method: "POST" });
}

export function me() {
  return request("/auth/me/");
}

export function getNiveles() {
  return request("/niveles/");
}

export function getDashboardKPI() {
  return request("/dashboard/");
}

export function getCamas(filters = "") {
  return request(`/camas/${filters}`);
}

export function createCama(data) {
  return request("/camas/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCama(id, data) {
  return request(`/camas/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getServicios() {
  return request("/servicios/");
}

export function getServiciosGrd(filters = "") {
  return request(`/servicios-grd/${filters}`);
}

export function getOportunidadHospitalizacion(filters = "") {
  return request(`/oportunidad-hospitalizacion/${filters}`);
}
