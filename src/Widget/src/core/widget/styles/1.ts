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
let isMaximized = true;
let isMinimized = false;
let isClosed = false;
let scaleDownTimeout: any;


function enableDragWidget() {
    actions.drag(widgetDOM.widgetWrapper);
}

function minimizeWidget() {
    isMinimized = true;
    isMaximized = false;
    isClosed = false;
    widgetDOM.widgetMinimizeButton.setAttribute('hidden', 'true');
    widgetDOM.widgetMaximizeButton.removeAttribute('hidden');
    widgetDOM.widgetBody.setAttribute('hidden', 'true');
    widgetDOM.widgetFooter.setAttribute('hidden', 'true');
    widgetDOM.widgetWrapper.removeAttribute('data-is-closed');
}

function softCloseWidget() {
    isMinimized = false;
    isMaximized = false;
    isClosed = true;
    widgetDOM.widgetCurrentAmount.setAttribute('hidden', 'true');
    widgetDOM.widgetMinimizeButton.setAttribute('hidden', 'true');
    widgetDOM.widgetMaximizeButton.removeAttribute('hidden');
    widgetDOM.widgetBody.setAttribute('hidden', 'true');
    widgetDOM.widgetFooter.setAttribute('hidden', 'true');
    widgetDOM.widgetWrapper.setAttribute('data-is-closed', 'true');
}

function maximizeWidget() {
    if (isClosed) {
        widgetDOM.widgetWrapper.style.top = `${widgetDOM.widgetActionsBar.getBoundingClientRect().top - 150}px`
        widgetDOM.widgetWrapper.style.left = `${widgetDOM.widgetActionsBar.getBoundingClientRect().left}px`
    }
    isMinimized = false;
    isMaximized = true;
    isClosed = false;

    widgetDOM.widgetMaximizeButton.setAttribute('hidden', 'true');
    widgetDOM.widgetMinimizeButton.removeAttribute('hidden');
    widgetDOM.widgetBody.removeAttribute('hidden');
    widgetDOM.widgetFooter.removeAttribute('hidden');
    widgetDOM.widgetCurrentAmount.removeAttribute('hidden');
    widgetDOM.widgetWrapper.removeAttribute('data-is-closed');
}

function showHamburgerMenu() {
    widgetDOM.hamburgerMenu.removeAttribute('hidden');
    const childButtons = [
        widgetDOM.widgetInfoButton,
        widgetDOM.widgetMinimizeButton,
        widgetDOM.widgetMaximizeButton,
        widgetDOM.widgetCloseButton
    ];
    childButtons.forEach(button => {
        button.setAttribute('hidden', 'true');
    });
}

function showChildButtons() {
    // widgetDOM.hamburgerMenu.setAttribute('hidden', 'true');
    // maximizeWidget();
    const childButtons = [
        widgetDOM.widgetInfoButton,
        (isMinimized || isClosed) ? widgetDOM.widgetMaximizeButton : widgetDOM.widgetMinimizeButton,
        widgetDOM.widgetCloseButton
    ];
    childButtons.forEach(button => {
        button.removeAttribute('hidden');
    });
}

function scaleWidgetActionsBarUp() {
    widgetDOM.widgetWrapper.setAttribute('data-action-bar-open', 'true');
    isActionBarOpen = true;
}


function scaleWidgetActionsBarDown() {
    clearTimeout(scaleDownTimeout);
    widgetDOM.widgetWrapper.removeAttribute('data-action-bar-open');
    showHamburgerMenu();
    isActionBarOpen = false;
}

function bindActions() {
    widgetDOM.widgetMinimizeButton.onclick = minimizeWidget
    widgetDOM.widgetMaximizeButton.onclick = maximizeWidget

    widgetDOM.widgetButtonOptIn.onclick = () => {
        actions.optin();
    }
    widgetDOM.widgetButtonOptOut.onclick = () => {
        actions.optOut();
    }
    widgetDOM.widgetInfoButton.onclick = () => displayInfoPopup();
    widgetDOM.widgetCloseButton.onclick = () => {
        softCloseWidget();
    }

    widgetDOM.hamburgerMenu.addEventListener('click', function (event: any) {
        if (!isActionBarOpen) {
            event.stopImmediatePropagation();
            event.preventDefault();

            showChildButtons();
            scaleWidgetActionsBarUp();
        } else {
            event.stopImmediatePropagation();
            event.preventDefault();
            scaleWidgetActionsBarDown();
        }
    });

    const childButtons = [
        widgetDOM.widgetInfoButton,
        widgetDOM.widgetMinimizeButton,
        widgetDOM.widgetMaximizeButton,
        widgetDOM.widgetCloseButton
    ];

    childButtons.forEach(button => {
        button.addEventListener('click', function () {
            scaleWidgetActionsBarDown();
        });
    });
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
        media.set({ key: 'widget', src: `${getCDNBase()}/lottie/cash.json`, type: 'lottie' });
    }
    actions.updateAmount(0, amount, playerCurrency);
    bindActions();
    if (!disableWidgetDrag) {
        enableDragWidget();
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
    widgetDOM.widgetWrapper.appendChild(widgetDOM.widget);
    widgetDOM.widget.appendChild(widgetDOM.widgetHeader);
    widgetDOM.widgetHeader.appendChild(widgetDOM.widgetCurrentAmount);
    widgetDOM.widgetHeader.appendChild(widgetDOM.widgetActionsBar);


    widgetDOM.widgetActionsBar.appendChild(widgetDOM.hamburgerMenu);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetInfoButton);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetMinimizeButton);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetMaximizeButton);
    widgetDOM.widgetActionsBar.appendChild(widgetDOM.widgetCloseButton);
    widgetDOM.widget.appendChild(widgetDOM.widgetBody);
    widgetDOM.widgetBody.appendChild(widgetDOM.widgetMediaWrapper);
    widgetDOM.widgetBody.appendChild(widgetDOM.widgetInfoLabelWrapper);
    widgetDOM.widget.appendChild(widgetDOM.widgetFooter);
    widgetDOM.widgetFooter.appendChild(widgetDOM.widgetButtonsOptWrapper);
    widgetDOM.widgetButtonsOptWrapper.appendChild(widgetDOM.widgetButtonOptIn);
    widgetDOM.widgetButtonsOptWrapper.appendChild(widgetDOM.widgetButtonOptOut);
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
        log(['jackpot-opt-type', getSettings().optType])
        if (getSettings().optType === 1) {
            actions.hiddenOptOut();
            actions.hiddenOptIn();
        }
        actions.connectStream()
    });
}

export { mountDOM }
