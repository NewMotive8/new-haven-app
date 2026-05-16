import Card from 'components/cards/card'
import Typography from 'components/uiKit/typography'
import React, { useContext } from 'react'
import { TiInfoLargeOutline } from 'react-icons/ti'
import Button from 'components/uiKit/buttons'
import { FormContext } from '../../..'

function applyBorderStyle(
    element: HTMLElement,
    borderStyle: string,
    padding: string,
    borderRadius: string,
    delay: number,
) {
    element.style.transition = 'all ease-in-out 300ms'
    element.style.borderRadius = borderRadius
    element.style.padding = padding

    const transitions = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800]
    transitions.forEach((transitionDelay, index) => {
        setTimeout(() => {
            element.style.border = index % 2 === 0 ? borderStyle : '2px solid transparent'
            if (transitionDelay === 2700) {
                element.style.padding = padding
                element.style.borderRadius = borderRadius
            }
        }, delay + transitionDelay)
    })
}

function resetBoxStyle(element: HTMLElement) {
    element.style.transition = 'unset'
    element.style.border = 'unset'
    element.style.padding = '0'
    element.style.borderRadius = '0'
}
export default function NotSeedRequired() {
    const { setCurrentTab, tabs } = useContext(FormContext)

    function handleBack() {
        const basicTab = tabs.find((tab) => tab.value === 'model')
        if (basicTab) {
            setCurrentTab(basicTab)
            setTimeout(() => {
                const reSeedAmountBox = document.getElementById('re-seed-amount-box')
                if (reSeedAmountBox) {
                    applyBorderStyle(reSeedAmountBox, '2px solid var(--warning)', '0.5rem', '10pt', 0)
                    setTimeout(() => resetBoxStyle(reSeedAmountBox), 3000)
                    const input = reSeedAmountBox.querySelector('input')
                    if (input) {
                        input.focus()
                    }
                }
            }, 300)
        }
    }

    return (
        <Card color="info" horizontalAlgin="center" verticalAlgin="center" style={{ minHeight: '200px' }}>
            <TiInfoLargeOutline size={100} />
            <Typography
                translateGroup="seed-form"
                translateKey="no-seed-configuration-required-given-the-re-seed-amount-after-a-win-is-zero"
                style={{
                    width: '100%',
                    textAlign: 'center',
                }}
                weight={600}
            />
            <Button id="back-to-setup-re-seed" onClick={() => handleBack()}>
                <Typography
                    translateGroup="seed-form"
                    translateKey="back-to-setup-re-seed"
                />
            </Button>
        </Card>
    )
}
