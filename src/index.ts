import {
  ErrorReasonEnum,
  IBalance,
  IMovement,
  IResponse,
  IStoredMovement,
  IMovementsInErrorById,
  IMovementError,
} from "./interfaces";
import {
  DEFAULT_MONTHS_BALANCE_DELTA,
  getMonthByIndex,
  MonthKeys,
} from "./utils";

export const validateMovements = (
  movements: IMovement[],
  balances: IBalance[]
): IResponse => {
  if (!(balances?.length > 0)) {
    console.error(`Invalid balances provided`, { balances });
    throw new Error(`Invalid balances provided`);
  }
  let isMovementsValid = true;
  let isBalanceValid = true;

  // Map to store each movement and help identify duplicates or errors
  const map = new Map<string, IMovement>();
  // Store duplicate transactions
  const duplicateMovementsByIds: IMovementsInErrorById = {};
  // Store balance deltas by month
  const monthsBalanceDelta = Object.assign(DEFAULT_MONTHS_BALANCE_DELTA, {});

  // Compute the sum of movements by month
  // TODO Would have to rework that part as we sometimes gets rounding errors later
  // If every sum/diff is properly computed in cents, we shouldn't have any errors
  const movementSums = movements.reduce((acc: number[], curr: IMovement) => {
    const month = curr.date.getMonth();
    if (!acc[month]) {
      acc[month] = 0;
    }
    const { isValid, error, inConflictWith } = storeMovementToMap(curr, map);
    if (!isValid && error) {
      // If there was an error due to a duplicate we discard it and log it
      isMovementsValid = false;
      handleMovementError(curr, error, inConflictWith, duplicateMovementsByIds);
    } else {
      acc[month] += Math.floor(curr.amount * 100); // cents
    }
    return acc;
  }, []);

  console.log(`Computed movementSumsByMonths=${JSON.stringify(movementSums)}`);

  // Compute the balances by month
  // For the first month, we assume that the initial balance was 10k€ at the beginning of the month
  // since we only have checkpoints at the end of the month
  for (let i = 0; i < 12; i += 1) {
    const initialBalance =
      i === 0 ? 10000 * 100 : Math.floor(balances[i - 1].balance * 100); // cents
    // console.log(`Before month ${i} initialBalance: ${initialBalance}`);
    const computedBalance = initialBalance + (movementSums?.[i] || 0); // cents
    // console.log(`Computed balance for month ${i}: ${computedBalance}`);
    const delta = computedBalance - Math.floor(balances[i]?.balance * 100); // cents
    console.log(`Computed delta for month ${i}: ${delta}`);
    if (delta !== 0 && Math.abs(delta) > 1) {
      // Delta between provided balance and computed balance (> 1 cent)
      isBalanceValid = false;
      handleBalanceDeltaError(
        computedBalance,
        delta,
        getMonthByIndex(i),
        monthsBalanceDelta
      );
    }
  }

  const isValid = isBalanceValid && isMovementsValid;

  if (!isValid) {
    const result: IResponse = {
      statusCode: 400,
      message: `Invalid ${!isBalanceValid ? "balance" : ""}${
        !isBalanceValid && !isMovementsValid ? " and " : ""
      }${
        !isMovementsValid ? "movements" : ""
      }. See the errors array for more info`,
      errors: [],
    };
    if (!isBalanceValid) {
      for (const [key, month] of Object.entries(monthsBalanceDelta)) {
        if (month === 0) {
          delete monthsBalanceDelta[key as MonthKeys];
        }
      }
      const errorMessage = `Error: ${
        Object.values(monthsBalanceDelta).length
      } months had a computed balance delta (invalid balance)`;
      result.errors.push({
        reason: ErrorReasonEnum.INVALID_COMPUTED_BALANCE,
        data: monthsBalanceDelta,
        message: errorMessage,
      });
    }
    if (!isMovementsValid) {
      for (const [id, duplicates] of Object.entries(duplicateMovementsByIds)) {
        const duplicateErrors = duplicates.map((duplicate: IMovementError) => ({
          reason: duplicate.error,
          message: duplicate.message,
          data: duplicate.movement,
        }));

        result.errors.push(...duplicateErrors);
      }
    }
    result.message = `${result.message} (${result.errors?.length} errors)`;
    return result;
  }

  return { message: "Accepted", statusCode: 202, errors: [] };
};

const storeMovementToMap = (
  movement: IMovement,
  map: Map<string, IMovement>
): IStoredMovement => {
  const id = `${movement.id}`;
  const item = map.get(id);
  if (!!item) {
    // Duplicate entry, check reasons by criticity (diff amount > diff date > diff label)
    if (item.amount !== movement.amount) {
      // same id, different amounts
      console.error(
        `Found a duplicate transaction for id=${id} with a different amount (t1: amount=${item.amount}, t2: amount=${movement.amount})`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_MOVEMENT_DIFFERENT_AMOUNT,
        inConflictWith: item,
      };
    } else if (item.date.getTime() !== movement.date.getTime()) {
      // same id, different dates
      console.error(
        `Found a duplicate transaction for id=${id} with a different date (t1: date=${item.date?.toISOString()}, t2: date=${movement.date?.toISOString()})`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_MOVEMENT_DIFFERENT_TIMESTAMP,
        inConflictWith: item,
      };
    } else if (item.label !== movement.label) {
      // same id, different labels
      console.error(
        `Found a duplicate transaction for id=${id} with a different label (t1: label=${item.label}, t2: label=${movement.label})`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_MOVEMENT_DIFFERENT_TIMESTAMP,
        inConflictWith: item,
      };
    } else {
      // same id, duplicate content
      console.error(
        `Found a duplicate transaction for id=${id} with the exact same content as transaction=${item.id} already handled`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_MOVEMENT_ENTRY,
        inConflictWith: item,
      };
    }
  }
  // Store movement in map
  map.set(id, movement);
  return { isValid: true };
};

const handleMovementError = (
  movement: IMovement,
  error: ErrorReasonEnum,
  inConflictWith: IMovement | undefined,
  duplicateMovementsByIds: IMovementsInErrorById
): void => {
  const id = `${movement.id}`;
  // Add movement in error to duplicateMovementsByIds
  if (!duplicateMovementsByIds[id]) {
    duplicateMovementsByIds[id] = [];
  }

  const inConflictWithError = `${
    !!inConflictWith
      ? `, in conflict with movement ${
          inConflictWith?.id
        } made on ${inConflictWith?.date?.toISOString()}`
      : ""
  }`;
  duplicateMovementsByIds[id].push({
    error,
    movement,
    message: `Movement with id=${id} is invalid due to error type ${error}${inConflictWithError}`,
  });
};

const handleBalanceDeltaError = (
  computedBalance: number,
  delta: number,
  month: MonthKeys,
  monthsBalanceDelta: { [key in MonthKeys]: number }
): void => {
  console.error(
    `Found a delta in '${month}' month balance (computed=${computedBalance}, expected=${Math.floor(
      computedBalance + delta
    )})`
  );
  monthsBalanceDelta[month] = delta;
};
