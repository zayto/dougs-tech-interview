import fs from "fs";
import { generateMovements } from "./data";
import { IMovement } from "../interfaces";

// Generate 200 movements (refund/settlement) between 100€ and 1000€ (with a 2 digits precision)
const movements = generateMovements(200, 100, 1000)
  .sort((m1, m2) => {
    const t1 = m1.date.getTime();
    const t2 = m2.date.getTime();
    return t1 === t2 ? 0 : t1 < t2 ? -1 : 1;
  })
  .map((movement, index) => ({ ...movement, id: index })); // Rewrite ids to have sorted ids by increasing time

// Compute the sum of movements by month
const movementSums = movements.reduce((acc: number[], curr: IMovement) => {
  const month = curr.date.getMonth();
  if (!acc[month]) {
    acc[month] = 0;
  }
  acc[month] += curr.amount * 100; // cents
  return acc;
}, []);

// Compute the balance history at the end of each month (starting at 10k€ in January 1st)
const balanceHistory: number[] = [];
movementSums.forEach((value, index) => {
  if (index === 0) {
    balanceHistory.push(10000 * 100 + value); // cents
    return;
  }
  balanceHistory.push(balanceHistory[index - 1] + value);
});
const balanceByMonth = balanceHistory.map((centsValue) => centsValue / 100);
console.log(balanceByMonth);

// Write movements JSON file locally
fs.writeFile(
  "./src/resources/movements.json",
  JSON.stringify(movements),
  "utf8",
  function (err) {
    if (err) {
      console.error(err);
      return;
    }

    console.log("File movements.json has been saved.");
  }
);

fs.writeFile(
  "./src/resources/balances.json",
  JSON.stringify(balanceByMonth),
  "utf8",
  function (err) {
    if (err) {
      console.error(err);
      return;
    }

    console.log("File balances.json has been saved.");
  }
);
