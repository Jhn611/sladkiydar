/** Only stable, non-sensitive codes may reach outbox errors or application logs. */
export class NotificationDeliveryError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryAfterSeconds?: number,
    public readonly configurationError = false,
  ) {
    super(code);
    this.name = 'NotificationDeliveryError';
  }
}
