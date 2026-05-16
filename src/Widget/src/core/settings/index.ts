type SettingsKeys =
    'joobaContainerId' |
    'brandId' |
    'eventId' |
    'playerId' |
    'jackpotOriginalName' |
    'applicationKey' |
    'log' |
    'initialized' |
    'root' |
    'optIn' |
    'signature' |
    'signatureBet' |
    'notificationAnimationDuration' |
    'notificationAnimationHideDelay' |
    'playerCurrency' |
    'env' |
    'optType' |
    'onlyPreview' |
    'widget' | 
    'props'

    interface WidgetI {
        id: number;
        description: string | null;
        termsAndConditions: string | null;
        tcsIsLink: boolean | null;
        headerLabel: string | null;
        optInLabel: string | null;
        optOutLabel: string | null;
        optInType: string;
        widgetDesign: number;
        widgetAnimation: number;
        widgetMediaType: string | null;
        widgetMediaUrl: string | null;
        customAnimationLottie: string | null;
        customAnimationCss: string | null;
        widgetCustomCss: string | null;
        brand: string | null;
    }
interface Settings {
    joobaContainerId: string;
    brandId: string;
    eventId: string;
    playerId: string;
    jackpotOriginalName: string;
    applicationKey: string;
    log: boolean
    initialized: boolean;
    root: any;
    optIn: boolean;
    signature: string;
    signatureBet: string;
    notificationAnimationDuration: number;
    notificationAnimationHideDelay: number;
    playerCurrency: string;
    env: 'production' | 'staging' | 'development';
    optType: number; // 1 - auto opt, 2 - manual opt
    onlyPreview?: boolean;
    widget?: WidgetI;
    props: any
}


const settings: Settings = {
    joobaContainerId: 'jooba-container-root',
    brandId: '',
    eventId: '',
    playerId: '',
    jackpotOriginalName: '',
    applicationKey: '',
    log: true,
    initialized: false,
    root: null,
    optIn: false,
    signature: '',
    signatureBet: '',
    notificationAnimationDuration: 2000,
    notificationAnimationHideDelay: 1500,
    playerCurrency: 'USD',
    env: 'production',
    optType: 2,
    props: null
}

function setSettings<K extends SettingsKeys>(key: K, value: Settings[K]): void {
    settings[key] = value;
}

function getSettings() {
    return settings
}
export { setSettings, getSettings }
const settingsExport = { get: getSettings, set: setSettings }
export default settingsExport