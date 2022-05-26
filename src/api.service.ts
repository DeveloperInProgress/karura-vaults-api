import * as http from 'http';
import * as https from 'https';
import axios, {AxiosInstance} from 'axios';
import { Collateral, HourlyPositions, Position } from './types';
import { time } from 'console';

export class KaruraVaultsApi {
    connection: AxiosInstance;
    constructor(
        endpoint: string
    ) {
        const httpAgent = new http.Agent({ keepAlive: true });
        const httpsAgent = new https.Agent({ keepAlive: true });
        
        this.connection = axios.create({
            httpAgent,
            httpsAgent,
            baseURL: endpoint,
            headers: {
                Accept: 'application/json'
            }
        })
    }

    async getPositions(): Promise<Position[]> {
        const query = `
        query {
            positions  {
                nodes {
                    id
                    ownerId
                    collateralId
                    txCount
                    depositAmount
                    debitAmount
                    updateAt
                    updateAtBlockId
                }
            }
        }
        `
        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.positions.nodes;
    }    

    async getPositionById(id: string): Promise<Position> {
        const query = `
        query {
            positions(filter:{id:{equalTo: ${id}}}) {
                nodes {
                    id
                    ownerId
                    collateralId
                    txCount
                    depositAmount
                    debitAmount
                    updateAt
                    updateAtBlockId
                }
            }
        }
        `

        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.positions.nodes[0];
    }

    async collateralById(
        id: string
    ):  Promise<Collateral[]> {
        const query = `
        query {
            collaterals(filter:{id:{equalTo: "${id}"}})  {
                nodes {
                   id
                  name
                  decimals
                  depositAmount
                  debitAmount
                }
            }
        }
        `

        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.collaterals.nodes;
    }

    async collateralParamsById(
        id: string
    ) {
        const query = `
        query {
            collateralParams(filter:{id:{equalTo: "${id}"}})  {
                nodes {
                   id
                  collateralId
                  maximumTotalDebitValue
                  interestRatePerSec
                  liquidationRatio
                  liquidationPenalty
                  requiredCollateralRatio
                  updateAt
                  updateAtBlockId
                }
            }
        }
        `

        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.collateralParams.nodes;
    }

    async ownerById(
        id: string
    ) {
        const query = `
        query {
            accounts(filter:{id:{equalTo: "${id}"}})  {
                nodes {
                   id
                  address
                  txCount
                }
            }
        }
        `
        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.accounts.nodes;
    }
 
    async getLatestHourOfUpdate(): Promise<Date> {
        const query = `
        query {
            hourlyPositions(first: 1, orderBy: TIMESTAMP_DESC)  {
                nodes {
                   timestamp
                }
            }
        }
        `

        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.hourlyPositions.nodes[0].timestamp;
    }

    async hourlyPositions(timestamp: Date): Promise<HourlyPositions[]> {
        const query = `
        query {
            hourlyPositions(filter: {timestamp: {equalTo: "${timestamp}"}})  {
                nodes {
                id
                  ownerId
                  collateralId
                  depositAmount
                  debitAmount
                  depositVolumeUSD
                  debitVolumeUSD
                  depositChanged
                  debitChanged
                  depositChangedUSD
                  debitChangedUSD
                  debitExchangeRate
                  timestamp
                  txCount
                }
            }
        }
        `
        console.log(query)
        const {data} = await this.connection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.hourlyPositions.nodes;
    }
}