import actions from "../actions/index.js";
import widget from "../widget/index.js";

interface updateStyleProps {
    src: string,
    model?: number | any
}


function updateStyle({ src, model }: updateStyleProps) {
    if (model) {
        document.getElementById('jooba-widget-wrapper')?.remove();
        return widget.display({ style: { src, model } })
    }
    return actions.setStyleFile(src)
}

export default updateStyle