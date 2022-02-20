import { IMovement } from "../interfaces";
import crypto from "crypto";

export const generateMovements = (
  movementsCount: number,
  minAmount: number,
  maxAmount: number
): IMovement[] => {
  const movements: IMovement[] = [];
  for (let i = 0; i < movementsCount; i += 1) {
    const isRefund = Math.random() > 0.45;
    movements.push(buildMovement(isRefund, minAmount, maxAmount, i));
  }

  return movements;
};

const buildMovement = (
  isRefund: boolean,
  minAmount: number,
  maxAmount: number,
  id: number
): IMovement => {
  const amount = Number(
    (
      minAmount +
      Math.random() * (maxAmount - minAmount) * (isRefund ? -1 : 1)
    ).toFixed(2)
  );
  const label = `${isRefund ? "Refund" : "Settlement"} - id=${crypto
    .randomBytes(10)
    .toString("hex")}`;

  return {
    id,
    label,
    amount,
    date: randomDate(new Date("2021-01-31"), new Date("2021-12-31")),
  };
};

const randomDate = (start: Date, end: Date): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};
