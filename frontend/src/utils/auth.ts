export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export function parseJwt(token: string) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function getUserRole() {
  const token = getToken();
  if (!token) return null;
  const payload = parseJwt(token);
  return payload?.role || null;
}
