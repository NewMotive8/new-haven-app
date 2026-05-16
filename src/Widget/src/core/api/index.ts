import { Api } from "../../types.js";
import settings from "../settings/index.js";


async function get(url: string) {
    return fetch(url).then(res => res.json())
}
async function postOpt(url: string, body: object) {
    const { signature } = settings.get()
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-JP-Signature': signature
        },
        body: JSON.stringify(body)
    }).then(res => res.json)
}
async function postBet(url: string, body: object) {
    const { signatureBet } = settings.get()
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-JP-Signature': signatureBet
        },
        body: JSON.stringify(body)
    }).then(res => res.json)
}

const api: Api = {
    get,
    postOpt,
    postBet
}

export default api