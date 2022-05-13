import { Position } from "./types";

export function getCollateralRatio(
    position: Position
): number {
    return Number(position.depositAmount/position.debitAmount) * 100
}

export async function delay(sec: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, sec * 1000);
    });
}