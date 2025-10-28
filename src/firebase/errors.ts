
/**
 * Defines the shape of the context for a Firestore security rule denial.
 * This information is used to construct a detailed error message that helps
 * developers debug their security rules.
 */
export type SecurityRuleContext = {
  // The full path to the document or collection being accessed (e.g., 'users/userId/posts/postId').
  path: string;
  // The type of operation that was denied.
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  // The data that was being sent with the request (for create/update operations).
  requestResourceData?: any;
};

/**
 * A custom error class specifically for Firestore permission errors.
 * It formats a detailed error message including the security rule context,
 * which is then displayed in the Next.js error overlay during development.
 */
export class FirestorePermissionError extends Error {
  constructor(context: SecurityRuleContext) {
    // Construct a detailed error message.
    const message = `
FirestoreError: Missing or insufficient permissions.

The following request was denied by Firestore Security Rules:
------------------------------------------------
Auth & Request Context:
{
  "auth": "request.auth",
  "method": "${context.operation}",
  "path": "/databases/(default)/documents/${context.path}",
  ${context.requestResourceData ? `"resource": ${JSON.stringify(
    { data: context.requestResourceData },
    null,
    2
  )}` : ''}
}
------------------------------------------------

Debugging Tips:
1. Check your Firestore Security Rules (/firestore.rules).
2. Ensure the authenticated user (request.auth) has the required permissions for the '${context.operation}' operation on the path '${context.path}'.
3. Verify the data being sent (resource.data) matches any validation rules.
`;

    super(message);
    this.name = 'FirestorePermissionError';

    // This ensures the stack trace is captured correctly.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
