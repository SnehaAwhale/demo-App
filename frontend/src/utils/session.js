const APPLICATION_ID_KEY = "newbridge.application_id";
const APPLICANT_FORM_KEY = "newbridge.applicant_form";
const QUOTE_SELECTION_KEY = "newbridge.quote_selection";

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
