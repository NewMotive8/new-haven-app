/* eslint-disable react/destructuring-assignment */
import React, { useState } from 'react'
import { BsInfoCircle } from 'react-icons/bs'
import styles from './styles.module.scss'

interface Props {
    content: React.ReactNode,
    style?: React.CSSProperties,
}
let hideTimeout: any = null
export default function InfoHover(props: Props) {
    const { content: text, style } = props
    const [display, setDisplay] = useState(false)

    function hideInfo() {
        hideTimeout = setTimeout(() => {
            setDisplay(false)
            clearTimeout(hideTimeout)
        }, 500)
    }

    function displayInfo() {
        clearTimeout(hideTimeout)
        setDisplay(true)
    }

    return (
        <div className={styles.wrapper}>
            <div
                className={styles.content}
                onMouseEnter={() => displayInfo()}
                onMouseLeave={() => hideInfo()}
                style={style}
            >
                <BsInfoCircle />
                {
                    display && (
                        <div
                            className={styles['text-wrapper']}
                        >
                            <div
                                onMouseEnter={() => displayInfo()}
                                onMouseLeave={() => hideInfo()}
                                className={styles['text-content']}
                            >
                                {text}
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}
