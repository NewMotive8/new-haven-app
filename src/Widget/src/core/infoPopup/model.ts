import { infoPopupDOM, infoPopupDomKeys } from "../../types.js"


const infoPopupDOM: infoPopupDOM = {
    infoPopupWrapper: null,
    infoPopup: null,
    infoPopupHeader: null,
    infoPopupBody: null,
    infoPopupFooter: null,
    infoPopupButtonOptIn: null,
    infoPopupButtonOptOut: null,
    infoPopupCloseButton: null,
}

function setInfoPopupDOM(obj: any) {
    if (typeof obj !== 'object') {
        console.warn('to use set should be a object')
        return false
    }
    const keys = Object.keys(obj)
    keys.forEach((key: any) => {
        return infoPopupDOM[key as infoPopupDomKeys] = obj[key]
    })
    return infoPopupDOM
}

function createInfoPopupDOM() {
    function createDiv() { return document.createElement('div') }

    const infoPopupWrapper = createDiv()
    infoPopupWrapper.setAttribute('id', 'jooba-infoPopup-wrapper')
    const infoPopup = createDiv()
    infoPopup.setAttribute('id', 'jooba-infoPopup')

    const infoPopupHeader = createDiv()
    infoPopupHeader.setAttribute('id', 'jooba-infoPopup-header')
    const infoPopupBody = createDiv()
    infoPopupBody.setAttribute('id', 'jooba-infoPopup-body')
    const infoPopupFooter = createDiv()
    infoPopupFooter.setAttribute('id', 'jooba-infoPopup-footer')


    const infoPopupButtonOptIn = document.createElement('button')
    infoPopupButtonOptIn.setAttribute('id', 'jooba-infoPopup-opt-in-button')
    const infoPopupButtonOptOut = document.createElement('button')
    infoPopupButtonOptOut.setAttribute('id', 'jooba-infoPopup-opt-out-button')

    const infoPopupCloseButton = document.createElement('button')
    infoPopupCloseButton.setAttribute('id', 'jooba-infoPopup-close-button')

    const infoPopupInfoLabelWrapper = createDiv()
    infoPopupInfoLabelWrapper.setAttribute('id', 'jooba-infoPopup-info-label-wrapper')

    setInfoPopupDOM({
        infoPopupWrapper,
        infoPopup,
        infoPopupHeader,
        infoPopupBody,
        infoPopupFooter,
        infoPopupButtonOptIn,
        infoPopupButtonOptOut,
        infoPopupCloseButton,
        infoPopupInfoLabelWrapper
    })
}

export { infoPopupDOM, setInfoPopupDOM, createInfoPopupDOM }