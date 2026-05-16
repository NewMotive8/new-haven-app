/**
 * Preloads the images (if any) in a given segments array.
 * Attaches the loaded image to segment._loadedImage on success.
 */
function preloadSegmentImages(segments) {
  const segmentsWithImages = segments.filter((s) => s.bgImage);
  const imagePromises = segmentsWithImages.map((segment) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = segment.bgImage;
      img.onload = () => {
        segment._loadedImage = img; // store the loaded image
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load ${segment.bgImage}`);
        resolve();
      };
    });
  });
  return Promise.all(imagePromises);
}

/**
 * Creates and returns a centered container <div> that will hold the wheel (canvas).
 */
function createWheelContainer({ target, wheelContainerId, containerSize, mainlySize }) {
  const wheelContainer = document.createElement('div');
  wheelContainer.setAttribute('id', wheelContainerId);
  wheelContainer.style.position = 'relative';
  wheelContainer.style.width = `${containerSize}px`;
  wheelContainer.style.height = `${containerSize}px`;
  target.appendChild(wheelContainer);
  return wheelContainer;
}

/**
 * Creates a canvas sized to (wheelSize × wheelSize) and centers it inside wheelContainer.
 * Returns { canvas, context }.
 */
function createMainCanvas({ wheelContainer, wheelSize, wheelBorderWidth, wheelBorderColor, mainlySize }) {
  const canvas = document.createElement('canvas');
  canvas.width = wheelSize;
  canvas.height = wheelSize;
  canvas.style.border = `${wheelBorderWidth}px solid ${wheelBorderColor}`;
  canvas.style.borderRadius = '50%';
  canvas.style.position = 'absolute';
  canvas.style.left = '50%';
  canvas.style.top = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';
  canvas.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
  wheelContainer.appendChild(canvas);

  return {
    canvas,
    context: canvas.getContext('2d'),
  };
}

/**
 * Draws a single slice (segment) on the wheel canvas context.
 */
function drawSlice({ context, segments, index, anglePerSegment, radius, startAngles, mainlySize }) {
  const segment = segments[index];
  const startAngle = index * anglePerSegment;
  const endAngle = startAngle + anglePerSegment;
  const midAngle = startAngle + anglePerSegment / 2;
  startAngles.push(startAngle);

  context.save();
  context.beginPath();
  context.moveTo(radius, radius);
  context.arc(radius, radius, radius, startAngle, endAngle);
  context.closePath();
  context.clip();

  // Move to center and rotate so the "top" of the slice is outward
  context.translate(radius, radius);
  context.rotate(midAngle - Math.PI / 2);

  // Draw the background (image or gradient)
  if (segment._loadedImage) {
    const img = segment._loadedImage;
    const drawHeight = 2 * radius;
    const aspect = img.width / img.height;
    const drawWidth = drawHeight * aspect;
    context.drawImage(img, -drawWidth / 2, -radius, drawWidth, drawHeight);
  } else {
    const grad = context.createLinearGradient(0, -radius, 0, radius);
    const startColor = segment.startBgColor || '#fff';
    const endColor = segment.endBgColor || startColor;
    grad.addColorStop(0, startColor);
    grad.addColorStop(1, endColor);
    context.fillStyle = grad;
    context.fillRect(-radius, -radius, 2 * radius, 2 * radius);
  }

  context.restore();
}

/**
 * Draws a radial stripe at each segment's start angle,
 * matching the wheel's border width and color.
 */
function drawSegmentStripes({
  context,
  startAngles,
  radius,
  wheelBorderWidth,
  wheelBorderColor,
}) {
  startAngles.forEach((angle) => {
    context.save();
    context.beginPath();
    context.strokeStyle = wheelBorderColor;
    context.lineWidth = wheelBorderWidth;

    // Move from the center of the wheel:
    context.moveTo(radius, radius);

    // Out to the perimeter at the specific angle:
    const endX = radius + radius * Math.cos(angle);
    const endY = radius + radius * Math.sin(angle);
    context.lineTo(endX, endY);

    context.stroke();
    context.restore();
  });
}

/**
 * For the single-segment scenario, create a div containing either the icon or text
 * and place it in the center of the wheel.
 */
function addSingleSegmentContent({ wheelContainer, segment, wheelSize, containerSize, mainlySize }) {
  const segmentContentDiv = document.createElement('div');
  segmentContentDiv.style.position = 'absolute';
  segmentContentDiv.style.left = '50%';
  segmentContentDiv.style.top = '50%';
  segmentContentDiv.style.transform = 'translate(-50%, -50%)';

  if (segment.icon) {
    const img = document.createElement('img');
    img.src = segment.icon;
    img.style.width = `${wheelSize / 200}rem`;
    img.style.height = `${wheelSize / 200}rem`;
    if (segment.iconStyles) {
      Object.keys(segment.iconStyles).forEach((key) => {
        img.style[key] = segment.iconStyles[key];
      });
    }
    segmentContentDiv.appendChild(img);
  } else if (segment.text) {
    const textEl = document.createElement('span');
    textEl.textContent = segment.text;
    textEl.style.color = '#fff';
    textEl.style.fontWeight = 800;
    textEl.style.whiteSpace = 'nowrap';
    textEl.style.fontSize = `${mainlySize / 250}rem`;
    if (segment.textStyles) {
      Object.keys(segment.textStyles).forEach((key) => {
        textEl.style[key] = segment.textStyles[key];
      });
    }
    segmentContentDiv.appendChild(textEl);
  }
  if (segment.onClick) {
    segmentContentDiv.addEventListener('click', () => {
      segment.onClick();
    });
    segmentContentDiv.style.cursor = 'pointer';
  }
  wheelContainer.appendChild(segmentContentDiv);
}

/**
 * For multiple segments, create a div per segment, position it around the wheel,
 * and set icon or text accordingly.
 */
function addMultipleSegmentsContent({
  wheelContainer,
  segments,
  anglePerSegment,
  wheelSize,
  containerSize,
  radius,
  mainlySize,
}) {
  segments.forEach((segment, i) => {
    const midAngle = i * anglePerSegment + anglePerSegment / 2;
    const midAngleDeg = (midAngle * 180) / Math.PI;

    // Position for text/icons ~85% out from the center of the wheel (slight adjustments)
    const wheelProportion = wheelSize / mainlySize;
    const textRadius =
      radius *
      (wheelProportion > 0.8
        ? 0.86
        : wheelProportion > 0.5
          ? 0.8
          : 0.75);

    const textX = radius + textRadius * Math.cos(midAngle);
    const textY = radius + textRadius * Math.sin(midAngle);
    const rotation = midAngleDeg - 90;

    const segmentContentDiv = document.createElement('div');
    segmentContentDiv.style.position = 'absolute';

    // Offsets due to the wheel canvas being centered
    const offsetX = (containerSize - wheelSize) / 2;
    const offsetY = (containerSize - wheelSize) / 2;

    segmentContentDiv.style.left = `${offsetX + textX}px`;
    segmentContentDiv.style.top = `${offsetY + textY}px`;
    segmentContentDiv.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    segmentContentDiv.style.transformOrigin = 'center center';

    // onClick handler, if any
    if (segment.onClick) {
      segmentContentDiv.addEventListener('click', () => {
        segment.onClick();
      });
      segmentContentDiv.style.cursor = 'pointer';
    }

    // Icon or text
    if (segment.icon) {
      const img = document.createElement('img');
      img.src = segment.icon;
      img.style.width = `${mainlySize / 200}rem`;
      img.style.height = `${mainlySize / 200}rem`;
      if (segment.iconStyles) {
        Object.keys(segment.iconStyles).forEach((key) => {
          img.style[key] = segment.iconStyles[key];
        });
      }
      segmentContentDiv.appendChild(img);
    } else if (segment.text) {
      const textEl = document.createElement('span');
      textEl.textContent = segment.text;
      textEl.style.color = '#fff';
      textEl.style.fontWeight = 800;
      textEl.style.whiteSpace = 'nowrap';
      textEl.style.fontSize = `${mainlySize / 250}rem`;
      if (segment.textStyles) {
        Object.keys(segment.textStyles).forEach((key) => {
          textEl.style[key] = segment.textStyles[key];
        });
      }
      segmentContentDiv.appendChild(textEl);
    }

    wheelContainer.appendChild(segmentContentDiv);
  });
}

/**
 * Draws the boundary dots around the wheel, returning an array of the created dot elements.
 */
function drawBoundaryDots({
  wheelContainer,
  renderDot,
  dotSizeProps,
  containerSize,
  wheelSize,
  startAngles,
  dotColor,
  dotShadowColor,
  radius,
  mainlySize,
  dotClassPrefix, // new prop for optional class prefix
}) {
  if (!renderDot) return [];

  const dotSize = dotSizeProps ? (mainlySize / dotSizeProps) : (mainlySize / 50);
  const centerX = radius;
  const centerY = radius;
  const dotClass = dotClassPrefix ? `${dotClassPrefix}-dot` : 'dot';

  const dotElements = [];

  startAngles.forEach((angle) => {
    const cx = centerX + radius * Math.cos(angle);
    const cy = centerY + radius * Math.sin(angle);

    const dotEl = document.createElement('div');
    dotEl.style.position = 'absolute';
    dotEl.style.width = `${dotSize}px`;
    dotEl.style.height = `${dotSize}px`;
    dotEl.style.borderRadius = '50%';
    dotEl.style.backgroundColor = dotColor;
    dotEl.style.boxShadow = `0 0 8px ${dotShadowColor}`;
    dotEl.classList.add(dotClass); // add the (prefix-)dot class

    // Offset due to wheel canvas being centered
    const offsetX = (containerSize - wheelSize) / 2;
    const offsetY = (containerSize - wheelSize) / 2;

    dotEl.style.left = `${offsetX + cx - dotSize / 2}px`;
    dotEl.style.top = `${offsetY + cy - dotSize / 2}px`;

    wheelContainer.appendChild(dotEl);
    dotElements.push(dotEl);
  });

  return dotElements;
}

/**
 * Main function: renderWheel
 * Creates a single wheel with multiple segments, optional images, text/icons, and boundary dots.
 *
 * Now returns a Promise that resolves with { wheelContainerId, segments: [...], dots: [...] }.
 * Each segment also includes its start/end angles in degrees.
 */
function renderWheel({
  target,
  wheelContainerId = 'wheel-container',
  containerSize = 500,
  wheelFraction = 0.9,
  wheelBorderColor = '#fff',
  wheelBorderWidth = 4,
  renderStripes = true,
  renderDot = true,
  dotColor = '#fff',
  dotShadowColor = 'rgba(0, 0, 0, 0.8)',
  dotSize: dotSizeProps,
  dotClassPrefix = '', // <--- new prop for optional class prefix
  segments = [],
  mainlySize,
}) {
  return new Promise((resolve) => {
    // 1) Create outer container
    const wheelContainer = createWheelContainer({
      target,
      wheelContainerId,
      containerSize,
      mainlySize,
    });

    // 2) Compute wheel size & create canvas
    const wheelSize = containerSize * wheelFraction;
    const radius = wheelSize / 2;
    const { context } = createMainCanvas({
      wheelContainer,
      wheelSize,
      wheelBorderWidth,
      wheelBorderColor,
      mainlySize,
    });

    // 3) Preload any background images
    const startAngles = [];
    preloadSegmentImages(segments).then(() => {
      const numberOfSegments = segments.length || 1;
      const anglePerSegment = (2 * Math.PI) / numberOfSegments;

      // We'll build an array of segment data for returning
      const segmentsData = [];

      // Draw each slice
      for (let i = 0; i < segments.length; i++) {
        drawSlice({
          context,
          segments,
          index: i,
          anglePerSegment,
          radius,
          startAngles,
          mainlySize,
        });

        // Calculate start/end angles in degrees for the segment
        const sAngle = i * anglePerSegment;
        const eAngle = sAngle + anglePerSegment;
        const startAngleDeg = (sAngle * 180) / Math.PI;
        const endAngleDeg = (eAngle * 180) / Math.PI;

        // Push a new object with segment info + angles
        segmentsData.push({
          ...segments[i],
          startAngleDeg,
          endAngleDeg,
        });
      }

      // 4) Add text/icons
      if (segments.length === 1) {
        addSingleSegmentContent({
          wheelContainer,
          segment: segments[0],
          wheelSize,
          containerSize,
          mainlySize,
        });
      } else {
        addMultipleSegmentsContent({
          wheelContainer,
          segments,
          anglePerSegment,
          wheelSize,
          containerSize,
          radius,
          mainlySize,
        });
        if (renderStripes) {
          drawSegmentStripes({
            context,
            startAngles,
            radius,
            wheelBorderWidth,
            wheelBorderColor,
          });
        }
      }

      // 5) Draw boundary dots (returns array of dot elements)
      const dotElements = drawBoundaryDots({
        wheelContainer,
        renderDot,
        dotSizeProps,
        containerSize,
        wheelSize,
        startAngles,
        dotColor,
        dotShadowColor,
        radius,
        mainlySize,
        dotClassPrefix,
      });

      // Finally, resolve with the data needed
      resolve({
        wheelContainerId,
        segments: segmentsData,
        dots: dotElements,
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/*                           renderWheelMultiTier                             */
/* -------------------------------------------------------------------------- */

/**
 * Helper to create a "ticker" (the pointer) SVG at the top of the container.
 * Returns the ticker's container element (so you can reference it).
 */
function createTicker({ target, wheelSize, colors, tickerSize, tickerShadow, tickerClassPrefix }) {
  const width = wheelSize / (tickerSize || 1);
  const height = Math.round(width * 0.9);

  const tickerContainer = document.createElement('div');
  tickerContainer.style.position = 'absolute';
  tickerContainer.style.left = '50%';
  tickerContainer.style.top = '0px';
  tickerContainer.style.zIndex = 999;
  tickerContainer.style.transform = 'translate(-50%, 0)';
  tickerContainer.setAttribute('class', tickerClassPrefix)

  tickerContainer.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 269 243" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M168.275 223.5c-15.011 26-52.539 26-67.55 0L5.895 59.25C-9.115 33.25 9.648.75 39.67.75h189.66c30.022 0 48.786 32.5 33.775 58.5l-94.83 164.25Z"
        fill="url(#a)"
      />
      <defs>
        <linearGradient id="a" x1="-53" y1="95" x2="322" y2="95" gradientUnits="userSpaceOnUse">
          <stop stop-color="${colors.start}" />
          <stop offset="1" stop-color="${colors.end}" />
        </linearGradient>
      </defs>
    </svg>
  `;
  target.appendChild(tickerContainer);
  return tickerContainer;
}

function groupSegmentsByTier(segments) {
  const grouped = segments.reduce((grouped, segment) => {
    if (!grouped[segment.tier]) {
      grouped[segment.tier] = [];
    }
    grouped[segment.tier].push(segment);
    return grouped;
  }, {});
  return Object.keys(grouped)
    .map(tier => (grouped[tier]))
    .sort((a, b) => a.tier - b.tier);

}

/**
 * Renders multiple wheels (tiers) in a single container, each nested and scaled down.
 * Returns a Promise that resolves to an object: { wheels: [...], ticker: <element|null> }.
 *    wheels[i] => { wheelContainerId, segments: [...], dots: [...] }
 */
function renderWheelMultiTier(props) {
  const {
    target,
    containerSize = 500,
    wheelSegments = [],
    tierScale: tierScaleP,
    dot: dotProps,
    borderColor = '#FFFFFF',
    borderWidth = 4,
    renderStripes = [true, true, true, true, true, true, true, true, true],
    ticker: tickerProps,
  } = props;

  const {
    color: dotColor = '#FFFFFF',
    shadow: dotShadow = '#000000',
    size: dotSize = null,
    classPrefix: dotClassPrefix = '',
    render: dotRender = [true, false, false, false, false, false],
  } = dotProps

  const {
    color: tickerColor = '#FFFFFF',
    shadow: tickerShadow = '#000000',
    size: tickerSize = 1,
    classPrefix: tickerClassPrefix,
    render: renderTicker = true,
  } = tickerProps



  const tierScale = tierScaleP && typeof tierScaleP === 'string' ? JSON.parse(tierScaleP) : [0.9, 0.65, 0.4, 0.2]

  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) {
    console.error('Invalid target for renderWheelMultiTier');
    return Promise.resolve({ wheels: [], ticker: null });
  }
  container.innerHTML = ''

  container.style.position = 'relative';
  container.style.width = `${containerSize}px`;
  container.style.height = `${containerSize}px`;

  // "tiers" is expected to be an array-of-arrays
  const tiers = groupSegmentsByTier(wheelSegments) || [];

  // We build an array of Promises (one for each tier's wheel)
  const wheelPromises = tiers.map((segments, i) => {
    const containerSize_ = i ? containerSize * (tierScale[i] || 0.25) : containerSize;

    const tierTarget = document.createElement('div');
    tierTarget.style.position = 'absolute';
    tierTarget.style.top = '50%';
    tierTarget.style.left = '50%';
    tierTarget.style.transform = 'translate(-50%, -50%)';
    tierTarget.style.width = `${containerSize_}px`;
    tierTarget.style.height = `${containerSize_}px`;
    tierTarget.style.zIndex = i + 1;
    container.appendChild(tierTarget);

    // Render each tier as a separate wheel
    return renderWheel({
      target: tierTarget,
      wheelContainerId: `wheel-${i + 1}`,
      containerSize: containerSize_,
      wheelFraction: i ? 0.9 : tierScale[i],
      wheelBorderColor: borderColor,
      wheelBorderWidth: borderWidth,
      renderStripes: renderStripes && typeof renderStripes === 'string' ? JSON.parse(renderStripes)[i] : renderStripes[i],
      renderDot: dotRender && typeof dotRender === 'string' ? JSON.parse(dotRender)[i] : dotRender[i],
      dotColor,
      dotShadowColor: dotShadow,
      dotSize: dotSize,
      dotClassPrefix,
      segments,
      mainlySize: containerSize,
    });
  });

  // Return a Promise that resolves once all tiers are rendered
  return Promise.all(wheelPromises).then((wheelsData) => {
    let tickerEl = null;
    function checkRenderTicker() {
      if (renderTicker) {
        if (typeof renderTicker === 'boolean' && renderTicker === true) {
          return true;
        } else if (typeof renderTicker === 'string' && renderTicker === 'true') {
          return true;
        }
      }
      return false;
    }

    if (checkRenderTicker()) {
      tickerEl = createTicker({
        target: container,
        wheelSize: containerSize,
        colors: { start: tickerColor, end: tickerColor },
        tickerSize,
        tickerShadow,
        tickerClassPrefix,
      });
    }

    return {
      wheels: wheelsData,
      ticker: tickerEl,
    };
  });
}
