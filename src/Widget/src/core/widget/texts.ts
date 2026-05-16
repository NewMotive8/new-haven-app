import { TextKeys, Texts } from "../../types.js";
import log from "../../log.js";
import { widgetDOM } from "./model.js";



const text: Texts = {
    jackpotName: '',
    optInButton: 'Opt in Jackpot',
    optOutButton: 'Opt Out Jackpot',
    loading: 'Loading...',
    errorDefaultMessage: 'Sorry, Something went wrong, try again later.',
    userInLabel: 'You are in, good luck!',
    userOutLabel: 'You have opted out for this jackpot.',
    winMessage: 'CONGRATS!<br/> YOU WON THE JACKPOT!',
    closeWidgetConfirmMessage: 'have you sure?',
    termsAndConditionsContent: '',
    termsPopupAcceptButtonLabel: 'To join to this jackpot just click bellow',
    termsPopupGetOutButtonLabel: 'To get out of this jackpot just click bellow',
    communityJackpotWin: 'This community jackpot had a won',
    jackpotWin: 'This jackpot had a won',
    titlePopup: 'Terms and Conditions',
}


function updateDomText(key: string, value: any) {
    switch (key) {
        case 'optInButton':
            if (widgetDOM.widgetButtonOptIn) {
                widgetDOM.widgetButtonOptIn.innerHTML = value
            }
            break;
        case 'optOutButton':
            if (widgetDOM.widgetButtonOptOut) {
                widgetDOM.widgetButtonOptOut.innerHTML = value
            }
            break;
        default:
            break;
    }
}


function set(key: TextKeys, value: string) {
    if (typeof text[key] === 'undefined') {
        return log(`action: update text fail because ${key} is not a valid key.`)
    }
    text[key] = value
    updateDomText(key, value)
    log(`action: update text ${key} to ${value}`)
}
function get() {
    return text as Texts
}


function initTexts(textsFromBe: Texts) {
    const keys: any = Object.keys(textsFromBe)

    keys.map((key: TextKeys) => {
        if (typeof text[key] === 'undefined') {
            return log(`action: update text fail because ${key} is not a valid key.`)
        }
        return text[key] = textsFromBe[key]
    })
}

function updateTexts(textsFromBe: Texts) {
    const keys: any = Object.keys(textsFromBe)

    keys.map((key: TextKeys) => {
        return set(key, textsFromBe[key])
    })
}
export { set, get, initTexts, updateTexts }
const texts = {
    set,
    get,
    updateTexts,
}
export default texts

