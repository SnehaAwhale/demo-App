export const MIN_AGE = 50;
export const MAX_AGE = 85;

export function formatDobInput(rawValue) {
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length > 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
  }
  if (digitsOnly.length > 2) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }
  return digitsOnly;
}

export function parseDob(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRealDate ? date : null;
}

export function calculateAge(dob, asOf = new Date()) {
  let age = asOf.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    asOf.getMonth() > dob.getMonth() ||
    (asOf.getMonth() === dob.getMonth() && asOf.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

export function validateDob(value) {
  const dob = parseDob(value);
  if (!dob) {
    return "Enter a valid date in MM/DD/YYYY format";
  }
  const age = calculateAge(dob);
  if (age < MIN_AGE || age > MAX_AGE) {
    return "This product is available for ages 50 to 85";
  }
  return null;
}
