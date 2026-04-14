// Converts a raw Firebase/JS error into a user-friendly message
export const getErrorMessage = (err) => {
  console.error('Full error:', err);

  if (err.message?.includes('not authenticated') || err.message?.includes('Not auth')) {
    return 'Session expired. Please log out and log in again.';
  }
  if (err.code === 'permission-denied') {
    return 'Permission denied. Check Firestore security rules.';
  }
  if (err.code === 'unavailable') {
    return 'No internet connection. Please try again.';
  }
  if (err.code === 'not-found') {
    return 'Data not found. It may have been deleted.';
  }
  if (err.message?.includes('index') || err.code === 'failed-precondition') {
    return 'Database index missing. Check browser console for a fix link.';
  }
  return `Error: ${err.message || 'Something went wrong. Please try again.'}`;
};
