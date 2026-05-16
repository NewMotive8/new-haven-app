function showWonPopup(wonInfo, onClose) {
    // 1) Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;

    // 2) Create the popup box
    const popupBox = document.createElement('div');
    popupBox.style.backgroundColor = '#fff';
    popupBox.style.borderRadius = '8px';
    popupBox.style.padding = '1rem 1.5rem';
    popupBox.style.maxWidth = '320px';
    popupBox.style.width = '80%';
    popupBox.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    popupBox.style.textAlign = 'center';
    popupBox.style.display = 'flex';
    popupBox.style.flexWrap = 'wrap';
    popupBox.style.justifyContent = 'center';
    popupBox.style.alignItems = 'center';

    // 3) Title / heading
    const title = document.createElement('h2');
    title.innerText = 'Congratulations!';
    title.style.marginTop = '0';
    title.style.width = '100%';
    popupBox.appendChild(title);

    // 4) The main content about the won segment
    const wonText = document.createElement('p');
    wonText.style.width = '100%';
    wonText.style.textAlign = 'center';
    wonText.innerHTML = `You won segment: ${wonInfo.segmentInfo.winMessageContent || wonInfo.segmentInfo.text || wonInfo.segmentInfo.id}`;
    popupBox.appendChild(wonText);

    // Optionally, show an icon if the segment has one
    if (wonInfo.segmentInfo.icon) {
        const iconWrapper = document.createElement('div');
        iconWrapper.style.width = '100%';
        iconWrapper.style.display = 'flex';
        iconWrapper.style.flexWrap = 'wrap';
        iconWrapper.style.justifyContent = 'center';
        iconWrapper.style.alignItems = 'center';
        const iconEl = document.createElement('img');
        iconEl.src = wonInfo.segmentInfo.icon;
        iconEl.style.maxWidth = '50%';
        iconEl.style.margin = '0.5rem auto';
        iconWrapper.appendChild(iconEl);
        popupBox.appendChild(iconWrapper);
    }

    // 5) Add a close button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'OK';
    closeBtn.style.marginTop = '2rem';
    closeBtn.style.padding = '0.5rem 1rem';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.backgroundColor = '#007bff';
    closeBtn.style.color = '#fff';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (onClose) onClose();
    });
    popupBox.appendChild(closeBtn);

    // Put the box in the overlay and add overlay to body
    overlay.appendChild(popupBox);
    document.body.appendChild(overlay);
}


// 2) SPIN WHEEL WITH GSAP
function engagdSpinWheel({
    selectedSegment,
    wheelSetup,
    onComplete,
    spins = 8,
    duration = 8,
}) {
    // Identify the winning wheel & segment
    let wonInfo = null;
    wheelSetup.wheels.forEach((wheel, wheelIndex) => {
        const foundSegment = wheel.segments.find((segment) => segment.id === selectedSegment);
        if (foundSegment) {
            wonInfo = {
                wonWheelIndex: wheelIndex,
                wheelInfo: {
                    wheelContainerId: wheel.wheelContainerId,
                    segments: wheel.segments,
                },
                segmentInfo: foundSegment,
            };
        }
    });

    const tickerElement = wheelSetup.ticker;
    const initialTickerTop = parseFloat(getComputedStyle(tickerElement).top) || 0;

    // Helper: move the ticker using GSAP
    function moveTicker(index) {
        if (!tickerElement) return;
        const offsetPerWheel = 50; // adjust this as needed for your layout
        const newTopPosition = initialTickerTop + index * offsetPerWheel;

        // Instead of CSS transitions, use GSAP:
        gsap.to(tickerElement, {
            duration: 0.3,
            top: newTopPosition,
            ease: 'power2.inOut',
        });
    }

    // Recursively spin each wheel
    function spinWheelSequentially(index) {
        // When we reach beyond the last wheel, we're done
        if (index >= wheelSetup.wheels.length) {
            if (onComplete) onComplete();
            return;
        }

        const wheel = wheelSetup.wheels[index];
        const element = document.getElementById(wheel.wheelContainerId);
        if (!element) {
            // Skip to the next wheel if the element is not found
            spinWheelSequentially(index + 1);
            return;
        }

        // Move the ticker for the current wheel
        moveTicker(index);

        // If this wheel is before the winning wheel...
        if (index < wonInfo.wonWheelIndex) {
            // We spin a full rotation with a small overshoot and then bounce back
            const finalRotation = 360 * spins;
            const overshoot = 5; // degrees

            // Phase 1: spin to final + overshoot
            gsap.to(element, {
                duration: duration - 3,
                rotation: finalRotation + overshoot,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Phase 2: bounce back
                    gsap.to(element, {
                        duration: 3,
                        rotation: finalRotation,
                        ease: 'bounce.out',
                        onComplete: () => {
                            // Move on
                            spinWheelSequentially(index + 1);
                        },
                    });
                },
            });

        } else if (index === wonInfo.wonWheelIndex) {
            // The *winning* wheel
            if (wonInfo.wheelInfo.segments.length === 1) {
                // If there's only one segment, no actual spin needed
                if (onComplete) onComplete();
                return showWonPopup(wonInfo);
            }

            const { startAngleDeg, endAngleDeg } = wonInfo.segmentInfo;
            const midAngleDeg = (startAngleDeg + endAngleDeg) / 2;
            // We want that segment's midpoint to land at 90° (12 o'clock).
            // So final rotation = 360*spins + (270 - midAngleDeg).
            const finalRotation = (360 * spins) + (270 - midAngleDeg);
            const overshoot = 3; // small overshoot

            // Phase 1: go to final + overshoot
            gsap.to(element, {
                duration: duration - 3,
                rotation: finalRotation + overshoot,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Phase 2: bounce back to final
                    gsap.to(element, {
                        duration: 3,
                        rotation: finalRotation,
                        ease: 'bounce.out',
                        onComplete: () => {
                            if (onComplete) onComplete();
                            showWonPopup(wonInfo);
                        },
                    });
                },
            });
        }
    }

    // Start with the first wheel
    spinWheelSequentially(0);
}


// Attach to the window if needed
window.engagdSpinWheel = engagdSpinWheel;
