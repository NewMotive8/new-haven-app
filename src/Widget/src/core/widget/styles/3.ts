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

let isActionBarOpen = false;

function enableDragWidget() {
    actions.drag(widgetDOM.widgetWrapper);
}

function bindActions() {
    widgetDOM.widgetMaximizeButton.onclick = () => {
        widgetDOM.widgetMaximizeButton.setAttribute('hidden', 'true');
        widgetDOM.widgetMinimizeButton.removeAttribute('hidden');
        widgetDOM.widgetBody.removeAttribute('hidden');
        widgetDOM.widgetHeader.removeAttribute('hidden');
        // Update isMaximized and isMinimized state if needed here
    }
    widgetDOM.widgetMinimizeButton.onclick = () => {
        widgetDOM.widgetMinimizeButton.setAttribute('hidden', 'true');
        widgetDOM.widgetMaximizeButton.removeAttribute('hidden');
        widgetDOM.widgetBody.setAttribute('hidden', 'true');
        widgetDOM.widgetHeader.setAttribute('hidden', 'true');
        // Update isMaximized and isMinimized state if needed here
    }

    widgetDOM.widgetButtonOptIn.onclick = () => {
        actions.optin();
    }
    widgetDOM.widgetButtonOptOut.onclick = () => {
        actions.optOut();
    }
    widgetDOM.widgetInfoButton.onclick = () => displayInfoPopup();
    widgetDOM.widgetCloseButton.onclick = () => {
        if (window.confirm(texts.get().closeWidgetConfirmMessage)) {
            widgetDOM.widgetWrapper.remove();
            actions.destroy();
        }
    }

    // Add event listener to the hamburger menu to toggle the action bar
    widgetDOM.hamburgerMenu.addEventListener('click', function (event: any) {
        event.stopImmediatePropagation();
        event.preventDefault();

        if (!isActionBarOpen) {
            showChildButtons();
            isActionBarOpen = true;
            widgetDOM.widgetWrapper.setAttribute('data-action-bar-open', 'true');
        } else {
            isActionBarOpen = false;
            widgetDOM.widgetWrapper.removeAttribute('data-action-bar-open');
            widgetDOM.hamburgerMenu.removeAttribute('hidden');
            // Hide other buttons if necessary
        }
    });

    // Bind child button events here if necessary
}

function fillElements(customMedia: SetMediaProps, disableWidgetDrag?: boolean) {
    const { optInButton, optOutButton } = texts.get();
    const { amount } = jackpot.get();
    const { playerCurrency } = getSettings();
    widgetDOM.widgetButtonOptIn.innerHTML = optInButton;
    widgetDOM.widgetButtonOptOut.innerHTML = optOutButton;
    widgetDOM.hamburgerMenu.innerHTML = '&#9776;';
    widgetDOM.hamburgerMenu.className = 'hamburgerMenu';
    widgetDOM.widgetCloseButton.innerHTML = 'X';
    widgetDOM.widgetMinimizeButton.innerHTML = '_';
    widgetDOM.widgetMaximizeButton.innerHTML = '❐';
    widgetDOM.widgetInfoButton.innerHTML = '?';
    widgetDOM.widgetMaximizeButton.setAttribute('hidden', 'true');
    if (customMedia?.key === 'widget') {
        media.set(customMedia);
    } else {
        // Helper function to get CDN base URL
        const getCDNBase = () => {
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                return 'http://localhost:3015/cdn';
            }
            return 'https://backoffice.hintx.org/cdn';
        };
        media.set({ key: 'widget', src: `${getCDNBase()}/images/Static5.png`, type: 'image' });
    }
    actions.updateAmount(0, amount, playerCurrency);
    bindActions();
    if (!disableWidgetDrag) {
        enableDragWidget();
    }
}

function showChildButtons() {
    const childButtons = [
        widgetDOM.widgetInfoButton,
        // Determine which button to show based on state from second file
        widgetDOM.widgetMaximizeButton, // Assuming isMinimized or isClosed state
        widgetDOM.widgetCloseButton
    ];
    childButtons.forEach(button => {
        button.removeAttribute('hidden');
    });
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

    widgetDOM.widgetWrapper.appendChild(widgetDOM.widgetActionsBar)

    widgetDOM.widgetWrapper.appendChild(widgetDOM.widget)

    widgetDOM.widgetActionsBar.appendChild(widgetDOM.hamburgerMenu);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetInfoButton);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetMinimizeButton);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetMaximizeButton);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetCloseButton);

    widgetDOM.widget.appendChild(widgetDOM.widgetHeader)
    widgetDOM.widget.appendChild(widgetDOM.widgetBody)
    widgetDOM.widget.appendChild(widgetDOM.widgetFooter)


    widgetDOM.widgetBody.appendChild(widgetDOM.widgetMediaWrapper)
    widgetDOM.widgetBody.appendChild(widgetDOM.widgetButtonsOptWrapper)
    widgetDOM.widgetButtonsOptWrapper.appendChild(widgetDOM.widgetButtonOptIn)
    widgetDOM.widgetButtonsOptWrapper.appendChild(widgetDOM.widgetButtonOptOut)

    widgetDOM.widgetFooter.appendChild(widgetDOM.widgetInfoLabelWrapper)
    widgetDOM.widgetFooter.appendChild(widgetDOM.widgetCurrentAmount)

    if (typeof window !== 'undefined') {
        window.addEventListener('resize', adjustWidgetPosition);
        window.addEventListener('orientationchange', adjustWidgetPosition);
        window.jooba.widgetDOM = widgetDOM;
    }

    actions.setStyleFile(styleUrlFile).then(() => {
        root.appendChild(widgetDOM.widgetWrapper);
        fillElements(media, disableWidgetDrag);
        events.callback('mount', widgetDOM);

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
        log(['jackpot-opt-type', getSettings().optType]);
        if (getSettings().optType === 1) {
            actions.hiddenOptOut();
            actions.hiddenOptIn();
        }
        actions.connectStream();
    });
}

export { mountDOM };
