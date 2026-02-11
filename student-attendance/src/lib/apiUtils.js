/**
 * Utility function to make API calls with JWT token authorization
 */
export async function apiCall(url, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Log errors for debugging
  if (!response.ok) {
    console.error(
      `API Error (${response.status}):`,
      url,
      await response.clone().text(),
    );
  }

  return response;
}

/**
 * Get the stored JWT token
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Store JWT token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  }
}

/**
 * Clear JWT token
 */
export function clearToken() {
  localStorage.removeItem("token");
}
