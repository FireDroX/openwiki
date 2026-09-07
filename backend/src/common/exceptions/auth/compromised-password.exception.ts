export class CompromisedPasswordException extends Error {
  constructor() {
    super('This password has appeared in a known data breach');
    this.name = 'CompromisedPasswordException';
  }
}
