/**
 * Recursively removes all functions and non-serializable fields from an object or array.
 * Preserves the original structure (Object or Array).
 */
export const stripActions = (data) => {
  // Handle Null or Non-Object values
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => stripActions(item));
  }

  // Handle Objects
  return Object.keys(data).reduce((acc, key) => {
    const value = data[key];
    
    // Skip functions
    if (typeof value === 'function') {
      return acc;
    }
    
    // Recursively strip nested objects/arrays
    acc[key] = stripActions(value);
    
    return acc;
  }, {});
};
