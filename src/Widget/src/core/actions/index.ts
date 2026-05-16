import jackpot from "../jackpot/index.js";
import anime from 'animejs';
import { widgetDOM } from "../widget/model.js";
import texts from "../widget/texts.js";
import events from "../events/index.js";
import log from "../../log.js";
import media from "../widget/media.js";
import { getUrls } from "../urls/index.js";
import settings, { getSettings } from "../settings/index.js";
import StompJs from 'StompJs'
import { BetJackpot, notificationTypeEnum, winResponse } from "../../types.js";
import api from "../api/index.js";
import { defineAndDisplayWin, displayMainWinner } from "../winAnimations/index.js";
import { formatCurrency } from "../utils/index.js";

function updateAmount(currentAmountP: number, amount: number, currency: string) {

    const { amount: currentAmountA } = jackpot.get()
    const { playerCurrency } = settings.get()

    const currentAmount = currentAmountA || currentAmountP

    if (amount === currentAmount && currentAmountP !== 0) {
        return null
    }
    log(`action: update amount init from ${currentAmount} to ${amount}`)

    anime({
        targets: widgetDOM.widgetCurrentAmount,
        textContent: currentAmount,
        value: [currentAmount, amount],
        round: 1,
        duration: 2000,
        easing: 'easeInOutQuad',
        update: function (a: any) {
            const _value = amount < currentAmount ? currentAmount - ((currentAmount - amount) / 100 * a.progress) : currentAmount + ((amount - currentAmount) / 100 * a.progress);
            if (a.progress === 100) {
                widgetDOM.widgetCurrentAmount.innerHTML = formatCurrency(amount, currency || playerCurrency || 'USD')
                log(`action: update amount finish from ${currentAmount} to ${amount}`)
                jackpot.update('amount', amount)
                events.callback('updateAmount', amount)
            } else {
                widgetDOM.widgetCurrentAmount.innerHTML = formatCurrency(_value, currency || playerCurrency || 'USD')
            }
        },
    })

}


function betJackpot(props: BetJackpot) {
    const { wager, winner } = props
    const { brandId, playerId, eventId, env } = settings.get()
    const body = { brandId, playerId, eventId, wager }
    return api.postBet(`${getUrls(env).api}${winner ? getUrls(env).betWinnerJackpot : getUrls(env).betJackpot}`, body)
}



const connectStreamReference: any = {
    client: null,
    perPlayerSubscription: null,
    globalSubscription: null,
}



function disconnectStream() {
    log(['connectStreamReference: ', connectStreamReference]);
    if (connectStreamReference?.client && connectStreamReference?.client?.disconnect) {
        log('disconnect previous connection');
        connectStreamReference?.client.disconnect()
        if (connectStreamReference?.client?.forceDisconnect) {
            connectStreamReference?.client.forceDisconnect()
        }
        if (connectStreamReference?.client?.deactivate) {
            connectStreamReference?.client.deactivate()
        }
        connectStreamReference.client.reconnectDelay = 0
        connectStreamReference.client = null
    }
    if (connectStreamReference?.perPlayerSubscription && connectStreamReference?.perPlayerSubscription?.unsubscribe) {
        log('unsubscribe previous subscription per player');
        connectStreamReference?.perPlayerSubscription.unsubscribe()
        connectStreamReference.perPlayerSubscription = null
    }
    if (connectStreamReference?.globalSubscription && connectStreamReference?.globalSubscription?.unsubscribe) {
        log('unsubscribe previous subscription global');
        connectStreamReference?.globalSubscription.unsubscribe()
        connectStreamReference.perPlayerSubscription = null
    }
}

function connectStream() {
    const { brandId, playerId, jackpotOriginalName: jackpotName, env, onlyPreview } = settings.get()
    if (onlyPreview) {
        return false
    }
    log(['new webSocket connection jackpotName: ', jackpotName]);


    connectStreamReference.client = new StompJs.Client({
        brokerURL: getUrls(env).wb,
        connectHeaders: {
            messageId: `${brandId}-${playerId}`,
            player: `${brandId}-${playerId}`,
            jackpot: jackpotName,
            id: `${jackpotName}-${brandId}-${playerId}`
        },
        debug: function (str: string) {
            log(str)
        },
        reconnectDelay: 1000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    connectStreamReference.client.activate();
    connectStreamReference.client.onConnect = (frame: any) => {

        connectStreamReference.perPlayerSubscription = connectStreamReference.client.subscribe(getUrls(env).wbPerPlayerTopic.replace('{{brandId}}', brandId).replace('{{playerId}}', playerId), (payload: any) => {
            const winResp: winResponse = JSON.parse(payload.body)
            log(['wsPlayer: ', winResp])
            defineAndDisplayWin(winResp, updateAmount)
        }, { id: `sub-per-player-${jackpotName}-${brandId}-${playerId}` })
        log(['perPlayerSubscription: ', connectStreamReference.perPlayerSubscription]);
        connectStreamReference.globalSubscription = connectStreamReference.client.subscribe(getUrls(env).wbGlobalTopic.replace('{{jackpotName}}', jackpotName), (payload: any) => {
            let _res = JSON.parse(payload.body)
            log(['wsGlobal: ', _res])
            if (_res.notificationType === notificationTypeEnum.NORMAL_INFORMED) {
                defineAndDisplayWin(_res, updateAmount)
            }
            if (_res.notificationType === notificationTypeEnum.BALANCE_UPDATE) {
                const { jackpotOriginalName: jackpotName } = settings.get()
                const playerCurrency = settings.get().playerCurrency
                const convertedAmounts = _res?.poolFeed?.[0]?.convertedAmounts
                const amount = convertedAmounts ? convertedAmounts?.[playerCurrency || 'USD'] : 0
                const currentAmount = jackpot.get().amount
                if (amount && _res.jackpot === jackpotName) {
                    if (amount && !jackpot.get().userWin) {
                        updateAmount(currentAmount, amount, playerCurrency)
                    }
                }
            }
        }, { id: `sub-global-${jackpotName}` });
        log(['globalSubscription: ', connectStreamReference.globalSubscription]);
    }
}

function hiddenOptIn() {
    widgetDOM.widgetButtonOptIn.setAttribute('hidden', 'true')
    if (getSettings().optType !== 1) {
        widgetDOM.widgetButtonOptOut.removeAttribute('hidden')
        widgetDOM.widgetButtonOptIn.removeAttribute('disabled')
    }
}
async function optin() {
    widgetDOM.widgetButtonOptIn.setAttribute('disabled', 'true')
    widgetDOM.widgetButtonOptIn.innerHTML = texts.get().loading

    const { brandId, playerId, jackpotOriginalName: jackpotName, eventId, env } = settings.get()
    const body = { brandId, playerId, jackpotName, optin: true }

    return api.postOpt(`${getUrls(env).api}${getUrls(env).optIn}`, body).then((res: any) => {
        hiddenOptIn()
        jackpot.update('userIn', true)
        const infoLabel = document.createElement('p')
        infoLabel.innerHTML = texts.get().userInLabel
        widgetDOM.widgetInfoLabelWrapper.innerHTML = ''
        widgetDOM.widgetInfoLabelWrapper.appendChild(infoLabel)
        widgetDOM.widgetButtonOptIn.innerHTML = texts.get().optInButton

        log('action: user opted in success')
        events.callback("optin", { playerId, eventId })

    }).catch((err: any) => {
        log(`error user opt in fail: ${err}`)
    })

}
function hiddenOptOut() {
    widgetDOM.widgetButtonOptOut.setAttribute('hidden', 'true')
    if (getSettings().optType !== 1) {
        widgetDOM.widgetButtonOptIn.removeAttribute('hidden')
        widgetDOM.widgetButtonOptOut.removeAttribute('disabled')
    }
}
async function optOut() {
    widgetDOM.widgetButtonOptOut.setAttribute('disabled', 'true')
    widgetDOM.widgetButtonOptOut.innerHTML = texts.get().loading

    const { brandId, playerId, jackpotOriginalName: jackpotName, eventId, env } = settings.get()
    const body = { brandId, playerId, jackpotName, optin: false }

    return api.postOpt(`${getUrls(env).api}${getUrls(env).optIn}`, body).then((res: any) => {
        hiddenOptOut()
        jackpot.update('userIn', false)
        const infoLabel = document.createElement('p')
        infoLabel.innerHTML = texts.get().userOutLabel
        widgetDOM.widgetInfoLabelWrapper.innerHTML = ''
        widgetDOM.widgetInfoLabelWrapper.appendChild(infoLabel)
        widgetDOM.widgetButtonOptOut.innerHTML = texts.get().optOutButton
        log('action: user opted out success')
        events.callback("optOut", { playerId, eventId })
    }).catch((err: any) => {
        log(`error: ${err}`)
    })

}


async function setStyleFile(src: string, id?: string) {
    return new Promise((resolve, reject) => {
        if (src) {
            const olderStylesheet = document.getElementById('jooba-widget-style-file');
            olderStylesheet?.parentNode?.removeChild(olderStylesheet);
            const _style = document.createElement('link');
            _style.setAttribute('rel', 'stylesheet');
            _style.setAttribute('href', src);
            _style.onload = () => resolve('')
            _style.onerror = () => resolve('')
            document.getElementsByTagName('head')[0].appendChild(_style);
            _style.setAttribute('id', id || 'jooba-widget-style-file');
        }
        else resolve('')
    });
}

function drag(element: any) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.onmousedown = dragMouseDown;
    element.ontouchstart = dragMouseDown;

    function dragMouseDown(e: any) {
        e = e || window.event;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.ontouchend = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e: any) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - (e.clientX || e.touches[0].clientX);
        pos2 = pos4 - (e.clientY || e.touches[0].clientY);
        pos3 = e.clientX || e.touches[0].clientX;
        pos4 = e.clientY || e.touches[0].clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        const positionData = {
            left: element.offsetLeft,
            top: element.offsetTop
        };
        sessionStorage.setItem('jooba-widget-last-position', JSON.stringify(positionData));

        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

function destroy() {
    if (widgetDOM?.widgetWrapper) {
        widgetDOM.widgetWrapper.remove()
        settings.set('initialized', false)
        jackpot.update('amount', 0)
        try {
            log('websocket disconnected by destroy')
            disconnectStream()
        } catch (error) {
            log('no websocket to destroy')
            console.error(error)
        }
    }
}

function updateWidgetInfoLabel(content: any) {
    const infoLabel = document.createElement('p')
    infoLabel.innerHTML = content || ''
    widgetDOM.widgetMediaWrapper.style.position = 'relative'
    widgetDOM.widgetMediaWrapper.style.zIndex = '99999'
    widgetDOM.widgetInfoLabelWrapper.innerHTML = ''
    widgetDOM.widgetInfoLabelWrapper.appendChild(infoLabel);
}

function restart() {
    const { props } = settings.get()
    destroy()
    window.jooba.init(props)
}


const updateText = texts.set
const updateAllTexts = texts.updateTexts
const updateWidgetMedia = media.set
const actions = {
    updateAmount,
    updateText,
    optin,
    hiddenOptIn,
    log,
    optOut,
    hiddenOptOut,
    setStyleFile,
    updateWidgetMedia,
    drag,
    displayMainWinner,
    betJackpot,
    destroy,
    updateAllTexts,
    updateWidgetInfoLabel,
    connectStream,
    disconnectStream,
    restart,
}
export default actions