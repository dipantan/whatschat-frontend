/**
 * Generate a unique collection reference for a chat between two users.
 * @param {string} recipientId - The ID of the recipient user.
 * @param {string} loggedInUserId - The ID of the logged-in user.
 * @returns {string} - The collection reference string.
 */
export const generateChatCollectionRef = (
  recipientId: string,
  loggedInUserId: string
) => {
  if (!recipientId || !loggedInUserId) {
    throw new Error("Both recipientId and loggedInUserId must be provided.");
  }

  // Create a sorted array of the two IDs
  const ids = [recipientId, loggedInUserId].sort();

  // Join the sorted IDs to form the collection reference
  return ids.join("_");
};