import * as http from 'http';
import * as https from 'https';
import axios, {AxiosInstance} from 'axios';
import { Collateral, HourlyPositions, Position } from './types';
import { time } from 'console';

export class AcalaVaultsApi {
    loanconnection: AxiosInstance;
    acalaconnection: AxiosInstance;
    constructor() {
        const httpAgent = new http.Agent({ keepAlive: true });
        const httpsAgent = new https.Agent({ keepAlive: true });
        
        this.loanconnection = axios.create({
            httpAgent,
            httpsAgent,
            baseURL: 'https://api.subquery.network/sq/AcalaNetwork/acala-loans',
            headers: {
                Accept: 'application/json'
            }
        })
        this.acalaconnection = axios.create({
            httpAgent,
            httpsAgent,
            baseURL: 'https://api.subquery.network/sq/AcalaNetwork/acala',
            headers: {
                Accept: 'application/json'
            }
        })
    }

    async getPositions(): Promise<Position[]> {
        let i = 0;
        const positions: Position[] = [];
        while(true) {
            const query = `
            query {
                loanPositions(offset: ${i})  {
                    nodes {
                        id
                        ownerId
                        collateralId
                        collateralAmount
                        debitAmount
                    }
                }
            }
            `
            const {data} = await this.acalaconnection.get(
                '/',
                {
                    params: {
                        query: query
                    }
                }
            )

            if(data.data.loanPositions.nodes.length === 0) {
                break;
            }

            positions.push(...data.data.loanPositions.nodes);
            i += 100;
        }

        return positions;
    }    

    async getPositionById(id: string): Promise<Position> {
        const query = `
        query {
            loanPositions(filter:{id:{equalTo: "${id}"}}) {
                nodes {
                    id
                    ownerId
                    collateralId
                    collateralAmount
                    debitAmount
                }
            }
        }
        `

        const {data} = await this.acalaconnection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.loanPositions.nodes[0];
    }

    async getPositionsByOwnerId(id: string): Promise<Position[]> {
        const query = `
        query {
            loanPositions(filter:{ownerId:{equalTo: "${id}"}}) {
                nodes {
                    id
                    ownerId
                    collateralId
                    collateralAmount
                    debitAmount
                }
            }
        }
        `

        const {data} = await this.acalaconnection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.loanPositions.nodes;
    }

    async collateralById(
        id: string
    ):  Promise<Collateral> {
        const query = `
        query {
            tokens(filter:{id:{equalTo: "${id}"}})  {
                nodes {
                   id
                  name
                  decimal
                  price
                }
            }
        }
        `

        const {data} = await this.acalaconnection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.tokens.nodes[0];
    }

    async collateralParamsById(
        id: string
    ) {
        const query = `
        query {
            loanParams(filter:{collateralId:{equalTo: "${id}"}})  {
                nodes {
                   id
                  collateralId
                  maximumTotalDebitValue
                  interestRatePerSec
                  liquidationRatio
                  liquidationPenalty
                  requiredCollateralRatio
                }
            }
        }
        `

        const {data} = await this.acalaconnection.get(
            '/',
            {
                params: {
                    query: query
                }
            }
        )

        return data.data.loanParams.nodes[0];
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
        const {data} = await this.acalaconnection.get(
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

        const {data} = await this.loanconnection.get(
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
        const {data} = await this.loanconnection.get(
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