/**
 * API utility functions
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Fetch with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Load puzzle by ID
 */
export async function loadPuzzle(id) {
  return fetchAPI(`/api/v1/puzzle/${id}`);
}

/**
 * Submit puzzle solution
 */
export async function submitPuzzle(id, data) {
  return fetchAPI(`/api/v1/puzzle/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export default {
  loadPuzzle,
  submitPuzzle,
};

