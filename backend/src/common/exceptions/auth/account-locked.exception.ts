export class AccountLockedException extends Error {
  constructor(public readonly lockedUntil: Date) {
    super('Account temporarily locked due to repeated failed login attempts');
    this.name = 'AccountLockedException';
  }
}
