import { exitCode } from "process";

export interface Position {
    id: string;
    ownerId: string;
    collateralId: string;
    txCount: number;
    depositAmount: bigint;
    debitAmount: bigint;
    updateAt: Date;
    updateAtBlockId: string;
}

export interface Collateral {
    id: string;
    name: string;
    decimals: number;
    depositAmount: bigint;
    debitAmount: bigint;
    txCount: number;
}

export interface CollateralParams {
    id: string;
    collateralId: string;
    maximumTotalDebitValue: bigint;
    interestRatePerSec: bigint;
    liquidationRatio: bigint;
    liquidationPenalty: bigint;
    requiredCollateralRatio: bigint;
    updateAt: Date;
    updateAtBlockId: string;
}

export interface HourlyPositions {
    id: string;
    ownerId: string;
    collateralId: string;
    depositAmount: bigint;
    debitAmount: bigint;
    depositVolumeUSD: bigint;
    debitVolumeUSD: bigint;
    depositChanged: bigint;
    debitChanges: bigint;
    depositChangedUSD: bigint;
    debitChangesUSD: bigint;
    timestamp: Date;
    txCount: number;
}