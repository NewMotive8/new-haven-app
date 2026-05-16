import { WidgetDOM, WidgetDomKeys } from "../../types.js"

const widgetDOM: WidgetDOM = {
    widgetWrapper: null,
    widget: null,
    widgetHeader: null,
    widgetBody: null,
    widgetFooter: null,
    widgetCurrentAmount: null,
    widgetMediaWrapper: null,
    widgetButtonsOptWrapper: null,
    widgetButtonOptIn: null,
    widgetButtonOptOut: null,
    widgetActionsBar: null,
    widgetInfoButton: null,
    widgetMinimizeButton: null,
    widgetMaximizeButton: null,
    widgetCloseButton: null,
    widgetInfoLabelWrapper: null,
    hamburgerMenu: null,
}

function setWidgetDOM(obj: any) {
    if (typeof obj !== 'object') {
        console.warn('to use set should be a object')
        return false
    }
    const keys = Object.keys(obj)
    keys.forEach((key: any) => {
        return widgetDOM[key as WidgetDomKeys] = obj[key]
    })
    return widgetDOM
}

function createWidgetDOM(root: HTMLDivElement) {
    function createDiv() { return document.createElement('div') }

    const widgetWrapper = createDiv()
    widgetWrapper.setAttribute('id', 'jooba-widget-wrapper')
    const widget = createDiv()
    widget.setAttribute('id', 'jooba-widget')

    const widgetHeader = createDiv()
    widgetHeader.setAttribute('id', 'jooba-widget-header')
    const widgetBody = createDiv()
    widgetBody.setAttribute('id', 'jooba-widget-body')
    const widgetFooter = createDiv()
    widgetFooter.setAttribute('id', 'jooba-widget-footer')


    const widgetCurrentAmount = createDiv()
    widgetCurrentAmount.setAttribute('id', 'jooba-widget-current-amount')

    const widgetMediaWrapper = createDiv()
    widgetMediaWrapper.setAttribute('id', 'jooba-widget-media-wrapper')


    const widgetButtonsOptWrapper = createDiv()
    widgetButtonsOptWrapper.setAttribute('id', 'jooba-widget-buttons-opt-wrapper')
    const widgetButtonOptIn = document.createElement('button')
    widgetButtonOptIn.setAttribute('id', 'jooba-widget-opt-in-button')
    const widgetButtonOptOut = document.createElement('button')
    widgetButtonOptOut.setAttribute('id', 'jooba-widget-opt-out-button')


    const widgetActionsBar = createDiv()
    widgetActionsBar.setAttribute('id', 'jooba-widget-actions-bar')


    const hamburgerMenu = document.createElement('div');
    hamburgerMenu.setAttribute('id', 'jooba-widget-hamburger-menu')
    const widgetInfoButton = document.createElement('button')
    widgetInfoButton.setAttribute('id', 'jooba-widget-info-button')
    const widgetMinimizeButton = document.createElement('button')
    widgetMinimizeButton.setAttribute('id', 'jooba-widget-minimize-button')
    const widgetMaximizeButton = document.createElement('button')
    widgetMaximizeButton.setAttribute('id', 'jooba-widget-maximize-button')
    const widgetCloseButton = document.createElement('button')
    widgetCloseButton.setAttribute('id', 'jooba-widget-close-button')

    const widgetInfoLabelWrapper = createDiv()
    widgetInfoLabelWrapper.setAttribute('id', 'jooba-widget-info-label-wrapper')

    setWidgetDOM({
        widgetWrapper,
        widget,
        widgetHeader,
        widgetBody,
        widgetFooter,
        widgetCurrentAmount,
        widgetMediaWrapper,
        widgetButtonsOptWrapper,
        widgetButtonOptIn,
        widgetButtonOptOut,
        widgetActionsBar,
        widgetInfoButton,
        widgetMinimizeButton,
        widgetMaximizeButton,
        widgetCloseButton,
        widgetInfoLabelWrapper,
        hamburgerMenu,
    })
}

export { widgetDOM, setWidgetDOM, createWidgetDOM }