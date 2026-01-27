/**
 * Centralized Date Utility for dd/mm/yyyy formatting
 */

export const formatDate = date => {
  if (!date || !(date instanceof Date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateString = dateStr => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';

  // Try to parse the string. common API formats: yyyy-mm-dd, yyyy/mm/dd
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // If parsing fail, check if it's already in a recognizable format
      // or just return as is if we can't be sure
      return dateStr;
    }
    return formatDate(d);
  } catch (e) {
    return dateStr;
  }
};

export const formatToYYYYMMDD = date => {
  if (!date || !(date instanceof Date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
