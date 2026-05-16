const urlBase = `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
const apiV1 = '/api/v1'
const noService = '' // temporary because BE is not multi-service yet
const gatewayService = '/gateway'
const jackpotService = '/jackpot'
const luckyWheelService = '/luckywheel'
const scratchCardService = '/scratchcard'

const urls = {

  user: {
    login: `${urlBase}${gatewayService}${apiV1}/authenticate`,
    info: `${urlBase}${gatewayService}${apiV1}/account`,
  },
  brand: {
    getAll: `${urlBase}${gatewayService}${apiV1}/brands`,
    create: `${urlBase}${gatewayService}${apiV1}/brands`,
    update: `${urlBase}${gatewayService}${apiV1}/brands`,
    delete: `${urlBase}${gatewayService}${apiV1}/brands`,
    generateSignature: `${urlBase}${gatewayService}${apiV1}/brands/signature/generate/{{brandId}}/{{playerId}}/{{eventId}}`,
    verifySignature: `${urlBase}${gatewayService}${apiV1}/brands/signature/verify/{{brandId}}`,
  },
  players: {
    getAll: `${urlBase}${noService}${apiV1}/players`,
    create: `${urlBase}${noService}${apiV1}/players`,
    update: `${urlBase}${noService}${apiV1}/players`,
    delete: `${urlBase}${noService}${apiV1}/players`,
  },
  jackpots: {
    getAll: `${urlBase}${noService}${apiV1}/jackpots`,
    create: `${urlBase}${noService}${apiV1}/jackpots`,
    update: `${urlBase}${noService}${apiV1}/jackpots`,
    delete: `${urlBase}${noService}${apiV1}/jackpots`,
  },
  segments: {
    getAll: `${urlBase}${noService}${apiV1}/segments`,
    create: `${urlBase}${noService}${apiV1}/segments`,
    update: `${urlBase}${noService}${apiV1}/segments`,
    delete: `${urlBase}${noService}${apiV1}/segments`,
    file: `${urlBase}${noService}${apiV1}/segments/file`,
  },
  events: {
    getAll: `${urlBase}${noService}${apiV1}/events`,
    create: `${urlBase}${noService}${apiV1}/events`,
    update: `${urlBase}${noService}${apiV1}/events`,
    delete: `${urlBase}${noService}${apiV1}/events`,
    file: `${urlBase}${noService}${apiV1}/events/file`,
  },
  currencies: {
    getAll: `${urlBase}${noService}${apiV1}/currencies`,
    create: `${urlBase}${noService}${apiV1}/currencies`,
    update: `${urlBase}${noService}${apiV1}/currencies`,
    delete: `${urlBase}${noService}${apiV1}/currencies`,
  },
  playerOptins: {
    getAll: `${urlBase}${noService}${apiV1}/player-optins`,
    create: `${urlBase}${noService}${apiV1}/player-optins`,
    update: `${urlBase}${noService}${apiV1}/player-optins`,
  },
  seeds: {
    getAll: `${urlBase}${noService}${apiV1}/seeds`,
    getById: `${urlBase}${noService}${apiV1}/seeds`,
    create: `${urlBase}${noService}${apiV1}/seeds`,
    update: `${urlBase}${noService}${apiV1}/seeds`,
    delete: `${urlBase}${noService}${apiV1}/seeds`,
  },
  pools: {
    getAll: `${urlBase}${noService}${apiV1}/pools`,
    getById: `${urlBase}${noService}${apiV1}/pools`,
    create: `${urlBase}${noService}${apiV1}/pools`,
    update: `${urlBase}${noService}${apiV1}/pools`,
    delete: `${urlBase}${noService}${apiV1}/pools`,
  },
  wins: {
    getAll: `${urlBase}${noService}${apiV1}/wins`,
    create: `${urlBase}${noService}${apiV1}/wins`,
    update: `${urlBase}${noService}${apiV1}/wins`,
    delete: `${urlBase}${noService}${apiV1}/wins`,
  },
  users: {
    getAll: `${urlBase}${noService}${apiV1}/users`,
    create: `${urlBase}${noService}${apiV1}/users`,
    update: `${urlBase}${noService}${apiV1}/users`,
    delete: `${urlBase}${noService}${apiV1}/users`,
  },
  translations: { // this gonna be jackpot service (widget translations)
    getAll: `${urlBase}${noService}${apiV1}/translations`,
    create: `${urlBase}${noService}${apiV1}/translations`,
    update: `${urlBase}${noService}${apiV1}/translations`,
    delete: `${urlBase}${noService}${apiV1}/translations`,
  },
  operators: {
    getAll: `${urlBase}${gatewayService}${apiV1}/operators`,
    create: `${urlBase}${gatewayService}${apiV1}/operators`,
    update: `${urlBase}${gatewayService}${apiV1}/operators`,
    delete: `${urlBase}${gatewayService}${apiV1}/operators`,
    generateKey: `${urlBase}${gatewayService}${apiV1}/operators/generate/{{operatorId}}`,
  },
  tiers: {
    getAll: `${urlBase}${gatewayService}${apiV1}/tiers`,
    create: `${urlBase}${gatewayService}${apiV1}/tiers`,
    update: `${urlBase}${gatewayService}${apiV1}/tiers`,
    delete: `${urlBase}${gatewayService}${apiV1}/tiers`,
  },
  products: {
    getAll: `${urlBase}${gatewayService}${apiV1}/products`,
    create: `${urlBase}${gatewayService}${apiV1}/products`,
    update: `${urlBase}${gatewayService}${apiV1}/products`,
    delete: `${urlBase}${gatewayService}${apiV1}/products`,
  },
  brandProducts: {
    list: `${urlBase}${gatewayService}${apiV1}/brands/{{brandId}}/products`,
    upsert: `${urlBase}${gatewayService}${apiV1}/brands/{{brandId}}/products/{{productId}}`,
    delete: `${urlBase}${gatewayService}${apiV1}/brands/{{brandId}}/products/{{productId}}`,
  },
  exchangeRates: {
    getAll: `${urlBase}${noService}${apiV1}/exchange-rates`,
    create: `${urlBase}${noService}${apiV1}/exchange-rates`,
    update: `${urlBase}${noService}${apiV1}/exchange-rates`,
    delete: `${urlBase}${noService}${apiV1}/exchange-rates`,
  },
}

export default urls
