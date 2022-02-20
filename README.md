# Dougs Tech Interview

## Usage

- Install dependencies with `npm install`
- Run the solution with `npm run 01` (different test inputs provided) and check the console logs

## Main ideas

- The function validateMovements takes the movements and expected balances as input and returns a valid answer (statusCode 202) or an error (statusCode 400) with a descriptive error message and descriptive error objects.

```typescript
function validateMovements(
  movements: IMovement[],
  balances: IBalance[]
): IResponse {}

export interface IResponse {
  statusCode: number;
  message: string;
  errors: IError[];
}
```

- While we compute the movements by months, we store the movement errors with some metadata about the error inside `duplicateMovementsByIds` (~ map for movements in error). We use a map (`new Map<string, IMovement>();`) to identify duplicate movements using their id as a key.

- We use those 2 models to store and remember the movements in error (inside `duplicateMovementsByIds`) and to remember the movement that was initially handled (in conflict).

```typescript
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
```

- Storing the movements in errors helps us build this array of errors in the output response (that contains a reason, a descriptive error message and an error code):

```typescript
// IMovementErrors are built while retrieving the duplicate movements
export interface IMovementError {
  error: ErrorReasonEnum;
  movement: IMovement;
  message: string;
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
```

- When we compute the balances by months and do the delta (difference with the expected value provided by the bank), we also raise errors for invalid balances by months.

```typescript
// This is added to the response errors array
const balanceError = {
  reason: ErrorReasonEnum.INVALID_COMPUTED_BALANCE,
  data: monthsBalanceDelta,
  message: errorMessage,
};
```

## To improve

- Add unit tests on each function with different types of inputs
- Improve the input validation (expect valid JSON, valid values on every movement - e.g. valid numbers, no nulls/NaN after parsing).
- We could use the movements labels to make the movements in errors more readable to the end user (so far only the ids/amounts/dates were used)
- Improve the computations of balances with cents (currently we have deltas errors sometimes raised due to the Math.floor usage) to avoid rounding errors and define at what precision we want to work (cents?)
- The code was written in a functional approach but it could be refactored to a `MovementValidator` class if needed
- Could add some more details such as the number of valid transactions taken into account by month (vs the total number that can contain duplicates). This could help the end-user to identify if some transactions are missing.
