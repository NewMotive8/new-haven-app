import React, { useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Typography from 'components/uiKit/typography'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import { MdKeyboardDoubleArrowRight } from 'react-icons/md'
import BrandContext from 'context/brand'
import { BiCollapseVertical, BiExpandVertical } from 'react-icons/bi'
import { userAccessByRole } from 'utils/customHooks/useRole'
import { userRoleType } from 'utils/services/api/requests/user'
import { useQuery } from 'react-query'
import brandProductsApi, { BrandProductAssignmentI } from 'utils/services/api/requests/brandProducts'
import { sideMenu } from './links'
import styles from './menu.module.scss'
import GlobalContext from 'context/global'

// Type definitions for clarity and TypeScript support
type MenuItem = {
    key: string;
    href: string;
};
type GroupItem = {
    name: string;
    icon: React.ReactElement;
};
type MenuGroup = {
    group: GroupItem;
    USER: MenuItem[];
    ADMIN: MenuItem[];
    ROOT: MenuItem[];
};
interface Props {
    userRole: userRoleType;
}

const PRODUCT_GROUP_ALIASES: Record<string, string[]> = {
    'luck-wheel': ['luckywheel', 'luckywheels', 'luckwheel'],
    'jackpot-race': ['spinsprint', 'spinsprints', 'jackpotrace'],
    Raffles: ['raffle', 'raffles'],
    jackpot: ['jackpot', 'jackpots'],
    tournament: ['tournament', 'tournaments'],
}

const PRODUCT_CONTROLLED_GROUPS = new Set(Object.keys(PRODUCT_GROUP_ALIASES))
const PRODUCT_ID_GROUP_MAP: Record<number, string> = {
    1: 'luck-wheel',
    2: 'Raffles',
    3: 'jackpot-race',
    4: 'jackpot',
    5: 'tournament',
}
const MENU_GROUP_LABELS: Record<string, string> = {
    tournament: 'Tournaments',
}

function normalizeIdentifier(value?: string | null) {
    return `${value || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getObjectIdentifiers(source: any) {
    return [
        source?.name,
        source?.slug,
        source?.code,
        source?.location,
        source?.type,
        source?.productName,
        source?.productSlug,
        source?.productCode,
        source?.productLocation,
        source?.productType,
        source?.product?.name,
        source?.product?.slug,
        source?.product?.code,
        source?.product?.location,
        source?.product?.type,
    ].map((value) => normalizeIdentifier(value)).filter(Boolean)
}

function parseAssignmentsPayload(raw: any): Array<BrandProductAssignmentI> {
    if (Array.isArray(raw)) {
        return raw
    }
    if (Array.isArray(raw?.content)) {
        return raw.content
    }
    if (Array.isArray(raw?.items)) {
        return raw.items
    }
    if (Array.isArray(raw?.data)) {
        return raw.data
    }
    return []
}

function isAssignmentActive(entry: BrandProductAssignmentI) {
    if (!entry?.enabled) {
        return false
    }

    if (typeof entry?.product?.enabled === 'boolean') {
        return entry.product.enabled
    }

    return true
}

function canMapAssignmentToGroup(assignment: BrandProductAssignmentI, groupName?: string) {
    if (!groupName) {
        return false
    }
    const aliases = PRODUCT_GROUP_ALIASES[groupName] || []
    const mappedGroupById = PRODUCT_ID_GROUP_MAP[Number(assignment?.productId || assignment?.product?.id)]
    if (mappedGroupById === groupName) {
        return true
    }
    const identifiers = getObjectIdentifiers({
        ...assignment,
        ...assignment?.product,
        product: assignment?.product,
    })

    return aliases.some((alias) => identifiers.some((value) => value.includes(normalizeIdentifier(alias))))
}

function SideMenu({ userRole }: Props) {
    const { asPath } = useRouter()
    const { currentBrand } = useContext(BrandContext)
    const [expandedGroups, setExpandedGroups] = useState<string[]>([''])
    const global = useContext(GlobalContext)
    const lastCollapseRef = useRef<number>(global?.state?.sideMenuCollapseRequest || 0)
    const shouldFilterByBrandProducts = userRole !== 'ROOT' && !!currentBrand?.id

    const { data: assignmentList = [], isError: mappingError, isLoading: mappingLoading } = useQuery(
        ['side-menu-brand-product-assignments', userRole, currentBrand?.id],
        async () => parseAssignmentsPayload(await brandProductsApi.listBrandProducts(currentBrand?.id as number)),
        { enabled: shouldFilterByBrandProducts },
    )

    useEffect(() => {
        const val = global?.state?.sideMenuCollapseRequest || 0
        if (val !== lastCollapseRef.current) {
            setExpandedGroups([])
            lastCollapseRef.current = val
        }
    }, [global?.state?.sideMenuCollapseRequest])

    const toggleGroup = (groupName: string) => {
        if (expandedGroups.includes(groupName)) {
            setExpandedGroups(expandedGroups.filter((group) => group !== groupName))
        } else {
            setExpandedGroups([...expandedGroups, groupName])
        }
    }

    const userAccess = userAccessByRole

    const enabledProductGroups = React.useMemo(() => {
        if (!shouldFilterByBrandProducts) {
            return null
        }

        const enabledGroups = new Set<string>()

        assignmentList.forEach((assignment: BrandProductAssignmentI) => {
            if (!isAssignmentActive(assignment)) {
                return
            }

            Object.keys(PRODUCT_GROUP_ALIASES).forEach((groupName) => {
                if (canMapAssignmentToGroup(assignment, groupName)) {
                    enabledGroups.add(groupName)
                }
            })
        })

        return enabledGroups
    }, [assignmentList, shouldFilterByBrandProducts])

    const accessibleSideMenu = sideMenu.filter((group: any) => {
        if (!userAccess[userRole].some((role) => group[role].length > 0)) {
            return false
        }

        if (!shouldFilterByBrandProducts) {
            return true
        }

        if (!PRODUCT_CONTROLLED_GROUPS.has(group.group.name)) {
            return true
        }

        if (mappingLoading || mappingError) {
            return false
        }

        return !!enabledProductGroups?.has(group.group.name)
    })

    return (
        <Grid className={styles.wrapper} gap="0.05rem" hidden={userRole !== 'ROOT' && !currentBrand}>
            {accessibleSideMenu.map((group: MenuGroup) => (
                <React.Fragment key={group.group.name}>
                    <Card
                        color="primary-full"
                        id={`side-menu-group${group.group.name}`}
                        onClick={() => toggleGroup(group.group.name)}
                        style={{ borderRadius: '0px', cursor: 'pointer' }}
                        verticalAlgin="center"
                        wrap="nowrap"
                    >
                        <Grid gap="0.5rem" verticalAlgin="center">
                            {group.group.icon}
                            {MENU_GROUP_LABELS[group.group.name]
                                ? <Typography>{MENU_GROUP_LABELS[group.group.name]}</Typography>
                                : <Typography translateGroup="side-menu-groups" translateKey={group.group.name} />}
                        </Grid>
                        {expandedGroups.includes(group.group.name) ? <BiCollapseVertical /> : <BiExpandVertical />}
                    </Card>
                    <Grid
                        style={{
                            maxHeight: expandedGroups.includes(group.group.name) ? '1000px' : '0px',
                            transition: 'max-height ease-in-out 0.5s',
                            overflow: 'hidden',
                        }}
                        gap="0.25rem"
                    >
                        {userAccess[userRole].map((role) => (group[role as keyof MenuGroup] as MenuItem[]).map((item: MenuItem, i: number) => {
                            if (item.href === '/jackpots/approve-wins' && !currentBrand?.hasWithdrawApproval) {
                                return null
                            }
                            const active = asPath === item.href
                            return (
                                <Grid className={styles.item} data-active={active} key={item.key}>
                                    <Grid hidden={i !== 0 || ['admin-global', 'root-global'].includes(group.group.name)}>
                                        {
                                            role === 'ADMIN'
                                                ? (
                                                    <Typography
                                                        translateGroup="side-menu-group-section"
                                                        translateKey="admin"
                                                        style={{ width: '100%', borderBottom: '1px solid var(--primary)' }}
                                                    />
                                                )
                                                : role === 'ROOT'
                                                    ? <Typography translateGroup="side-menu-group-section" translateKey="root" />
                                                    : ''
                                        }
                                    </Grid>
                                    <Link
                                        href={`${item.href}`}
                                        style={{ width: '100%' }}
                                    >
                                        <Card
                                            padding={[
                                                'p-2',
                                                role === 'USER'
                                                    ? 'ps-1'
                                                    : role === 'ADMIN'
                                                        ? 'ps-3'
                                                        : 'ps-5',
                                            ]}
                                            gap="0.5rem"
                                            color="transparent"
                                            verticalAlgin="center"
                                            wrap="nowrap"
                                            style={{ borderRadius: '2pt' }}
                                        >
                                            <MdKeyboardDoubleArrowRight />
                                            <Typography weight={500} translateGroup="side-menu-items" translateKey={item.key} />
                                        </Card>
                                    </Link>
                                </Grid>
                            )
                        }))}
                    </Grid>
                </React.Fragment>
            ))}
        </Grid>
    )
}

export default SideMenu
