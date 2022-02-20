import { validateMovements } from "./index";
import { IBalance, IMovement } from "./interfaces";

import inputValidMovements from "./resources/input-valid-movements.json";
import inputDuplicateIdsMovements from "./resources/input-duplicate-ids-movements.json";
import inputDuplicateMovementsDiffAmounts from "./resources/input-duplicate-movements-diff-amounts.json";
import inputInvalidBalances1 from "./resources/input-invalid-balances.json";
import inputInvalidBalancesAndMovements from "./resources/input-invalid-balances-movements.json";
import inputBalances from "./resources/balances.json";
import { parseMovementsWithDates } from "./utils";

// Valid input
const movements: IMovement[] = parseMovementsWithDates(inputValidMovements);
const balances: IBalance[] = inputBalances.map((b) => ({
  ...b,
  date: new Date(b.date),
}));

const response = validateMovements(movements, balances);
console.log(`${JSON.stringify(response, null, 2)}\n\n`);

// Invalid movements (duplicate entries to simulate scrapping error that retrieved the same item multiple times)
const invalidMovements1: IMovement[] = parseMovementsWithDates(
  inputDuplicateIdsMovements
);

const invalidResponse1 = validateMovements(invalidMovements1, balances);
console.log(`${JSON.stringify(invalidResponse1, null, 2)}\n\n`);

// Invalid movements (duplicate entries with different amounts => will create movements errors but no balances errors
// because we ignore them and log them as duplicate entries)
const invalidMovements2: IMovement[] = parseMovementsWithDates(
  inputDuplicateMovementsDiffAmounts
);

const invalidResponse2 = validateMovements(invalidMovements2, balances);
console.log(`${JSON.stringify(invalidResponse2, null, 2)}\n\n`);

// Invalid movements compared to the actual balance (added movements not part of the balance
// => it will falsify the sums by months)
// See added transactions with ids 200 / 215 / 218 / 300
const invalidBalances1: IMovement[] = parseMovementsWithDates(
  inputInvalidBalances1
);
const invalidResponse3 = validateMovements(invalidBalances1, balances);
console.log(`${JSON.stringify(invalidResponse3, null, 2)}\n\n`);

// Both duplicate entries and added movements that will falsify the balances
const invalidBalances2 = parseMovementsWithDates(
  inputInvalidBalancesAndMovements
);
const invalidResponse4 = validateMovements(invalidBalances2, balances);
console.log(`${JSON.stringify(invalidResponse4, null, 2)}\n\n`);
