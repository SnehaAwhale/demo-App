import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function unwrapError(error) {
  const message = error.response?.data?.error || error.message || "Something went wrong";
  return new Error(message);
}

export async function recalculateQuote({ applicationId, coverageAmount }) {
  try {
    const { data } = await client.post("/quote/recalculate", {
      application_id: applicationId,
      coverage_amount: coverageAmount,
    });
    return data;
  } catch (error) {
    throw unwrapError(error);
  }
}

export async function saveQuote({ applicationId, coverageAmount, selectedRateClass }) {
  try {
    const { data } = await client.post("/quote/save", {
      application_id: applicationId,
      coverage_amount: coverageAmount,
      selected_rate_class: selectedRateClass,
    });
    return data;
  } catch (error) {
    throw unwrapError(error);
  }
}

export async function toggleRider({ applicationId, riderName, enabled }) {
  try {
    const { data } = await client.post("/quote/rider", {
      application_id: applicationId,
      rider_name: riderName,
      enabled,
    });
    return data;
  } catch (error) {
    throw unwrapError(error);
  }
}
