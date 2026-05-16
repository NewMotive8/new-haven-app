import actions from '../actions/index.js'
import jackpot from '../jackpot/index.js'
import texts from '../widget/texts.js'
import { createInfoPopupDOM, infoPopupDOM } from './model.js'

function displayInfoPopup() {
    createInfoPopupDOM()

    infoPopupDOM.infoPopupCloseButton.innerHTML = 'X'
    infoPopupDOM.infoPopupCloseButton.onclick = () => {
        infoPopupDOM.infoPopupWrapper.remove()
    }

    infoPopupDOM.infoPopupHeader.innerHTML = `<h1>${texts.get().titlePopup}</h1>`;
    infoPopupDOM.infoPopupHeader.appendChild(infoPopupDOM.infoPopupCloseButton)

    infoPopupDOM.infoPopupBody.innerHTML = texts.get().termsAndConditionsContent

    infoPopupDOM.infoPopupButtonOptIn.innerHTML = texts.get().optInButton
    infoPopupDOM.infoPopupButtonOptIn.onclick = () => {
        actions.optin().then(() => {
            infoPopupDOM.infoPopupWrapper.remove()
            displayInfoPopup()
        })
    }
    infoPopupDOM.infoPopupButtonOptOut.innerHTML = texts.get().optOutButton
    infoPopupDOM.infoPopupButtonOptOut.onclick = () => {
        actions.optOut().then(() => {
            infoPopupDOM.infoPopupWrapper.remove()
            displayInfoPopup()
        })
    }

    infoPopupDOM.infoPopupFooter.innerHTML = `<p>
    ${jackpot.get().userIn
            ? texts.get().termsPopupGetOutButtonLabel
            : texts.get().termsPopupAcceptButtonLabel}
        </p>`

    infoPopupDOM.infoPopupFooter.appendChild(jackpot.get().userIn
        ? infoPopupDOM.infoPopupButtonOptOut
        : infoPopupDOM.infoPopupButtonOptIn)


    infoPopupDOM.infoPopupWrapper.appendChild(infoPopupDOM.infoPopup)
    infoPopupDOM.infoPopup.appendChild(infoPopupDOM.infoPopupHeader)
    infoPopupDOM.infoPopup.appendChild(infoPopupDOM.infoPopupBody)
    infoPopupDOM.infoPopup.appendChild(infoPopupDOM.infoPopupFooter)

    const body = document.body
    body.appendChild(infoPopupDOM.infoPopupWrapper)
    infoPopupDOM.infoPopupWrapper.style.transform = `translateY(${window.pageYOffset}px)`

}

export default displayInfoPopup