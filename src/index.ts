import {
  ErrorReasonEnum,
  IBalance,
  IMovement,
  IResponse,
  MovementsInErrorById,
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
  const duplicateMovementsByIds: MovementsInErrorById = {};
  // Store balance deltas by month
  const monthsBalanceDelta = Object.assign(DEFAULT_MONTHS_BALANCE_DELTA, {});

  // Compute the sum of movements by month
  const movementSums = movements.reduce((acc: number[], curr: IMovement) => {
    const month = curr.date.getMonth();
    if (!acc[month]) {
      acc[month] = 0;
    }
    const { isValid, error } = storeMovementToMap(curr, map);
    if (!isValid && error) {
      isMovementsValid = false;
      handleMovementError(curr, error, duplicateMovementsByIds);
    } else {
      acc[month] += curr.amount * 100; // cents
    }
    return acc;
  }, []);

  console.log(`Computed movementSums=${JSON.stringify(movementSums)}`);

  // Compute the balances by month
  // For the first month, we assume that the initial balance was 10k€ at the beginning of the month
  // since we only have checkpoints at the end of the month
  for (let i = 0; i < 12; i += 1) {
    const initialBalance =
      i === 0 ? 10000 * 100 : Math.floor(balances[i - 1].balance * 100); // cents
    console.log(initialBalance);
    const computedBalance = initialBalance + (movementSums?.[i] || 0);
    const delta = computedBalance - balances[i]?.balance * 100;
    if (delta !== 0 && delta > 1) {
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
    // TODO Add custom response depending on the errors encountered above
    return {
      statusCode: 400,
      message: "Invalid X or Y because of Z",
      reasons: [],
    };
  }

  return { message: "Accepted", statusCode: 202 };
};

const storeMovementToMap = (
  movement: IMovement,
  map: Map<string, IMovement>
): { isValid: boolean; error?: ErrorReasonEnum } => {
  const id = `${movement.id}`;
  const item = map.get(id);
  if (item) {
    // Duplicate entry, check reasons by criticity (diff amount > diff date > diff label)
    if (item.amount !== movement.amount) {
      // same id, different amounts
      console.warn(
        `Found a duplicate transaction for id=${id} with a different amount (t1: amount=${item.amount}, t2: amount=${movement.amount})`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_DIFFERENT_AMOUNT,
      };
    } else if (item.date.getTime() !== movement.date.getTime()) {
      // same id, different dates
      console.warn(
        `Found a duplicate transaction for id=${id} with a different date (t1: date=${item.date.toISOString()}, t2: date=${movement.date.toISOString()})`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_DIFFERENT_TIMESTAMP,
      };
    } else if (item.label !== movement.label) {
      // same id, different labels
      console.warn(
        `Found a duplicate transaction for id=${id} with a different label (t1: label=${item.label}, t2: label=${movement.label})`
      );
      return {
        isValid: false,
        error: ErrorReasonEnum.DUPLICATE_DIFFERENT_TIMESTAMP,
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
  duplicateMovementsByIds: MovementsInErrorById
): void => {
  const id = `${movement.id}`;
  // Add movement in error to duplicateMovementsByIds
  if (!duplicateMovementsByIds[id]) {
    duplicateMovementsByIds[id] = [];
  }
  duplicateMovementsByIds[id].push({
    error,
    movement,
  });
};

const handleBalanceDeltaError = (
  computedBalance: number,
  delta: number,
  month: MonthKeys,
  monthsBalanceDelta: { [key in MonthKeys]: number }
): void => {
  console.warn(
    `Found a delta in '${month}' month balance (computed=${computedBalance}, expected=${
      computedBalance + delta
    })`
  );
  monthsBalanceDelta[month] = delta;
};
