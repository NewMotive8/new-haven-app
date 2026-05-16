import log from "../../../log.js"
import { SetMediaProps } from "../../../types.js"
import actions from "../../actions/index.js"
import events from "../../events/index.js"
import displayInfoPopup from "../../infoPopup/index.js"
import jackpot from "../../jackpot/index.js"
import { getSettings } from "../../settings/index.js"
import media from "../media.js"
import { widgetDOM } from "../model.js"
import texts from "../texts.js"

function enableDragWidget() {
    actions.drag(widgetDOM.widgetWrapper)
}

function bindActions() {
    widgetDOM.widgetMaximizeButton.onclick = () => {
        widgetDOM.widgetMaximizeButton.setAttribute('hidden', 'true')
        widgetDOM.widgetMinimizeButton.removeAttribute('hidden')
        widgetDOM.widgetBody.removeAttribute('hidden')
        widgetDOM.widgetFooter.removeAttribute('hidden')
    }
    widgetDOM.widgetMinimizeButton.onclick = () => {
        widgetDOM.widgetMinimizeButton.setAttribute('hidden', 'true')
        widgetDOM.widgetMaximizeButton.removeAttribute('hidden')
        widgetDOM.widgetBody.setAttribute('hidden', 'true')
        widgetDOM.widgetFooter.setAttribute('hidden', 'true')
    }

    widgetDOM.widgetButtonOptIn.onclick = () => {
        actions.optin()
    }
    widgetDOM.widgetButtonOptOut.onclick = () => {
        actions.optOut()
    }
    widgetDOM.widgetInfoButton.onclick = () => displayInfoPopup()
    widgetDOM.widgetCloseButton.onclick = () => {
        if (window.confirm(texts.get().closeWidgetConfirmMessage)) {
            widgetDOM.widgetWrapper.remove();
            actions.destroy();
        }
    }
}


function fillElements(customMedia: SetMediaProps, disableWidgetDrag?: boolean) {
    const { optInButton, optOutButton } = texts.get()
    const { amount } = jackpot.get()
    const { playerCurrency } = getSettings();
    widgetDOM.widgetButtonOptIn.innerHTML = optInButton
    widgetDOM.widgetButtonOptOut.innerHTML = optOutButton
    widgetDOM.widgetCloseButton.innerHTML = 'X'
    widgetDOM.widgetMinimizeButton.innerHTML = '_'
    widgetDOM.widgetMaximizeButton.innerHTML = '❐'
    widgetDOM.widgetMaximizeButton.setAttribute('hidden', 'true')
    widgetDOM.widgetButtonOptOut.setAttribute('hidden', 'true')
    widgetDOM.widgetInfoButton.innerHTML = '?'
    if (customMedia?.key === 'widget') {
        media.set(customMedia)
    } else {
        // Helper function to get CDN base URL
        const getCDNBase = () => {
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                return 'http://localhost:3015/cdn';
            }
            return 'https://backoffice.hintx.org/cdn';
        };
        media.set({ key: 'widget', src: `${getCDNBase()}/lottie/cash.json`, type: 'lottie' })
    }
    actions.updateAmount(0, amount, playerCurrency)
    bindActions()
    if (!disableWidgetDrag) {
        enableDragWidget()
    }
}
function adjustWidgetPosition() {
    const widgetRect = widgetDOM.widget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if the widget goes outside on the X axis.
    if (widgetRect.right > viewportWidth) {
        widgetDOM.widgetWrapper.style.left = `${viewportWidth - widgetRect.width}px`;
    }

    // Check if the widget goes outside on the Y axis. (Optional based on your requirements)
    if (widgetRect.bottom > viewportHeight) {
        widgetDOM.widgetWrapper.style.top = `${viewportHeight - widgetRect.height}px`;
    }
}

function mountDOM(root: HTMLDivElement, styleUrlFile: string, media: SetMediaProps, disableWidgetDrag: boolean) {
    widgetDOM.widgetWrapper.appendChild(widgetDOM.widget)

    widgetDOM.widgetWrapper.appendChild(widgetDOM.widgetActionsBar)
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetInfoButton)
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetMinimizeButton)
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetMaximizeButton)
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetCloseButton)

    widgetDOM.widget.appendChild(widgetDOM.widgetHeader)
    widgetDOM.widgetHeader.appendChild(widgetDOM.widgetCurrentAmount)
    widgetDOM.widget.appendChild(widgetDOM.widgetBody)
    widgetDOM.widgetBody.appendChild(widgetDOM.widgetMediaWrapper)
    widgetDOM.widgetBody.appendChild(widgetDOM.widgetInfoLabelWrapper)

    widgetDOM.widgetWrapper.appendChild(widgetDOM.widgetFooter)
    widgetDOM.widgetFooter.appendChild(widgetDOM.widgetButtonsOptWrapper)

    widgetDOM.widgetButtonsOptWrapper.appendChild(widgetDOM.widgetButtonOptIn)
    widgetDOM.widgetButtonsOptWrapper.appendChild(widgetDOM.widgetButtonOptOut)
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', adjustWidgetPosition);
            window.addEventListener('orientationchange', adjustWidgetPosition);
            window.jooba.widgetDOM = widgetDOM;
        }
    actions.setStyleFile(styleUrlFile).then(() => {
        root.appendChild(widgetDOM.widgetWrapper)
        fillElements(media, disableWidgetDrag)
        events.callback('mount', widgetDOM)
        window.jooba.widgetDOM = widgetDOM;

        let storedPosition: any = sessionStorage.getItem('jooba-widget-last-position');
        if (storedPosition) {
            storedPosition = JSON.parse(storedPosition);
            widgetDOM.widgetWrapper.style.left = storedPosition.left + "px";
            widgetDOM.widgetWrapper.style.top = storedPosition.top + "px";
        }
        if (getSettings().optIn) {
            actions.optin();
        } else {
            actions.hiddenOptOut();
        }
        log(['jackpot-opt-type', getSettings().optType])
        if (getSettings().optType === 1) {
            actions.hiddenOptOut();
            actions.hiddenOptIn();
        }

        actions.connectStream()

    })
}


export { mountDOM }