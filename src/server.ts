import http from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import { KaruraVaultsApi } from './api.service';
import { VaultStatusService } from './vault-status.service';

const router: Express = express() 

router.use(express.urlencoded({ extended: false }));

router.use(express.json());

router.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
        return res.status(200).json({});
    }
    next();
});

router.listen(3000, () => {
    console.log('server started on port 3000...')
})

const api = new KaruraVaultsApi('https://api.subquery.network/sq/AcalaNetwork/karura-loan')
const vaultStatus = new VaultStatusService(api);

const healthNotOk = (request: Request, response: Response, next: NextFunction) => {
    response.status(400).send('NOK')
}

router.get('/health', healthNotOk);

const healthOk = (request: Request, response: Response, next: NextFunction) => {
    response.status(200).send('OK')
}

const getYellowZoned = (request: Request, response: Response, next: NextFunction) => {
    response.status(200).json(vaultStatus.yellowZoned);
}

const getRedZonded = (request: Request, response: Response, next: NextFunction) => {
    response.status(200).json(vaultStatus.redZoned);
}



vaultStatus.updatesEmitter.on('positions initialized', ()=>{
    console.log('position initialized')
    router.get('/health', healthOk)
    router.get('/yellowZoned', getYellowZoned)
    router.get('/redZoned', getRedZonded)
})
vaultStatus.updatesEmitter.on('position updated', ()=>{
    console.log('position updated')
})


await vaultStatus.init();
vaultStatus.start()
