import { BsDiamond } from 'react-icons/bs'
import { GiCartwheel } from 'react-icons/gi'
import { GrUserAdmin } from 'react-icons/gr'
import { IoDiamondOutline, IoTrophyOutline } from 'react-icons/io5'
import { VscTools } from 'react-icons/vsc'

export const sideMenu = [
    {
        group: { name: 'luck-wheel', icon: <GiCartwheel size={20} /> },
        USER: [
            { key: 'luck-wheel-setup', href: '/lucky-wheel/setup' },
            { key: 'wheel-rules', href: '/lucky-wheel/wheel-rules' },
            { key: 'wheel-rule-instances', href: '/lucky-wheel/wheel-rule-instances' },
            { key: 'rule-progress', href: '/lucky-wheel/rule-progress' },
        ],
        ADMIN: [],
        ROOT: [],
    },
    {
        group: { name: 'jackpot-race', icon: <IoTrophyOutline size={20} /> },
        USER: [
            { key: 'jackpot-race', href: '/spinsprint/setup' },
            { key: 'Players', href: '/spinsprint/player' },
            { key: 'Wins', href: '/spinsprint/win' },
            { key: 'Player Wins', href: '/spinsprint/player-win' },
            { key: 'Segments', href: '/spinsprint/segments' },
            { key: 'Events', href: '/spinsprint/events' },
        ],
        ADMIN: [],
        ROOT: [],
    },
    {
        group: { name: 'Raffles', icon: <IoTrophyOutline size={20} /> },
        USER: [
            { key: 'Raffles', href: '/raffles/setup' },
            { key: 'Tickets', href: '/raffles/player' },
            { key: 'Entries', href: '/raffles/win' },
            { key: 'Player Wins', href: '/raffles/player-win' },
            { key: 'Segments', href: '/raffles/segments' },
            { key: 'Events', href: '/raffles/events' },
        ],
        ADMIN: [],
        ROOT: [],
    },
    {
        group: { name: 'jackpot', icon: <IoDiamondOutline size={20} /> },
        USER: [
            { key: 'jackpot-dashboard', href: '/jackpots/dashboard' },
            { key: 'jackpots', href: '/jackpots' },
            { key: 'jackpot-simulator', href: '/jackpots/simulator' },
            { key: 'jackpot-players', href: '/jackpots/players' },
            { key: 'jackpot-segments', href: '/jackpots/segments' },
            { key: 'jackpot-events', href: '/jackpots/events' },
            { key: 'jackpot-approve-wins', href: '/jackpots/approve-wins' },
            { key: 'jackpot-jackpot-winners', href: '/jackpots/jackpot-winners' },
        ],
        ADMIN: [
            { key: 'jackpot-pools', href: '/jackpots/admin/pools' },
            { key: 'jackpot-seeds', href: '/jackpots/admin/seeds' },
            { key: 'jackpot-alerts', href: '/jackpots/admin/alerts' },
            { key: 'jackpot-default-widget-content', href: '/jackpots/admin/default-widget-content' },
        ],
        ROOT: [],
    },
    {
        group: { name: 'tournament', icon: <IoTrophyOutline size={20} /> },
        USER: [
            { key: 'Tournaments', href: '/tournament/setup' },
            { key: 'Players', href: '/tournament/player' },
            { key: 'Wins', href: '/tournament/win' },
            { key: 'Player Wins', href: '/tournament/player-win' },
            { key: 'Segments', href: '/tournament/segments' },
            { key: 'Events', href: '/tournament/events' },
        ],
        ADMIN: [],
        ROOT: [],
    },
    {
        group: { name: 'admin-global', icon: <GrUserAdmin size={20} /> },
        USER: [],
        ADMIN: [
            { key: 'admin-users', href: '/admin/users' },
            { key: 'admin-brands', href: '/admin/brands' },
            { key: 'admin-exchange-rates', href: '/admin/exchange-rates' },
        ],
        ROOT: [],
    },
    {
        group: { name: 'root-global', icon: <VscTools size={20} /> },
        USER: [],
        ADMIN: [],
        ROOT: [
            { key: 'root-properties', href: '/root/properties' },
            { key: 'root-products', href: '/root/products' },
            { key: 'root-operators', href: '/root/operators' },
            { key: 'root-tiers', href: '/root/tiers' },
            { key: 'root-currencies', href: '/root/currencies' },
            { key: 'root-allTranslations', href: '/root/all-translations' },
        ],
    },
]
