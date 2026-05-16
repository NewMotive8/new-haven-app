import Card from 'components/cards/card'
import React, { useEffect } from 'react'
import { Widget } from 'utils/services/api/requests/jackpots/types'
import { CrudContext } from '../../../..'

declare global {
    interface Window {
        jooba: any;
        joobaLW: any;
    }
}
function removeStylesById(id: string) {
    const styles = document.querySelectorAll(`#${id}`)
    styles.forEach((style) => {
        style.remove()
    })
}
export default function WidgetPreview() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)

    const { widget } = selectedItem
    const { jooba } = window
    const {
        widgetDesign,
        widgetMediaType,
        widgetMediaUrl,
        widgetCustomCss,
    } = widget as Widget
    function updateModel() {
        jooba.actions.destroy()
        removeStylesById('jooba-widget-style-file')
        removeStylesById('jooba-widget-style-file-default')

        const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL || 'https://backoffice.hintx.org/cdn'
        const style = (widgetDesign && widgetCustomCss)
            ? { model: widgetDesign, src: widgetCustomCss }
            : widgetDesign === 1
                ? { model: 1, src: `${CDN_BASE}/styles/style1.css` }
                : widgetDesign === 2
                    ? { model: 2, src: `${CDN_BASE}/styles/style2.css` }
                    : { model: 3, src: `${CDN_BASE}/styles/style3.css` }

        const media = (widgetMediaType && widgetMediaUrl)
            ? { key: 'widget', type: widgetMediaType, src: widgetMediaUrl }
            : widgetDesign === 1
                ? { key: 'widget', type: 'lottie', src: `${CDN_BASE}/lottie/catMoney.json` }
                : widgetDesign === 2
                    ? { key: 'widget', type: 'lottie', src: `${CDN_BASE}/lottie/cash.json` }
                    : { key: 'widget', type: 'img', src: `${CDN_BASE}/images/static2.png` }

        jooba.init({
            brandId: 'jooba',
            eventId: '111',
            playerId: 'player1',
            applicationKey: '',
            style,
            media,
            signature: '',
            onlyPreview: true,
        })
    }

    useEffect(() => {
        jooba.actions.destroy()
        removeStylesById('jooba-widget-style-file')
        updateModel()
    }, [widget])

    return (
        <Card style={{ height: '300px', position: 'relative' }} color="primary-outline">
            <div id="jooba-container-root" style={{ transform: 'translateY(-70px)' }} />
        </Card>
    )
}
