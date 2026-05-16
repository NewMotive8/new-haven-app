import log from "../../log.js";
import texts from "../widget/texts.js"


const data: any = {
    amount: 0,
    headerLabel: "",
    jackpotName: "",
    noOptinLabel: "",
    optinLabel: "",
    terms: "",
    widgetAnimation: 0,
    widgetDesign: 0,
    userIn: false,
    userWin: false
};

const keyToTextMap: { [key: string]: string } = {
    jackpotName: "jackpotName",
    optinLabel: "optInButton",
    noOptinLabel: "optOutButton",
    terms: "termsAndConditionsContent"
};

function updateTexts(key: string, value: string): void {
    if (keyToTextMap[key]) {
        texts.set(keyToTextMap[key] as any, value);
    }
}

function set(obj: Record<string, any>) {
    if (typeof obj !== 'object') {
        console.warn('To use set, it should be an object.');
        return data;
    }

    log('action: set jackpot data');
    log(JSON.stringify(obj));

    Object.entries(obj).forEach(([key, value]) => {
        if (data.hasOwnProperty(key)) {
            data[key] = value;
            updateTexts(key, value);
        }
    });

    return data;
}

function update(key: any, value: any): any {
    data[key] = value;
    updateTexts(key, value);
    return data[key];
}

function get() {
    return data;
}

const jackpot = {
    get,
    set,
    update,
};

export default jackpot;
export { set, update, get };
