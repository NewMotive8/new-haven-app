import React, { useContext } from 'react'
import GlobalContext from 'context/global'
import { breakPointsType } from 'utils/globalTypes'
import { gridProps, responsiveWidthType } from './types'
import styles from './grid.module.scss'
import animations from './animations.module.scss'

function getValueForAppSize(responsiveWidthList: responsiveWidthType, appSize: breakPointsType) {
    const appSizes = ['xsm', 'sm', 'md', 'lg', 'xl', 'xxl']
    const index = appSizes.indexOf(appSize)

    if (Object.prototype.hasOwnProperty.call(responsiveWidthList, appSize)) {
        return responsiveWidthList[appSize]
    }

    for (let i = index - 1; i >= 0; i -= 1) {
        const size = appSizes[i] as breakPointsType
        if (Object.prototype.hasOwnProperty.call(responsiveWidthList, size)) {
            return responsiveWidthList[size]
        }
    }

    for (let i = index + 1; i < appSizes.length; i += 1) {
        const size = appSizes[i] as breakPointsType
        if (Object.prototype.hasOwnProperty.call(responsiveWidthList, size)) {
            return responsiveWidthList[size]
        }
    }

    return 100
}

export default function Grid({
    wrap,
    gap: gapProps,
    style,
    horizontalAlgin,
    verticalAlgin,
    margin,
    padding,
    children,
    className,
    width,
    height,
    responsiveWidth,
    animation,
    anchorPlacement,
    easing,
    animationDuration,
    animationDelay,
    animateOnScroll,
    innerRef,
    hidden,
    ...divProps
}: gridProps) {
    const { state } = useContext(GlobalContext)
    const { appSize } = state
    const childrenLength = React.Children.count(children)
    const gap = childrenLength < 2 ? 0 : (gapProps || 0)
    const gridRef: any = React.useRef(null)
    const [currentRefFromParent, setCurrentRefFromParent] = React.useState<any>(null)
    let timeout: any
    let lastState: any = null

    function getCurrentRef() {
        return gridRef
    }

    function UpdateInnerRef() {
        if (innerRef) {
            innerRef({
                current: gridRef.current,
                setRefCurrent: (customRef: any) => setCurrentRefFromParent(customRef),
                getCurrentRef,
            })
        }
    }

    React.useEffect(() => {
        if (currentRefFromParent && typeof currentRefFromParent === 'object') {
            const keys = Object.keys(currentRefFromParent)
            keys.forEach((key: string) => {
                gridRef.current[key] = currentRefFromParent[key]
            })
            setCurrentRefFromParent(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRefFromParent])

    React.useEffect(() => {
        if (innerRef) {
            UpdateInnerRef()
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', () => UpdateInnerRef())
                window.addEventListener('dragstart', () => UpdateInnerRef())
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function debounce(func: any, wait: number) {
        return function df(args: any) {
            clearTimeout(timeout)
            timeout = setTimeout(() => func(args), wait)
        }
    }

    const handleIntersection = (entries: any) => {
        const isVisible = entries[0].isIntersecting

        if (isVisible && lastState !== 'visible' && gridRef.current) {
            gridRef.current.classList.add(animations.active)
            gridRef.current.setAttribute('data-is-visible', 'visible')
            gridRef.current.style.opacity = 1
            lastState = 'visible'
        } else if (!isVisible && lastState !== 'hide' && gridRef.current) {
            gridRef.current.classList.remove(animations.active)
            gridRef.current.setAttribute('data-is-visible', 'hide')
            gridRef.current.style.opacity = 0
            lastState = 'hide'
        }
    }

    const debouncedHandleIntersection = debounce(handleIntersection, 300)

    React.useEffect(() => {
        let observer: any
        if (animateOnScroll && gridRef.current) {
            observer = new IntersectionObserver(
                debouncedHandleIntersection,
                {
                    rootMargin: '15px',
                    threshold: 0.25,
                },
            )

            observer.observe(gridRef.current)
        }

        return () => {
            if (observer) observer.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animateOnScroll])

    function gridWidth() {
        if (responsiveWidth) {
            const rWidth = getValueForAppSize(responsiveWidth, appSize)
            return typeof rWidth === 'number' ? `${rWidth}%` : rWidth
        }
        if (typeof width === 'number') {
            return `${width}%`
        }
        return width
    }
    function gridHeight() {
        if (typeof height === 'number') {
            return { height: `${height}%` }
        }
        return { height }
    }

    let animationClassNames = styles.grid

    if (animation && animations[animation]) {
        animationClassNames += ` ${animations[animation]}`
    }

    if (anchorPlacement && animations[anchorPlacement]) {
        animationClassNames += ` ${animations[anchorPlacement]}`
    }

    if (easing && animations[easing]) {
        animationClassNames += ` ${animations[easing]}`
    }
    if (hidden) {
        return <></>
    }

    return (
        <div
            ref={gridRef}
            data-animate={!!animateOnScroll}
            data-is-visible={false}
            className={`${animationClassNames} ${className || ''}`}
            data-margin={margin}
            data-padding={padding}
            style={{
                width: gridWidth() || '100%',
                ...(height && gridHeight()),
                gap,
                display: 'flex',
                justifyContent: horizontalAlgin || 'flex-start',
                alignContent: verticalAlgin || 'baseline',
                alignItems: verticalAlgin || 'baseline',
                flexWrap: wrap || 'wrap',
                opacity: animateOnScroll ? 0 : ['0%', '0px', 0].includes(gridWidth() || '') ? 0 : 'unset',
                animationDuration: animationDuration || '1s',
                animationDelay: animationDelay || '0s',
                ...style,
            }}
            {...divProps}
        >
            {children}
        </div>
    )
}
