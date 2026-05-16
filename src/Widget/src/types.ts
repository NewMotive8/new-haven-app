import { animateFooterToHeaderI } from "./core/winAnimations"

export type envT = 'production' | 'staging' | 'development'

export interface Init {
    brandId: string,
    eventId: string,
    playerId: string,
    applicationKey: string,
    log?: boolean,
    root?: HTMLElement | any
    style?: { model: number, src: string },
    media?: SetMediaProps,
    texts?: { [key in TextKeys]: string | any; },
    disableWidgetDrag?: boolean,
    locale?: string,
    signature: string,
    signatureBet: string,
    host?: string,
    notificationAnimationDuration?: number,
    notificationAnimationHideDelay?: number,
    playerCurrency?: string,
    env?: envT,
    onlyPreview?: boolean,
}

export type infoPopupDomKeys =
    'infoPopupWrapper' |
    'infoPopup' |
    'infoPopupHeader' |
    'infoPopupBody' |
    'infoPopupFooter' |
    'infoPopupButtonOptIn' |
    'infoPopupButtonOptOut' |
    'infoPopupCloseButton'

export type infoPopupDOM = { [key in infoPopupDomKeys]: HTMLElement | HTMLDivElement | any; }

export interface SetMediaProps {
    key: 'widget' | 'fullScreenAnimation' | string,
    type: 'lottie' | 'img' | 'image' | string,
    src: string,
    lottieConfig?: any,
}
export type WidgetDomKeys =
    'widgetWrapper' |
    'widget' |
    'widgetHeader' |
    'widgetBody' |
    'widgetFooter' |
    'widgetCurrentAmount' |
    'widgetMediaWrapper' |
    'widgetButtonsOptWrapper' |
    'widgetButtonOptIn' |
    'widgetButtonOptOut' |
    'widgetActionsBar' |
    'widgetInfoButton' |
    'widgetMinimizeButton' |
    'widgetMaximizeButton' |
    'widgetCloseButton' |
    'widgetInfoLabelWrapper' |
    'hamburgerMenu'
export type WidgetDOM = { [key in WidgetDomKeys]: HTMLElement | HTMLDivElement | any; }


export interface PropsRender {
    root?: HTMLDivElement,
    style?: { model: number, src: string },
    media?: SetMediaProps,
    disableWidgetDrag?: boolean,
}

export type TextKeys =
    'jackpotName' |
    'optInButton' |
    'optOutButton' |
    'loading' |
    'errorDefaultMessage' |
    'userInLabel' |
    'userOutLabel' |
    'winMessage' |
    'closeWidgetConfirmMessage' |
    'termsAndConditionsContent' |
    'termsPopupAcceptButtonLabel' |
    'termsPopupGetOutButtonLabel' |
    'communityJackpotWin' |
    'jackpotWin' |
    'titlePopup'
export type Texts = { [key in TextKeys]: string; }


export type CallbackKeys =
    'optin' |
    'optOut' |
    'updateAmount' |
    'userWin' |
    'init' |
    'mount' |
    'communityWin' |
    'jackpotWin' |
    'jackpotContribution'
export type Callbacks = { [key in CallbackKeys]: Function; }
export type CustomCallbacks = { [key in CallbackKeys]: boolean; }

export interface BetJackpot {
    wager: string | number,
    winner?: boolean
}
export interface CustomWinAnimation {
    lottieUrl?: string,
    cssUrl?: string
    amountWon?: number
    currency?: string
}



export interface Api {
    get: Function,
    postOpt: Function,
    postBet: Function,
}
export interface displayCommunityJackpotWin {
    mediaProps?: SetMediaProps,
    message?: any
}
export interface displayJackpotWinInterface {
    mediaProps?: SetMediaProps,
    message?: any
}
export interface Jooba {
    init: ({ }: Init) => void,
    restart: () => void
    actions: any,
    events: {
        on: (callback: CallbackKeys, func: Function) => {} | any
    }
    setSettings: Function
}

export enum notificationTypeEnum {
    NORMAL_MAIN = (1),
    NORMAL_INFORMED = (2),
    COMMUNITY_MAIN = (3),
    COMMUNITY_POOL = (4),
    JACKPOT_CONTRIBUTION = (5),
    BALANCE_UPDATE = (6)
}
export interface winResponse {
    balance: number,
    amount: number,
    currency: string,
    notificationType: notificationTypeEnum
    operator: string,
    playerId: string,
}
