import settings from "./core/settings/index.js";

function log(log: any) {
    if (settings.get().log) { console.info(log) }
}


export default log