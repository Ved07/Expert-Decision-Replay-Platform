import axios from "axios";
// This file contains functions to interact with the backend API for user authentication and management.
const API_BASE_URL = "http://127.0.0.1:8000";

// Login function sends a POST request to the /login endpoint with the user's email and password.
export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await axios.post(`${API_BASE_URL}/login`, formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data;
}

// Register function sends a POST request to the /users endpoint with the user's details.
export async function registerUser(name, email, password) {
  // Your backend's POST /users expects JSON (UserCreate schema),
  // unlike /login which expects form data — different endpoints, different formats.
  const response = await axios.post(`${API_BASE_URL}/users`, {
    name,
    email,
    password,
  });

  return response.data;
}

// Token management functions to save, retrieve, and remove the access token from local storage.
export function saveToken(token) {
  localStorage.setItem("access_token", token);
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function logout() {
  localStorage.removeItem("access_token");
}

// getCurrentUser function sends a GET request to the /users/me endpoint to retrieve the current user's information using the stored access token for authorization.
export async function getCurrentUser() {
  const token = getToken();

  const response = await axios.get(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}