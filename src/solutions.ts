import { validateMovements } from "./index";
import { IBalance, IMovement } from "./interfaces";

import inputMovements from "./resources/movements.json";
import inputBalances from "./resources/balances.json";

const movements: IMovement[] = inputMovements.map((m) => ({
  ...m,
  date: new Date(m.date),
}));
const balances: IBalance[] = inputBalances.map((b) => ({
  ...b,
  date: new Date(b.date),
}));

const response = validateMovements(movements, balances);
console.log(JSON.stringify(response));
