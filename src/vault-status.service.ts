import { appendFile } from "fs";
import { KaruraVaultsApi } from "./api.service";
import { Collateral, CollateralParams, Position } from "./types";
import { getCollateralRatio } from "./utils";
import { delay } from "./utils";

export class VaultStatusService {
    private api: KaruraVaultsApi;
    private yellowZonedPositions: Record<string, Position> = {};
    private redZonedPositions: Record<string, Position> = {};
    private latestUpdatedHour: Date;
    constructor(
        api: KaruraVaultsApi
    ) {
        this.api = api;
    }

    async init() {
        console.log('initializing vaults status service...')
        console.log('fetching available positions...');
        const positions = await this.api.getPositions();
        console.log('fethcing available positions done!');
        console.log('checking liquidation status...');
        await this.checkPositions(positions);
        console.log('liquidation status check done!')
    }

    async start() {
        console.log('starting position updates listener...')
        while(true) {
            console.log('getting latest positions...')
            const positions = await this.getLatestPositions();
            console.log('checking liquidation status...')
            this.checkPositions(positions);
            console.log('liquidation status check done!')
            console.log('entering sleep until next hourly update...')
            delay(3600);
        }
    }

    async checkPositions(
        positions: Position[]
    ) {
        for(const position of positions) {
            const collateralRatio = getCollateralRatio(position);
            const liquidationRatio = await this.getLiquidationRatio(position);

            const deviation = (collateralRatio - liquidationRatio)*100/liquidationRatio;
            if(deviation < 10) {
                this.redZonedPositions[position.id] = position;
                this.yellowZonedPositions[position.id] = undefined;
            } else if(deviation < 20) {
                this.redZonedPositions[position.id] = undefined;
                this.yellowZonedPositions[position.id] = position;
            } else {
                this.redZonedPositions[position.id] = undefined;
                this.yellowZonedPositions[position.id] = undefined;
            }
        }
        this.latestUpdatedHour = await this.api.getLatestHourOfUpdate();
    }

    async getLiquidationRatio(
        position: Position
    ) {
        
        const collateralId = position.collateralId;
        if(!collateralId) {
            throw `collateral invalid`
        }
        const collaterals: Collateral[] = await this.api.collateralById(collateralId);
        if(collaterals.length === 0) {
            throw `collateral ${collateralId} does not exist`;
        }
        const collateral = collaterals[0];
        const collateralParams: CollateralParams[] = await this.api.collateralParamsById(collateralId)
        if(collateralParams.length === 0) {
            throw `collateral ${collateralId} does not exist`;
        }
        const collateralParam = collateralParams[0]
        
        const liquidationRatio = (Number(collateralParam.liquidationRatio)/collateral.decimals) * 100;

        return liquidationRatio
    }

    async getLatestPositions(): Promise<Position[]> {
        let currentHourOfUpdate = await this.api.getLatestHourOfUpdate();
        console.log(`latest hour of update: ${currentHourOfUpdate}`)
        if(currentHourOfUpdate <= this.latestUpdatedHour) {
            console.log(`latest updates already indexed, listening for new updates...`)
        }
        while(currentHourOfUpdate <= this.latestUpdatedHour) {
            delay(10);
            currentHourOfUpdate = await this.api.getLatestHourOfUpdate();
        }
        console.log('new position updates found!')
        const hourlyPositions = await this.api.hourlyPositions(currentHourOfUpdate);
        const positionIds = hourlyPositions.map((p)=>{
            const pidSplit = p.id.split('-');
            return `${pidSplit[0]}-${pidSplit[1]}`
        })
        console.log('fetching latest positions data...')
        return Promise.all(
            positionIds.map(async (pid) => {
                return await this.api.getPositionById(pid);
            })
        );
    }
}