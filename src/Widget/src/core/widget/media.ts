import { SetMediaProps } from "../../types.js"
import log from "../../log.js"
import { widgetDOM } from "./model.js"
import lottie from "lottie"




function set(props: SetMediaProps) {
    const { key, type, src, lottieConfig } = props

    if (key === 'widget' && widgetDOM?.widgetMediaWrapper) {
        const id = 'jooba-widget-media'
        if (type === 'img' || type === 'image') {
            widgetDOM.widgetMediaWrapper.innerHTML = ''
            const mediaElement = document.createElement('img')
            mediaElement.setAttribute('src', src)
            mediaElement.setAttribute('id', id)
            return widgetDOM.widgetMediaWrapper.appendChild(mediaElement)
        }
        else if (type === 'lottie') {
            widgetDOM.widgetMediaWrapper.innerHTML = ''
            const mediaElement = document.createElement('div')
            mediaElement.setAttribute('id', id)
            widgetDOM.widgetMediaWrapper.appendChild(mediaElement)
            const config = {
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: src,
                ...lottieConfig,
                container: mediaElement,
            }
            return lottie.loadAnimation(config);
        }

    }

    return log(`action: update media failed because ${key} is not valid.`)
}

const media = {
    set,
}

export default media