export interface IMovement {
  id: number;
  date: Date;
  label: string;
  amount: number;
}

export interface IBalance {
  date: Date;
  balance: number;
}

export interface IResponse {
  statusCode: number;
  message: string;
  errors: IError[];
}

export interface IError {
  reason: ErrorReasonEnum;
  message?: string;
  data?: any;
}

export interface IMovementsInErrorById {
  [id: string]: IMovementError[];
}

export interface IMovementError {
  error: ErrorReasonEnum;
  movement: IMovement;
  message: string;
}

export interface IStoredMovement {
  isValid: boolean;
  error?: ErrorReasonEnum;
  inConflictWith?: IMovement;
}

export enum ErrorReasonEnum {
  DUPLICATE_MOVEMENT_DIFFERENT_AMOUNT = "DUPLICATE_DIFFERENT_AMOUNT",
  DUPLICATE_MOVEMENT_DIFFERENT_TIMESTAMP = "DUPLICATE_DIFFERENT_TIMESTAMP",
  DUPLICATE_MOVEMENT_DIFFERENT_LABEL = "DUPLICATE_DIFFERENT_LABEL",
  DUPLICATE_MOVEMENT_ENTRY = "DUPLICATE_MOVEMENT_ENTRY",
  INVALID_COMPUTED_BALANCE = "INVALID_COMPUTED_BALANCE",
}
