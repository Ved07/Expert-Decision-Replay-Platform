// import api from "./api";

// // Get all decisions
// export const getDecisions = async () => {
//     const response = await api.get("/decisions");
//     return response.data;
// };

// // Get one decision
// export const getDecisionById = async (id) => {
//     const response = await api.get(`/decisions/${id}`);
//     return response.data;
// };

// // Create decision
// export const createDecision = async (decisionData) => {
//     const response = await api.post("/decisions", decisionData);
//     return response.data;
// };

// // Update decision
// export const updateDecision = async (id, decisionData) => {
//     const response = await api.patch(`/decisions/${id}`, decisionData);
//     return response.data;
// };

// // Delete decision
// export const deleteDecision = async (id) => {
//     const response = await api.delete(`/decisions/${id}`);
//     return response.data;
// };
// Backend integration will be added later.

export const getAllDecisions = async () => {
  return [];
};

export const getDecisionById = async (id) => {
  return null;
};

export const createDecision = async (data) => {};

export const updateDecision = async (id, data) => {};

export const deleteDecision = async (id) => {};