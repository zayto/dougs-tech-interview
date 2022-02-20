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
  reasons?: ErrorReasonEnum[];
}

export type MovementsInErrorById = {
  [id: string]: { error: ErrorReasonEnum; movement: IMovement }[];
};

export enum ErrorReasonEnum {
  DUPLICATE_DIFFERENT_AMOUNT = "DUPLICATE_DIFFERENT_AMOUNT",
  DUPLICATE_DIFFERENT_TIMESTAMP = "DUPLICATE_DIFFERENT_TIMESTAMP",
  DUPLICATE_DIFFERENT_LABEL = "DUPLICATE_DIFFERENT_LABEL",
}
