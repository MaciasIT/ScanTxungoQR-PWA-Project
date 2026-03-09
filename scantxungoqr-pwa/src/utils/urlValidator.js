/**
 * Validates that a string is a well-formed HTTP/HTTPS URL.
 * @param {string} string - The string to validate.
 * @returns {boolean} True if the string is a valid http/https URL.
 */
export const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};
