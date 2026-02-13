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
  } else if (typeof window !== "undefined") {
    console.warn("No token found in localStorage for API call to:", url);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Log errors for debugging
  if (!response.ok) {
    const errorText = await response.clone().text();
    console.error(`API Error (${response.status}):`, url, errorText);
    // Log token status
    if (!token) {
      console.error("Token is missing from localStorage");
    }
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
