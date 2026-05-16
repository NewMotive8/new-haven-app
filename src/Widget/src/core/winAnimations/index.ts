import log from "../../log.js";
import { CustomWinAnimation, displayCommunityJackpotWin, displayJackpotWinInterface, notificationTypeEnum, winResponse } from "../../types.js";
import events from "../events/index.js";
import jackpot from "../jackpot/index.js";
import displayAnimation from "./1.js";
import { widgetDOM } from "../widget/model.js";
import media from "../widget/media.js";
import texts from "../widget/texts.js";
import anime from 'animejs';
import { getSettings } from "../settings/index.js";
import { formatCurrency } from "../utils/index.js";
import actions from "../actions/index.js";


export interface animateFooterToHeaderI {
    textContent: string,
    move?: number,
    currency?: string,
    animationDuration?: number,
    hideDelay?: number,
}

function getElementPosition(element: any) {
    if (!element || element.hasAttribute('hidden')) {
        return null;
    }

    var rect = element.getBoundingClientRect();

    var scrollLeft = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

    return {
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        bottom: rect.bottom + scrollTop,
        right: rect.right + scrollLeft
    };
}
export function animateFooterToHeader({
    textContent,
    move,
    currency,
    animationDuration,
    hideDelay,
}: animateFooterToHeaderI) {
    const previousNotificationWrapper = document.getElementById('jooba-widget-notification-animation-wrapper');
    if (previousNotificationWrapper) {
        previousNotificationWrapper.remove();
    }
    const div = document.createElement('div');
    div.setAttribute('id', 'jooba-widget-notification-animation-wrapper');
    const text = currency ? `+ ${formatCurrency(parseFloat(textContent), currency || 'USD')}` : textContent
    const textEl = document.createElement('span');
    textEl.innerText = text;

    textEl.setAttribute('id', 'jooba-widget-notification-animation-text');

    function setInitialStyle(targetDiv: HTMLDivElement, widget: HTMLDivElement, footerRect: any) {
        targetDiv.style.position = 'absolute';
        targetDiv.style.width = '150px';
        targetDiv.style.zIndex = '9999';
        targetDiv.style.left = `${widget.offsetLeft}px`;
        targetDiv.style.top = `${footerRect.bottom || window.innerHeight}px`;
    }

    function getTopPosition(targetDiv: HTMLDivElement, ...widgets: any) {
        for (let widget of widgets) {
            const position = getElementPosition(widget);
            if (position) {
                return position.top + (targetDiv.clientHeight / 2);
            }
        }
        return 0;  // Default value if no position found
    }

    function getLeftPosition(...widgets: any) {
        for (let widget of widgets) {
            const position = getElementPosition(widget);
            if (position) {
                return position.left;
            }
        }
        return 0;  // Default value if no position found
    }

    const footerRect = widgetDOM.widgetFooter.getBoundingClientRect();

    setInitialStyle(div, widgetDOM.widget, footerRect);

    div.appendChild(textEl);
    document.body.appendChild(div);

    const animationSettings = {
        targets: div,
        top: {
            value: `${getTopPosition(div, widgetDOM.widgetCurrentAmount, widgetDOM.widgetActionsBar, widgetDOM.widget)}px`,
            duration: animationDuration || 2000
        },
        left: {
            value: `${getLeftPosition(widgetDOM.widget, widgetDOM.widgetCurrentAmount, widgetDOM.widgetActionsBar)}px`,
            duration: animationDuration || 2000
        },
        easing: 'spring(1, 80, 10, 0)',
        complete: function () {
            setTimeout(() => {
                div.remove();
            }, hideDelay || 1500);
        }
    };

    anime(animationSettings);
}

// Helper function to get CDN base URL
function getCDNBase(): string {
    if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3015/cdn';
        }
    }
    return 'https://backoffice.hintx.org/cdn';
}

export function displayMainWinner(props: CustomWinAnimation) {
    const propsDefault = {
        lottieUrl: `${getCDNBase()}/lottie/coinsFalling.json`,
        cssUrl: `${getCDNBase()}/styles/win-animation-default.css`
    }
    const delay = setTimeout(() => {
        if (widgetDOM.widgetInfoLabelWrapper) {
            widgetDOM.widgetInfoLabelWrapper.innerHTML = ''
        }
        log('action: display winner')
        displayAnimation(props || propsDefault)
        clearTimeout(delay)
    }, 1500);
}



export function displayCommunityWin(props?: displayCommunityJackpotWin) {
    media.set(props?.mediaProps || {
        key: 'widget',
        src: `${getCDNBase()}/lottie/coins.json`,
        type: 'lottie',
    })
    const infoLabel = document.createElement('p');
    infoLabel.innerHTML = props?.message || texts.get().communityJackpotWin;
    widgetDOM.widgetMediaWrapper.style.position = 'relative'
    widgetDOM.widgetMediaWrapper.style.zIndex = '99999'
    widgetDOM.widgetInfoLabelWrapper.innerHTML = '';
    widgetDOM.widgetInfoLabelWrapper.appendChild(infoLabel);

}

export function displayJackpotWin(props?: displayJackpotWinInterface) {
    media.set(props?.mediaProps || {
        key: 'widget',
        src: `${getCDNBase()}/lottie/coins.json`,
        type: 'lottie',
    })
    const infoLabel = document.createElement('p');
    infoLabel.innerHTML = props?.message || texts.get().jackpotWin;
    widgetDOM.widgetMediaWrapper.style.position = 'relative'
    widgetDOM.widgetMediaWrapper.style.zIndex = '99999'
    widgetDOM.widgetMediaWrapper.style.backdropFilter = 'blur(5px)';
    widgetDOM.widgetMediaWrapper.style.backgroundColor = '#ffffff1a';
    widgetDOM.widgetMediaWrapper.style.borderRadius = '8pt';
    widgetDOM.widgetInfoLabelWrapper.innerHTML = '';
    widgetDOM.widgetInfoLabelWrapper.style.zIndex = '999999'
    widgetDOM.widgetInfoLabelWrapper.appendChild(infoLabel);
    setTimeout(() => {
        actions.restart()
    }, 30000);
}


export function defineAndDisplayWin(winResponse: winResponse,
    updateAmount: (currentAmount: number, amount: number, currency: string) => null | undefined) {
    const { amount, notificationType, balance } = winResponse
    log('notificationType: ');
    log(notificationType)
    const { amount: currentAmount } = jackpot.get()
    const { playerCurrency, widget } = getSettings()

    if (amount && notificationType !== notificationTypeEnum.JACKPOT_CONTRIBUTION) {
        jackpot.update('amount', amount)
        updateAmount(currentAmount, amount, winResponse.currency || playerCurrency)
    }
    if (winResponse?.balance && notificationType !== notificationTypeEnum.NORMAL_INFORMED) {
        updateAmount(currentAmount, balance, winResponse.currency || playerCurrency)
    }
    if (notificationType === notificationTypeEnum.COMMUNITY_MAIN || notificationType === notificationTypeEnum.NORMAL_MAIN && !jackpot.get()?.userWin) {
        jackpot.update('userWin', true)
        if (!events.customs().userWin) {
            displayMainWinner({
                lottieUrl: widget?.customAnimationLottie || `${getCDNBase()}/lottie/coinsFalling.json`,
                cssUrl: widget?.customAnimationCss || `${getCDNBase()}/styles/win-animation-default.css`,
                currency: winResponse.currency || playerCurrency,
                amountWon: amount
            })
        }
        events.callback('userWin', { winResponse, displayMainWinner })
        const timeout = setTimeout(() => {
            jackpot.update('userWin', false)
            clearTimeout(timeout)
        }, 30000); // 30 seconds to remove the winner status
    }
    if (notificationType === notificationTypeEnum.COMMUNITY_POOL) {
        if (!events.customs().communityWin) {
            displayCommunityWin()
        }
        events.callback('communityWin', { winResponse, displayCommunityWin })
    }
    if (notificationType === notificationTypeEnum.NORMAL_INFORMED) {
        if (!events?.customs()?.jackpotWin) {
            displayJackpotWin()
        }
        events.callback('jackpotWin', { winResponse, displayJackpotWin })
    }
    if (notificationType === notificationTypeEnum.JACKPOT_CONTRIBUTION) {
        if (!events.customs().jackpotContribution) {
            animateFooterToHeader({
                textContent: `${winResponse.amount}`,
                currency: winResponse.currency,
                animationDuration: getSettings().notificationAnimationDuration,
                hideDelay: getSettings().notificationAnimationHideDelay,
            })
        }
        events.callback('jackpotContribution', {
            contribution: winResponse,
            animateContribution: () => animateFooterToHeader({
                textContent: `${parseFloat(`${winResponse.amount}`) < 0.01 ? '+$' : winResponse.amount}`,
                currency: winResponse.currency,
                animationDuration: getSettings().notificationAnimationDuration,
                hideDelay: getSettings().notificationAnimationHideDelay,
            })
        })
    }


}
