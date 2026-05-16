import { Init } from '../../types.js'
import { set } from '../jackpot/index.js'
import { setSettings } from '../settings/index.js'
import { getUrls, setUrl } from '../urls/index.js'
import widget from '../widget/index.js'
import api from '../api/index.js'
import events from '../events/index.js'
import { initTexts } from '../widget/texts.js'
import actions from '../actions/index.js'

// Helper function to get CDN base URL (localhost for local dev, configurable for production)
function getCDNBase(): string {
    if (typeof window !== 'undefined') {
        // Auto-detect localhost for local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3015/cdn';
        }
    }
    // Default to production CDN
    return 'https://backoffice.hintx.org/widget';
}


function init(props: Init) {
    const {
        brandId,
        eventId,
        playerId,
        applicationKey,
        log,
        root,
        style,
        media,
        texts,
        disableWidgetDrag,
        locale,
        signature,
        signatureBet,
        host,
        notificationAnimationDuration,
        notificationAnimationHideDelay,
        playerCurrency,
        env,
        onlyPreview,
    } = props
    setSettings('props', props)

    if (typeof window !== 'undefined') {
        actions.destroy()
        if (host) {
            setUrl(env || 'production', 'api', host)
            // Derive WebSocket URL from host parameter
            const wsProtocol = host.startsWith('https') ? 'wss' : 'ws'
            const hostBase = host.replace(/^https?:\/\//, '').replace(/\/api\/jackpot\/?$/, '').replace(/\/api\/gateway\/?$/, '').replace(/\/+$/, '')
            const websocketUrl = `${wsProtocol}://${hostBase}/wsjackpot`
            setUrl(env || 'production', 'wb', websocketUrl)
        }
        setSettings('brandId', brandId)
        setSettings('eventId', eventId)
        setSettings('playerId', playerId)
        setSettings('applicationKey', applicationKey)
        setSettings('log', !!log)
        setSettings('initialized', true)
        setSettings('root', root)
        setSettings('signature', signature)
        setSettings('signatureBet', signatureBet)
        setSettings('notificationAnimationDuration', notificationAnimationDuration || 2000)
        setSettings('notificationAnimationHideDelay', notificationAnimationHideDelay || 1500)
        setSettings('playerCurrency', playerCurrency || 'USD')
        setSettings('env', env || 'production')
        const apiUrl: string = host || getUrls(env || 'production').api

        if (onlyPreview) {
            setSettings('onlyPreview', true)

            const model = style?.model || 1
            const widgetMedia = (media?.type && media?.src)
                ? { key: 'widget', type: media?.type, src: media?.src }
                : model === 1
                    ? { key: 'widget', type: 'lottie', src: `${getCDNBase()}/lottie/catMoney.json` }
                    : model === 2
                        ? { key: 'widget', type: 'lottie', src: `${getCDNBase()}/lottie/cash.json` }
                        : { key: 'widget', type: 'img', src: `${getCDNBase()}/images/static2.png` }

            const widgetStyle = {
                model,
                src: style?.src || `${getCDNBase()}/styles/style1.css`,
            }

            widget.display({ root, style: widgetStyle, media: widgetMedia, disableWidgetDrag })
        } else {

            api.get(`${apiUrl}${getUrls(env || 'production').initCheck}/${brandId}/${eventId}?playerId=${playerId}${locale ? `&locale=${locale}` : ''}`).then((data: any) => {
                if (data && data !== 'false' && data !== 'undefined' && data !== 'null') {
                    setSettings('jackpotOriginalName', data.jackpotName)
                    setSettings('optIn', data.optin)
                    setSettings('playerCurrency', playerCurrency || data.currency)
                    setSettings('optType', data.optinType || 2)
                    setSettings('widget', data.widget)

                    const convertedAmounts = data?.poolFeed?.[0]?.convertedAmounts

                    if (texts || data?.translations) {
                        initTexts(texts || data.translations)
                    }
                    set({
                        jackpotName: data.jackpotName,
                        amount: convertedAmounts ? convertedAmounts[playerCurrency || 'USD'] : 0,
                        optin: data?.optin,
                        translations: data?.translations,
                    })
                    const model = data?.widget?.widgetDesign || style?.model || 1
                    const widgetMedia = (data?.widget?.widgetMediaType && data?.widget?.widgetMediaUrl)
                        ? { key: 'widget', type: data?.widget?.widgetMediaType, src: data?.widget?.widgetMediaUrl }
                        : media?.type && media.src
                            ? { ...media }
                            : model === 1
                                ? { key: 'widget', type: 'lottie', src: `${getCDNBase()}/lottie/catMoney.json` }
                                : model === 2
                                    ? { key: 'widget', type: 'lottie', src: `${getCDNBase()}/lottie/cash.json` }
                                    : { key: 'widget', type: 'img', src: `${getCDNBase()}/images/static2.png` }

                    const widgetStyle = {
                        model,
                        src: data?.widget?.widgetCustomCss || style?.src || null,
                    }
                    if (log) {
                        console.info('widgetStyle', widgetStyle)
                        console.info('media', widgetMedia)
                    }
                    widget.display({ root, style: widgetStyle, media: widgetMedia, disableWidgetDrag })
                    if (media) {
                        events.callback('init')
                    }
                } else {
                    console.warn('JOOBA - Jackpot not exists or something wrong with params provided.')
                    actions.destroy()
                }
            })
        }
    }
}


export default init