import { envT } from "../../types";

type UrlKeys = 'api' | 'initCheck' | 'optIn' | 'optOut' | 'wb' | 'betJackpot' | 'betWinnerJackpot' | 'wbPerPlayerTopic' | 'wbGlobalTopic';
type Urls = { [key in UrlKeys]: string; };


// NOTE: The 'host' parameter in init() overrides the 'api' and 'wb' URLs at runtime.
// These defaults are fallbacks only.
const environmentUrls: Record<envT, Urls> = {
    development: {
        api: 'http://localhost:19400',
        initCheck: '/jackpot/v1/exists',
        optIn: '/jackpot/v1/optin',
        optOut: '/jackpot/v1/optin',
        wb: 'ws://localhost:19100/wsjackpot',
        wbPerPlayerTopic: '/queue/jackpot.wins.{{brandId}}-{{playerId}}',
        wbGlobalTopic: '/topic/current.{{jackpotName}}',
        betJackpot: '/jackpot/v1/event',
        betWinnerJackpot: '/jackpot/v1/event/supersecret'
    },
    staging: {
        api: 'https://backoffice.hintx.org/api/jackpot',
        initCheck: '/jackpot/v1/exists',
        optIn: '/jackpot/v1/optin',
        optOut: '/jackpot/v1/optin',
        wb: 'wss://backoffice.hintx.org/wsjackpot',
        wbPerPlayerTopic: '/queue/jackpot.wins.{{brandId}}-{{playerId}}',
        wbGlobalTopic: '/topic/current.{{jackpotName}}',
        betJackpot: '/jackpot/v1/event',
        betWinnerJackpot: '/jackpot/v1/event/supersecret'
    },
    production: {
        api: 'https://backoffice.hintx.org/api/jackpot',
        initCheck: '/jackpot/v1/exists',
        optIn: '/jackpot/v1/optin',
        optOut: '/jackpot/v1/optin',
        wb: 'wss://backoffice.hintx.org/wsjackpot',
        wbPerPlayerTopic: '/queue/jackpot.wins.{{brandId}}-{{playerId}}',
        wbGlobalTopic: '/topic/current.{{jackpotName}}',
        betJackpot: '/jackpot/v1/event',
        betWinnerJackpot: '/jackpot/v1/event/supersecret'
    }
}

function getUrls(env: envT): Urls {
    return environmentUrls[env];
}

function setUrl(env: envT, key: UrlKeys, value: string) {
    environmentUrls[env][key] = value;
}

export { setUrl, getUrls };
