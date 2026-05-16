import { PropsRender, SetMediaProps } from "../../types.js";
import actions from "../actions/index.js";
import jackpot from "../jackpot/index.js"
import settings, { setSettings } from "../settings/index.js"
import { createWidgetDOM } from "./model.js"
import { mountDOM } from "./styles/1.js";
import { mountDOM as style2 } from "./styles/2.js";
import { mountDOM as style3 } from "./styles/3.js";

const DEFAULT_STYLE_INDEX = 0;
const models = [mountDOM, mountDOM, style2, style3];  // Repeated mountDOM to match the length and indices of styleFiles array.
// CDN URLs - defaults to localhost for local development
// For production, these should be overridden via environment or config
const getCDNBase = (): string => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3015/cdn';
        }
    }
    return 'https://backoffice.hintx.org/cdn';
};

const CDN_BASE = getCDNBase();

const styleFiles = [
    `${CDN_BASE}/styles/style1.css`,
    `${CDN_BASE}/styles/style1.css`,
    `${CDN_BASE}/styles/style2.css`,
    `${CDN_BASE}/styles/style3.css`
];

function display(props?: PropsRender) {
    const { root: rootProps, style: styleProps, media, disableWidgetDrag } = props || {};
    const rootDiv: HTMLDivElement | null = document.getElementById('jooba-container-root') as HTMLDivElement;
    const root = settings.get().root || rootProps || rootDiv || document.getElementsByTagName('body')[0];

    setSettings('root', root);
    createWidgetDOM(root);

    const styleModelIndex = styleProps?.model || jackpot.get().widgetDesign || DEFAULT_STYLE_INDEX;
    const styleSrc = styleProps && styleProps.src ? styleProps.src : styleFiles[styleModelIndex] || styleFiles[DEFAULT_STYLE_INDEX];
    actions.setStyleFile(styleSrc, 'jooba-widget-style-file-default')

    models[styleModelIndex]
        ? models[styleModelIndex](root, styleSrc, media as SetMediaProps, !!disableWidgetDrag)
        : models[DEFAULT_STYLE_INDEX](root, styleSrc, media as SetMediaProps, !!disableWidgetDrag);  // Default style if not exists the design from jackpot.

    if (!rootProps && !rootDiv) {
        console.warn('Not provided a div with id="jooba-container-root" to widget be implemented, so jooba used the document.body like root');
    }
}

export default display;
