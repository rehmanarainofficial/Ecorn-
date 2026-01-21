/**
 * Formats a number or string with comma separators.
 * Example: 1234567.89 -> 1,234,567.89
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '0';

  // Handle strings with commas (e.g., "127,456,789")
  let cleanValue = value;
  if (typeof value === 'string') {
    cleanValue = value.replace(/,/g, '').trim();
  }

  const num = parseFloat(cleanValue);
  if (isNaN(num)) return '0';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formats a number with comma separators but no decimals if it's an integer.
 * @param {number|string} value
 * @returns {string}
 */
export const formatQuantity = value => {
  if (value === null || value === undefined || value === '') return '0';

  // Handle strings with commas (e.g., "127,456,789")
  let cleanValue = value;
  if (typeof value === 'string') {
    cleanValue = value.replace(/,/g, '').trim();
  }

  const num = parseFloat(cleanValue);
  if (isNaN(num)) return '0';

  return num.toLocaleString('en-US');
};
