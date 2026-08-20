const APPLICATION_ID_KEY = "newbridge.application_id";
const APPLICANT_FORM_KEY = "newbridge.applicant_form";
const QUOTE_SELECTION_KEY = "newbridge.quote_selection";
// sessionStorage (not localStorage): only needs to survive the single
// client-side navigation from Page 2's Back button to Page 1 — it must NOT
// persist across a fresh tab/window or an unrelated page load.
const CAME_FROM_BACK_KEY = "newbridge.came_from_back";

export function getStoredApplicationId() {
  return localStorage.getItem(APPLICATION_ID_KEY);
}

export function storeApplicationId(applicationId) {
  localStorage.setItem(APPLICATION_ID_KEY, applicationId);
}

export function clearApplicationId() {
  localStorage.removeItem(APPLICATION_ID_KEY);
}

export function getStoredApplicantForm() {
  const raw = localStorage.getItem(APPLICANT_FORM_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeApplicantForm(form) {
  localStorage.setItem(APPLICANT_FORM_KEY, JSON.stringify(form));
}

export function clearApplicantForm() {
  localStorage.removeItem(APPLICANT_FORM_KEY);
}

export function getStoredQuoteSelection() {
  const raw = localStorage.getItem(QUOTE_SELECTION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeQuoteSelection(selection) {
  localStorage.setItem(QUOTE_SELECTION_KEY, JSON.stringify(selection));
}

export function clearQuoteSelection() {
  localStorage.removeItem(QUOTE_SELECTION_KEY);
}

export function markCameFromBack() {
  sessionStorage.setItem(CAME_FROM_BACK_KEY, "true");
}

// Read-only: safe to call from a React useState lazy initializer, which
// React may invoke more than once (e.g. StrictMode in development) — a
// combined read-and-delete would corrupt the result on the second call.
export function peekCameFromBack() {
  return sessionStorage.getItem(CAME_FROM_BACK_KEY) === "true";
}

// Side-effect-only removal; safe to call multiple times (idempotent). Call
// this separately from a useEffect, after the flag has already been read.
export function clearCameFromBackFlag() {
  sessionStorage.removeItem(CAME_FROM_BACK_KEY);
}
