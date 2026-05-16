import {
    elementsMargin,
    elementsPadding,
    flexAlignContent,
    flexJustifyContent,
    breakPointsType,
    IntRange,
} from 'utils/globalTypes'
import React, { CSSProperties, ReactNode } from 'react'

export type responsiveWidthType = { [key in breakPointsType]?: IntRange<0, 101> | number | 'fit-content' | string }

type AnimationType =
    'fade'
    | 'fade-up'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right'
    | 'fade-up-right'
    | 'fade-up-left'
    | 'fade-down-right'
    | 'fade-down-left'
    | 'flip-up'
    | 'flip-down'
    | 'flip-left'
    | 'flip-right'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'zoom-in'
    | 'zoom-in-up'
    | 'zoom-in-down'
    | 'zoom-in-left'
    | 'zoom-in-right'
    | 'zoom-out'
    | 'zoom-out-up'
    | 'zoom-out-down'
    | 'zoom-out-left'
    | 'zoom-out-right';

type AnchorPlacement =
    'top-bottom'
    | 'top-center'
    | 'top-top'
    | 'center-bottom'
    | 'center-center'
    | 'center-top'
    | 'bottom-bottom'
    | 'bottom-center'
    | 'bottom-top';

type EasingFunction =
    'linear'
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'ease-in-back'
    | 'ease-out-back'
    | 'ease-in-out-back'
    | 'ease-in-sine'
    | 'ease-out-sine'
    | 'ease-in-out-sine'
    | 'ease-in-quad'
    | 'ease-out-quad'
    | 'ease-in-out-quad'
    | 'ease-in-cubic'
    | 'ease-out-cubic'
    | 'ease-in-out-cubic'
    | 'ease-in-quart'
    | 'ease-out-quart'
    | 'ease-in-out-quart';

export interface gridBaseProps extends React.HTMLProps<HTMLDivElement> {
    width?: IntRange<1, 101> | 'fit-content' | string,
    height?: any,
    responsiveWidth?: responsiveWidthType,
    className?: any,
    wrap?: 'nowrap' | 'wrap',
    horizontalAlgin?: flexJustifyContent,
    verticalAlgin?: flexAlignContent,
    gap?: any,
    style?: CSSProperties,
    margin?: elementsMargin | Array<elementsMargin>,
    padding?: elementsPadding | Array<elementsPadding>,
    animation?: AnimationType;
    anchorPlacement?: AnchorPlacement;
    easing?: EasingFunction;
    animationDuration?: string;
    animationDelay?: string;
    animateOnScroll?: boolean;
    innerRef?: Function;
}

export interface gridProps extends gridBaseProps {
    children: ReactNode,
}
