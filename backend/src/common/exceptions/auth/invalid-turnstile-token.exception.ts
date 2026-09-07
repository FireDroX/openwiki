export class InvalidTurnstileTokenException extends Error {
  constructor() {
    super('Invalid or missing Turnstile token');
    this.name = 'InvalidTurnstileTokenException';
  }
}
