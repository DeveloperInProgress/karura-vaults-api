import { appendFile } from "fs";
import { KaruraVaultsApi } from "./api.service";
import { Collateral, CollateralParams, Position } from "./types";
import { delay } from "./utils";
import { EventEmitter } from "events"
;
export class VaultStatusService {
    private api: KaruraVaultsApi;
    private yellowZonedPositions: Record<string, Position | undefined> = {};
    private redZonedPositions: Record<string, Position | undefined> = {};
    private latestUpdatedHour: Date;
    private collateralParamsCache: Record<string, CollateralParams> = {};
    private collateralCache: Record<string, Collateral> = {};
    updatesEmitter: EventEmitter;
    constructor(
        api: KaruraVaultsApi
    ) {
        this.api = api;
        this.latestUpdatedHour = new Date();
        this.updatesEmitter = new EventEmitter();
        this.yellowZonedPositions = {};
        this.redZonedPositions = {};
        this.collateralParamsCache = {};
        this.collateralCache = {};
    }

    async init() {
        console.log('initializing vaults status service...')
        console.log('fetching available positions...');
        const positions = await this.api.getPositions();
        console.log('fethcing available positions done!');
        console.log('checking liquidation status...');
        await this.checkPositions(positions);
        console.log('liquidation status check done!')
        this.updatesEmitter.emit('positions initialized')
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
            this.updatesEmitter.emit('position updated');
            delay(3600);
        }
    }

    async checkPositions(
        positions: Position[]
    ) {
        for(const position of positions) {
            const collateralRatio = await this.getCollateralRatio(position);
            const liquidationRatio = await this.getLiquidationRatio(position);

            const deviation = (collateralRatio - liquidationRatio)*100/liquidationRatio;
            if(deviation < 10) {
                this.redZonedPositions[position.id] = position;
                this.yellowZonedPositions[position.id] = undefined
            } else if(deviation < 20) {
                this.redZonedPositions[position.id] = undefined;
                this.yellowZonedPositions[position.id] = position;
            } else {
                this.yellowZonedPositions[position.id] = undefined;
                this.redZonedPositions[position.id] = undefined; 
                //}
            }
        }
        this.latestUpdatedHour = await this.api.getLatestHourOfUpdate();
    }

    async getCollateralRatio(
        position: Position,
    ): Promise<number> {
        const collateral = !this.collateralCache[position.collateralId] ? await this.api.collateralById(position.collateralId) : this.collateralCache[position.collateralId];
        this.collateralCache[position.collateralId] = collateral;
        const price = Number(collateral.price)/Math.pow(10, collateral.decimal-1);
        return Number(position.collateralAmount) * price/Number(position.debitAmount) * 100
    }

    async getLiquidationRatio(
        position: Position
    ) {
        
        const collateralId = position.collateralId;
        if(!collateralId) {
            throw `collateral invalid`
        }

        const collateralParam: CollateralParams = !this.collateralParamsCache[collateralId] ? await this.api.collateralParamsById(collateralId) : this.collateralParamsCache[collateralId];
        this.collateralParamsCache[collateralId] = collateralParam;
        
        const liquidationRatio = (Number(collateralParam.liquidationRatio)/Math.pow(10,18)) * 100;

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

    get yellowZoned() {
        return this.yellowZonedPositions;
    }

    get redZoned() {
        return this.redZonedPositions;
    }
}