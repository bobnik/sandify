// used to scale the konva layer transformer
export const KONVA_SCALE = 4

// define Konva clip functions that will let us clip vertices not bound by
// machine limits when dragging, and produce a visually seamless experience.
export const layerClipFunc = (machine) => {
  const { minX, minY, maxX, maxY, maxRadius, rectangular } = machine

  if (rectangular) {
    const width = maxX - minX
    const height = maxY - minY

    return (ctx) => {
     ctx.rect(-width/2, -height/2, width, height)
    }
  } else {
    return (ctx) => {
     ctx.arc(0, 0, maxRadius, 0, Math.PI * 2, false)
    }
  }
}

export const relativeScale = (machine, canvasWidth, canvasHeight) => {
  const { minX, minY, maxX, maxY, maxRadius, rectangular } = machine
  let height, width

  if (rectangular) {
    width = maxX - minX
    height = maxY - minY
  } else {
    width = height = maxRadius * 2.0
  }

  return Math.min(canvasWidth / width, canvasHeight / height)
}

export const stageBounds = (machine) => {
  const { minX, minY, maxX, maxY, maxRadius, rectangular } = machine

  if (rectangular) {
    return { width: maxX - minX, height: maxY - minY }
  } else {
    return { width: maxRadius * 2, height: maxRadius * 2 }
  }
}
