import { CallbackKeys, Callbacks, CustomCallbacks } from "../../types.js"
import log from "../../log.js"

const callbacks: Callbacks = {
    optin: () => { },
    optOut: () => { },
    updateAmount: () => { },
    userWin: () => { },
    init: () => { },
    mount: () => { },
    communityWin: () => { },
    jackpotWin: () => { },
    jackpotContribution: () => { },
}
const customCalBacks: CustomCallbacks = {
    optin: false,
    optOut: false,
    updateAmount: false,
    userWin: false,
    init: false,
    mount: false,
    communityWin: false,
    jackpotWin: false,
    jackpotContribution: false,
}
function on(callback: CallbackKeys, func: Function) {
    log(`callback set ${callback}`)
    callbacks[callback] = func
    customCalBacks[callback] = true
}

function callback(key: CallbackKeys, returns?: any) {
    log(`event: on ${key}`)
    callbacks[key](returns)
}

function customs() {
    return customCalBacks
}
const events = {
    on,
    callback,
    customs
}

export default events