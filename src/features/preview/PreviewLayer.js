import React from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import { Shape, Transformer } from 'react-konva'
import { makeGetPreviewTrackVertices, makeGetPreviewVertices, getSliderColors,
  getVertexOffsets, getAllComputedVertices, getSliderBounds } from '../machine/selectors'
import { updateLayer } from '../layers/layersSlice'
import { getLayers, getPreview, getMachine } from '../store/selectors'
import { getCurrentLayer, makeGetLayerIndex, makeGetLayer, makeGetRootLayer, getNumVisibleLayers } from '../layers/selectors'
import { getCachedSelector } from '../store/selectors'
import { roundP } from '../../common/util'
import { layerClipFunc, KONVA_SCALE, stageBounds } from '../../common/konva'
import PreviewHelper from './PreviewHelper'

// Renders the shapes in the preview window and allows the user to interact with the shape.
const PreviewLayer = (ownProps) => {
  const mapStateToProps = (state) => {
    // if a layer matching this shape's id does not exist, we have a zombie
    // child. It has to do with a child (preview shape) subscribing to the store
    // before its parent (preview window), and trying to render first after a
    // layer is removed. This is a tangled, but well-known problem with React-Redux
    // hooks, and the solution for now is to render the current layer instead.
    // https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
    // It's quite likely there is a more elegant/proper way around this.
    const layers = getLayers(state)
    const layer = getCachedSelector(makeGetLayer, ownProps.id)(state) || getCurrentLayer(state)
    const rootLayer = getCachedSelector(makeGetRootLayer, ownProps.id)(state)
    const index = getCachedSelector(makeGetLayerIndex, layer.id)(state)
    const numLayers = getNumVisibleLayers(state)
    const preview = getPreview(state)
    const machine = getMachine(state)

    return {
      layer: layer,
      rootLayer: rootLayer,
      start: index === 0,
      end: index === numLayers - 1,
      currentLayer: getCurrentLayer(state),
      trackVertices: getCachedSelector(makeGetPreviewTrackVertices, layer.id)(state),
      vertices: getCachedSelector(makeGetPreviewVertices, layer.id)(state),
      allVertices: getAllComputedVertices(state),
      selected: layers.selected,
      sliderValue: preview.sliderValue,
      showTrack: true,
      colors: getSliderColors(state),
      offsets: getVertexOffsets(state),
      offsetId: layer.id,
      bounds: getSliderBounds(state),
      markCoordinates: false, // debug feature: set to true to see coordinates while drawing
      use_rect: machine.rectangular,
      machine: machine,
      canvasWidth: preview.canvasWidth,
      canvasHeight: preview.canvasHeight
    }
  }

  const props = useSelector(mapStateToProps, shallowEqual)
  const {
    machine, layer, selected, sliderValue, vertices, offsets, colors, start, end, trackVertices,
    bounds, currentLayer, rootLayer
  } = props
  const dispatch = useDispatch()
  const startingWidth = layer.startingWidth
  const startingHeight = layer.startingHeight

  const rootOffsetX = rootLayer ? rootLayer.offsetX : 0
  const rootOffsetY = rootLayer ? -rootLayer.offsetY : 0
  const offsetX = layer.offsetX + rootOffsetX
  const offsetY = -layer.offsetY + rootOffsetY

  const rootRotation = rootLayer ? rootLayer.rotation : 0
  const rotation = (layer.rotation || 0) + rootRotation

  const selectedColor = 'yellow'
  const unselectedColor = 'rgba(195, 214, 230, 0.65)'
  const backgroundSelectedColor = '#6E6E00'
  const backgroundUnselectedColor = 'rgba(195, 214, 230, 0.4)'

  // our transformer is bigger than the actual starting shape, so we need
  // to account for it when drawing the preview; if you change this value, be sure
  // to change it in machine/selectors#getPreviewVertices,getPreviewTrackVertices
  const konvaScale = layer.autosize ? KONVA_SCALE : 1
  const konvaSizeX = startingWidth * konvaScale
  const konvaSizeY = startingHeight * konvaScale
  const isSelected = selected === ownProps.id
  const isSliding = sliderValue !== 0
  const helper = new PreviewHelper(props)

  // draws a colored path when user is using slider
  function drawLayerVertices(context, bounds) {
    const { end } = bounds
    let oldColor = null
    let currentColor = isSelected ? selectedColor : unselectedColor

    context.beginPath()
    context.lineWidth = 1
    context.strokeStyle = currentColor
    helper.moveTo(context, vertices[0])
    context.stroke()

    context.beginPath()
    for (let i=1; i<vertices.length; i++) {
      if (isSliding) {
        let absoluteI = i + offsets[layer.id].start
        let pathColor = absoluteI <= end ? backgroundSelectedColor : backgroundUnselectedColor

        currentColor = colors[absoluteI] || pathColor
        if (currentColor !== oldColor) {
          context.stroke()
          context.strokeStyle = currentColor
          oldColor = currentColor
          context.beginPath()
        }
      }

      helper.moveTo(context, vertices[i-1])
      helper.lineTo(context, vertices[i])
    }
    context.stroke()
  }

  function drawStartAndEndPoints(context) {
    const start = vertices[0]
    const end = vertices[vertices.length - 1]

    context.beginPath()
    context.strokeStyle = 'green'
    helper.dot(context, start, start ? 5 : 3)
    helper.markOriginalCoordinates(context, start)

    if (end) {
      context.beginPath()
      context.strokeStyle = 'red'
      helper.dot(context, end, end ? 5 : 3)
      helper.markOriginalCoordinates(context, end)
    }
  }

  // draws the line representing the track the path follows
  function drawTrackVertices(context) {
    context.beginPath()
    context.lineWidth = 4.0
    context.strokeStyle = 'green'
    helper.moveTo(context, trackVertices[0])
    for (let i=0; i<trackVertices.length; i++) {
      helper.lineTo(context, trackVertices[i])
    }
    context.stroke()
  }

  // used by Konva to draw our custom shape
  function sceneFunc(context, shape) {
    if (vertices && vertices.length > 0) {
      if (trackVertices && trackVertices.length > 0) {
        drawTrackVertices(context)
      }

      drawLayerVertices(context, bounds)

      if (start || end || isSelected) {
        drawStartAndEndPoints(context)
      }
      helper.drawSliderEndPoint(context)
    }

    context.fillStrokeShape(shape)
  }

  // used by Konva for hit detection (and dragging); in our case, we want the entire stage
  // to be draggable, so we have to reverse translate/rotate our shape to get stage
  // bounds.
  function hitFunc(context) {
    const { width, height } = stageBounds(machine)

    context.translate(konvaSizeX/2, konvaSizeY/2)
    context.rotate(-layer.rotation*Math.PI/180)
    context.rect(-width/2 - layer.offsetX, -height/2 + layer.offsetY, width, height)
    context.fillStrokeShape(this)
  }

  function onChange(attrs) {
    attrs.id = layer.id
    dispatch(updateLayer(attrs))
  }

  function onSelect() {
    // deselection is currently disabled
    // dispatch(setSelectedLayer(selected == null ? currentLayer.id : null))
  }

  const shapeRef = React.createRef()
  const trRef = React.createRef()

  React.useEffect(() => {
    if (layer.visible && isSelected && layer.canChangeSize) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected, layer, currentLayer.canMove, shapeRef, trRef])

  return (
    <React.Fragment>
      {layer.visible && <Shape
        clipFunc={layerClipFunc(machine)}
        draggable={currentLayer.canMove && layer.id === currentLayer.id}
        width={konvaSizeX}
        height={konvaSizeY}
        offsetY={konvaSizeY/2}
        offsetX={konvaSizeX/2}
        x={offsetX}
        y={offsetY}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...props}
        strokeWidth={1}
        rotation={rotation}
        sceneFunc={sceneFunc}
        hitFunc={hitFunc}
        onDragStart={e => {
          onChange({dragging: true})
        }}
        onDragEnd={e => {
          onChange({
            dragging: false,
            offsetX: roundP(e.target.x(), 0) - rootOffsetX,
            offsetY: roundP(-e.target.y(), 0) + rootOffsetY
          })
        }}
        onTransformStart={e => {
          onChange({dragging: true})
        }}
        onTransformEnd={e => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          // we will reset it back
          node.scaleX(1)
          node.scaleY(1)

          onChange({
            dragging: false,
            startingWidth: roundP(Math.max(5, layer.startingWidth * scaleX), 0),
            startingHeight: roundP(Math.max(5, layer.startingHeight * scaleY), 0),
            rotation: roundP(node.rotation(), 0)
          })
        }}
      />}
      {layer.visible && isSelected && layer.canChangeSize && (
        <Transformer
          ref={trRef}
          centeredScaling={true}
          resizeEnabled={!layer.trackEnabled}
          rotateEnabled={layer.canRotate}
          rotationSnaps={[0, 90, 180, 270]}
          enabledAnchors={!layer.canChangeHeight ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : null }
        />
      )}
    </React.Fragment>
  )
}

export default PreviewLayer
