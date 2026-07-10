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

// getDecisions function sends a GET request to the /decisions endpoint to retrieve a list of decisions, using the stored access token for authorization.
export async function getDecisions() {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/decisions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// createDecision function sends a POST request to the /decisions endpoint to create a new decision with the provided title and problem statement, using the stored access token for authorization.
export async function createDecision(title, problemStatement) {
  const token = getToken();
  const response = await axios.post(
    `${API_BASE_URL}/decisions`,
    { title, problem_statement: problemStatement },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// getDecision function sends a GET request to the /decisions/{id} endpoint to retrieve details of a specific decision by its ID, using the stored access token for authorization.
export async function getDecision(id) {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/decisions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// createAlternative function sends a POST request to the /decisions/{id}/alternatives endpoint to create a new alternative for a specific decision, using the stored access token for authorization.
export async function createAlternative(decisionId, alternative) {
  const token = getToken();
  const response = await axios.post(
    `${API_BASE_URL}/decisions/${decisionId}/alternatives`,
    alternative,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// getAlternatives, getAttachments, getComments, postComment, uploadAttachment, and getDownloadUrl functions are additional API interactions for managing alternatives, attachments, and comments related to decisions. They all use the stored access token for authorization when making requests to the backend API.
export async function getAlternatives(decisionId) {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/decisions/${decisionId}/alternatives`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// getAttachments function sends a GET request to the /decisions/{id}/attachments endpoint to retrieve a list of attachments for a specific decision, using the stored access token for authorization.
export async function getAttachments(decisionId) {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/decisions/${decisionId}/attachments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
// deleteAttachment function sends a DELETE request to the /attachments/{id} endpoint to delete a specific attachment by its ID, using the stored access token for authorization.
export async function deleteAttachment(attachmentId) {
  const token = getToken();
  await axios.delete(`${API_BASE_URL}/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// getComments function sends a GET request to the /decisions/{id}/comments endpoint to retrieve a list of comments for a specific decision, using the stored access token for authorization.
export async function getComments(decisionId) {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/decisions/${decisionId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// postComment function sends a POST request to the /decisions/{id}/comments endpoint to add a new comment to a specific decision, using the stored access token for authorization.
export async function postComment(decisionId, content) {
  const token = getToken();
  const response = await axios.post(
    `${API_BASE_URL}/decisions/${decisionId}/comments`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// uploadAttachment function sends a POST request to the /decisions/{id}/attachments endpoint to upload a file attachment for a specific decision, using the stored access token for authorization. It uses FormData to handle the file upload.
export async function uploadAttachment(decisionId, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_BASE_URL}/decisions/${decisionId}/attachments`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

// getDownloadUrl function sends a GET request to the /attachments/{id}/download endpoint to retrieve a download URL for a specific attachment, using the stored access token for authorization.
export async function downloadAttachment(attachmentId, filename) {
  const token = getToken();

  const response = await axios.get(
    `${API_BASE_URL}/attachments/${attachmentId}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob", // tell axios to expect binary file data, not JSON
    }
  );

  // Create a temporary URL pointing to the downloaded file data in memory
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));

  // Create an invisible link, "click" it programmatically, then clean up
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}