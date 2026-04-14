// Removes all undefined values from an object before sending to Firestore.
// Firestore does NOT accept undefined — it will throw a cryptic error.
export const cleanData = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};
