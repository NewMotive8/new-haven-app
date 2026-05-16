import { Jooba } from "./types.js"
import init from "./core/init/index.js"
import actions from './core/actions/index.js'
import events from "./core/events/index.js"
import updateStyle from "./core/style/index.js"
import { animateFooterToHeader, displayCommunityWin, displayJackpotWin } from "./core/winAnimations/index.js"
import { setSettings } from "./core/settings/index.js"
declare global {
    interface Window {
        jooba: any
    }
}


const jooba: Jooba = {
    init,
    actions: {
        ...actions,
        displayWinner: actions.displayMainWinner,
        updateStyle: updateStyle,
        displayCommunityWin: displayCommunityWin,
        displayJackpotWin: displayJackpotWin,
        animateFooterToHeader,
    },
    restart: () => actions.restart(),
    setSettings: setSettings,
    events: { on: events?.on }
}

export default jooba 