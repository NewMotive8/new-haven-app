import React, { useState } from 'react'
import styles from './styles.module.scss'

interface CarouselProps {
    title: string;
    showArrows: boolean;
    cardsPerView: number;
    children: React.ReactNode; // Assuming each card is passed as a child
}

function Carousel({
    title, showArrows, cardsPerView, children,
}: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const childrenArray = React.Children.toArray(children)

    // Ensure we don't set the index out of the bounds
    const lastIndex = childrenArray.length - cardsPerView

    // Function to handle clicking the "next" arrow
    const nextSlide = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, lastIndex))
    }

    // Function to handle clicking the "previous" arrow
    const prevSlide = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0))
    }

    // Calculate the visible children based on the currentIndex
    const visibleChildren = childrenArray.slice(currentIndex, currentIndex + cardsPerView)

    return (
        <div className={styles['carousel-container']}>
            <div className={styles['carousel-header']}>
                <h2>{title}</h2>
                {showArrows && (
                    <div className={styles['carousel-arrows']}>
                        <button type="button" onClick={prevSlide}>{'<'}</button>
                        <button type="button" onClick={nextSlide}>{'>'}</button>
                    </div>
                )}
            </div>
            <div className={styles['carousel-content']}>
                {visibleChildren}
            </div>
        </div>
    )
}

export default Carousel
