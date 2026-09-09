/**
 * Formats numbers into Indian Rupee currency format (e.g. ₹1,24,500.00 or ₹1,24,500)
 */
export const formatCurrency = (amount, includeDecimals = false) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Formats ISO or date strings into readable date (e.g. 08 Sep 2026)
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Extracts clean user-friendly error message from FastAPI or Axios error objects
 */
export const getApiErrorMessage = (error, fallbackMessage = 'An unexpected error occurred.') => {
  if (!error) return fallbackMessage;

  // Handles FastAPI HTTP 409 Conflict or standard detail string
  if (typeof error === 'string') return error;
  if (error.detail) {
    if (typeof error.detail === 'string') return error.detail;
    if (Array.isArray(error.detail)) {
      // Pydantic validation error array
      return error.detail.map(err => `${err.loc ? err.loc.join(' -> ') : ''}: ${err.msg}`).join(', ');
    }
  }
  if (error.message) return error.message;

  return fallbackMessage;
};
