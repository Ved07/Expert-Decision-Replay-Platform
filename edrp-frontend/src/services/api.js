import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// Create a dedicated axios instance instead of using the default one directly.
// This lets us attach interceptors that only apply to OUR backend calls.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ---- REQUEST INTERCEPTOR ----
// Runs before every request. Automatically attaches the token, so we
// never have to repeat "headers: { Authorization: ... }" in every function.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- RESPONSE INTERCEPTOR ----
// Runs after every response. Handles errors in ONE place instead of
// repeating try/catch logic everywhere.
apiClient.interceptors.response.use(
  (response) => response, // if it succeeded, just pass it through unchanged
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Token missing/invalid/expired — clear it and force a fresh login
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }

      // Attach a clean, human-readable message for components to show,
      // regardless of what shape the backend's error response was in.
      error.friendlyMessage =
        error.response.data?.detail ||
        (status === 403 ? "You don't have permission to do that." :
         status === 404 ? "That item could not be found." :
         "Something went wrong. Please try again.");
    } else {
      // No response at all — usually means the backend server is down,
      // or there's a network/CORS problem.
      error.friendlyMessage = "Could not reach the server. Is the backend running?";
    }

    return Promise.reject(error);
  }
);
export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await apiClient.post("/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
}

export async function registerUser(name, email, password) {
  const response = await apiClient.post("/users", { name, email, password });
  return response.data;
}

export function saveToken(token) {
  localStorage.setItem("access_token", token);
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function logout() {
  localStorage.removeItem("access_token");
}

export async function getCurrentUser() {
  const response = await apiClient.get("/users/me");
  return response.data;
}

export async function getDecisions() {
  const response = await apiClient.get("/decisions");
  return response.data;
}

export async function createDecision(title, problemStatement) {
  const response = await apiClient.post("/decisions", {
    title,
    problem_statement: problemStatement,
  });
  return response.data;
}

export async function getDecision(id) {
  const response = await apiClient.get(`/decisions/${id}`);
  return response.data;
}

export async function getAlternatives(decisionId) {
  const response = await apiClient.get(`/decisions/${decisionId}/alternatives`);
  return response.data;
}

export async function createAlternative(decisionId, alternative) {
  const response = await apiClient.post(`/decisions/${decisionId}/alternatives`, alternative);
  return response.data;
}

export async function getAttachments(decisionId) {
  const response = await apiClient.get(`/decisions/${decisionId}/attachments`);
  return response.data;
}

export async function uploadAttachment(decisionId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(`/decisions/${decisionId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteAttachment(attachmentId) {
  await apiClient.delete(`/attachments/${attachmentId}`);
}

export async function downloadAttachment(attachmentId, filename) {
  const response = await apiClient.get(`/attachments/${attachmentId}/download`, {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function getComments(decisionId) {
  const response = await apiClient.get(`/decisions/${decisionId}/comments`);
  return response.data;
}

export async function postComment(decisionId, content) {
  const response = await apiClient.post(`/decisions/${decisionId}/comments`, { content });
  return response.data;
}


export async function getApprovals(decisionId) {
  const response = await apiClient.get(`/decisions/${decisionId}/approvals`);
  return response.data;
}

export async function submitApproval(decisionId, outcome, comments) {
  const response = await apiClient.post(`/decisions/${decisionId}/approvals`, {
    outcome,
    comments: comments || null,
  });
  return response.data;
}

export async function getMyDecisions() {
  const response = await apiClient.get("/decisions/mine");
  return response.data;
}

export async function getPendingReviewDecisions() {
  const response = await apiClient.get("/decisions/pending-review");
  return response.data;
}

export async function getAdminStats() {
  const response = await apiClient.get("/admin/stats");
  return response.data;
}

export async function getMyTeam() {
  const response = await apiClient.get("/teams/mine");
  return response.data;
}

export async function getAllTeams() {
  const response = await apiClient.get("/teams");
  return response.data;
}

export async function getTeamDetail(teamId) {
  const response = await apiClient.get(`/teams/${teamId}`);
  return response.data;
}

export async function getUnassignedUsers() {
  const response = await apiClient.get("/users/unassigned");
  return response.data;
}

export async function addUserToTeam(userId, teamId) {
  const response = await apiClient.patch(`/users/${userId}/team`, null, {
    params: { team_id: teamId },
  });
  return response.data;
}

export async function removeUserFromTeam(userId) {
  await apiClient.delete(`/users/${userId}/team`);
}

export async function createTeam(name, managerId) {
  const response = await apiClient.post("/teams", { name, manager_id: managerId || null });
  return response.data;
}

export async function updateTeam(teamId, updates) {
  const response = await apiClient.patch(`/teams/${teamId}`, updates);
  return response.data;
}
