import { CustomWinAnimation } from "../../types.js";
import anime from "animejs";
import jackpot from "../jackpot/index.js";
import texts from "../widget/texts.js";
import settings, { getSettings } from "../settings/index.js";
import confetti from 'canvas-confetti'
import lottie from "lottie";
import { formatCurrency } from "../utils/index.js";
import actions from "../actions/index.js";


function displayAnimation(props: CustomWinAnimation) {
    const {
        lottieUrl,
        cssUrl,
        amountWon,
        currency: propsCurrency,
    } = props

    const winAmount = amountWon || jackpot.get().amount
    const currency = propsCurrency || getSettings().playerCurrency


    const animationContainer = document.createElement('div')
    animationContainer.setAttribute('id', 'jooba-animation-container')

    const lottieSVG = document.createElement('svg')
    lottieSVG.setAttribute('id', 'jooba-animation-media')

    const textsWrapper = document.createElement('div')
    textsWrapper.setAttribute('id', 'jooba-animation-texts-wrapper')

    const textWin = document.createElement('p');
    textWin.setAttribute('id', 'jooba-animation-text-win')
    textWin.innerHTML = texts.get().winMessage

    const textAmountWin = document.createElement('p');
    textAmountWin.setAttribute('id', 'jooba-animation-amount-win')

    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.setAttribute('id', 'jooba-animation-confetti')

    const closeButton = document.createElement('span');
    closeButton.setAttribute('id', 'jooba-animation-close-button')
    closeButton.innerHTML = 'X Close'


    animationContainer.appendChild(lottieSVG);
    animationContainer.appendChild(confettiCanvas);
    animationContainer.appendChild(textsWrapper);
    animationContainer.appendChild(closeButton);
    textsWrapper.appendChild(textWin);
    textsWrapper.appendChild(textAmountWin);
    document.getElementsByTagName('body')[0].appendChild(animationContainer);
    document.body.scrollIntoView({
        behavior: 'smooth',
        block: "start",
        inline: "start"
    });
    const _style = document.createElement('link');
    _style.setAttribute('rel', 'stylesheet');
    if (cssUrl) {
        _style.setAttribute('href', cssUrl);
    }
    _style.setAttribute('id', 'jooba-win-animation-style-file');
    document.getElementsByTagName('head')[0].appendChild(_style);

    lottie.loadAnimation({
        container: lottieSVG,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: lottieUrl
    })
    anime({
        targets: lottieSVG,
        translateY: ['-100%', '0%'],
        duration: 2000,
        easing: 'cubicBezier(.5, .05, .1, .3)'
    });



    closeButton.onclick = () => {
        animationContainer.innerHTML = ''
        animationContainer.remove();
        jackpot.update('userWin', false)
    }


    anime({
        targets: textAmountWin,
        textContent: winAmount,
        value: [0, winAmount],
        round: 1,
        duration: 4000,
        easing: 'easeInOutQuad',
        update: function (a: any) {
            const _value = (winAmount / 100) * a.progress
            if (a.progress === 100) {
                textAmountWin.innerHTML = formatCurrency(winAmount, currency || 'USD')
                anime({
                    targets: textAmountWin,
                    opacity: [1, 0.1],
                    loop: 10,
                    duration: 1000,
                    direction: 'alternate',
                    easing: 'cubicBezier(.5, .05, .1, .3)'
                });
                anime({
                    targets: textWin,
                    opacity: [1, 0.1],
                    loop: 10,
                    duration: 1000,
                    direction: 'alternate',
                    easing: 'cubicBezier(.5, .05, .1, .3)'
                });
                var winConfetti = confetti?.create && confetti.create(confettiCanvas, {
                    resize: true,
                    useWorker: true
                });
                winConfetti({
                    particleCount: 200,
                    spread: 160
                    // any other options from the global
                    // confetti function
                });
            } else {
                textAmountWin.innerHTML = formatCurrency(_value, currency || 'USD')
            }
        },
    })

}

export default displayAnimation