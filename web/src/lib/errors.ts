import { ApiError } from './api';

/** Turns any thrown value into a message that is safe and helpful to show a user. */
export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) return err.messages[0];
  return 'Something unexpected happened. Please try again.';
}
