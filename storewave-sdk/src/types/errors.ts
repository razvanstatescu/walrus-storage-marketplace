/**
 * Custom error classes for Storewave SDK
 */

/**
 * Base error class for all SDK errors
 */
export class StorewaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorewaveError';
    Object.setPrototypeOf(this, StorewaveError.prototype);
  }
}

/**
 * Error thrown when user has insufficient WAL balance
 */
export class InsufficientBalanceError extends StorewaveError {
  constructor(message: string = 'Insufficient WAL token balance') {
    super(message);
    this.name = 'InsufficientBalanceError';
    Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
  }
}

/**
 * Error thrown when dry run simulation fails
 */
export class DryRunFailureError extends StorewaveError {
  constructor(
    message: string,
    public dryRunError?: string,
  ) {
    super(message);
    this.name = 'DryRunFailureError';
    Object.setPrototypeOf(this, DryRunFailureError.prototype);
  }
}

/**
 * Error thrown when backend API fails
 */
export class BackendError extends StorewaveError {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'BackendError';
    Object.setPrototypeOf(this, BackendError.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends StorewaveError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when network is not supported
 */
export class UnsupportedNetworkError extends StorewaveError {
  constructor(network: string) {
    super(`Network "${network}" is not supported. Use "testnet" or "mainnet".`);
    this.name = 'UnsupportedNetworkError';
    Object.setPrototypeOf(this, UnsupportedNetworkError.prototype);
  }
}

/**
 * Error thrown when wallet has no WAL coins
 */
export class NoWalCoinsError extends InsufficientBalanceError {
  constructor(address: string) {
    super(`No WAL coins found in wallet ${address}`);
    this.name = 'NoWalCoinsError';
    Object.setPrototypeOf(this, NoWalCoinsError.prototype);
  }
}
