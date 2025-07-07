export const ERR_PORTFOLIO_NAME_EXISTS = 'Portfolio name already exists';
export const ERR_PORTFOLIO_NOT_FOUND = 'Portfolio not found';
export const ERR_PORTFOLIO_ACCESS_DENIED = 'Access denied to portfolio';
export const ERR_PORTFOLIO_CANNOT_DELETE_DEFAULT = 'Cannot delete default portfolio';
export const ERR_PORTFOLIO_CANNOT_UNSET_DEFAULT = "Cannot unset default when it's the only portfolio";

// Portfolio Holdings errors
export const ERR_HOLDING_TOKEN_ALREADY_EXISTS = 'Token already exists in this portfolio';
export const ERR_HOLDING_NOT_FOUND = 'Portfolio holding not found';
export const ERR_HOLDING_ALREADY_REMOVED = 'Portfolio holding already removed';
export const ERR_HOLDING_ACCESS_DENIED = 'Access denied to portfolio holding';
export const ERR_HOLDING_INVALID_TOKEN_SYMBOL = 'Invalid token symbol format';

// Transaction errors
export const ERR_TRANSACTION_NOT_FOUND = 'Transaction not found';
export const ERR_TRANSACTION_ACCESS_DENIED = 'Access denied to transaction';
export const ERR_TRANSACTION_INVALID_AMOUNT =
    'Amount must be positive for BUY/DEPOSIT and negative for SELL/WITHDRAWAL';
export const ERR_TRANSACTION_PRICE_REQUIRED = 'Price per token is required for BUY, SELL, and SWAP transactions';
export const ERR_TRANSACTION_FUTURE_DATE = 'Transaction date cannot be in the future';
export const ERR_TRANSACTION_INSUFFICIENT_BALANCE = 'Insufficient balance for this transaction';
export const ERR_TRANSACTION_INVALID_EXTERNAL_ID =
    'External ID is required for SWAP transactions and must be null for other types';
