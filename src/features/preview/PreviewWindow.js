import React, { Component } from 'react'
import { connect, ReactReduxContext, Provider } from 'react-redux'
import { Stage, Layer, Circle, Rect } from 'react-konva'
import throttle from 'lodash/throttle'
import { setPreviewSize, updatePreview } from './previewSlice'
import { updateLayer } from '../layers/layersSlice'
import { getMachine, getLayers, getPreview } from '../store/selectors'
import { getCurrentLayer, getKonvaLayerIds, getVisibleNonEffectIds, isDragging } from '../layers/selectors'
import { roundP } from '../../common/util'
import { relativeScale, stageBounds } from '../../common/konva'
import PreviewLayer from './PreviewLayer'
import PreviewConnector from './PreviewConnector'

const mapStateToProps = (state, ownProps) => {
  const layers = getLayers(state)
  const preview = getPreview(state)
  const machine = getMachine(state)

  return {
    layers: layers,
    currentLayer: getCurrentLayer(state),
    konvaIds: getKonvaLayerIds(state),
    layerIds: getVisibleNonEffectIds(state),
    dragging: isDragging(state),
    machine: machine,
    canvasWidth: preview.canvasWidth,
    canvasHeight: preview.canvasHeight
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onResize: (size) => {
      dispatch(setPreviewSize(size))
    },
    onChange: (attrs) => {
      dispatch(updatePreview(attrs))
    },
    onLayerChange: (attrs) => {
      dispatch(updateLayer(attrs))
    }
  }
}

// Contains the preview window, and any parameters for the machine.
class PreviewWindow extends Component {
  componentDidMount() {
    const wrapper = document.getElementById('preview-wrapper')

    this.throttledResize = throttle(this.resize, 200, {trailing: true}).bind(this)
    window.addEventListener('resize', () => { this.throttledResize(wrapper) }, false)
    setTimeout(() => {
      this.visible = true
      this.resize(wrapper)
    }, 250)
  }

  resize(wrapper) {
    const width = parseInt(getComputedStyle(wrapper).getPropertyValue('width'))
    const height = parseInt(getComputedStyle(wrapper).getPropertyValue('height'))

    if (this.props.canvasWidth !== width || this.props.canvasHeight !== height) {
      this.props.onResize({width: width, height: height})
    }
  }

  render() {
    const { machine, canvasWidth, canvasHeight, konvaIds,
      layerIds, currentLayer } = this.props
    const scale = relativeScale(machine, canvasWidth, canvasHeight)
    const { width, height } = stageBounds(machine)
    const visibilityClass = `preview-wrapper ${this.visible ? 'd-flex align-items-center' : 'd-none'}`

    return (
      // the consumer wrapper is needed to pass the store down to our shape
      // which is not our usual React Component
      <ReactReduxContext.Consumer>
        {({store}) => (
          <Stage className={visibilityClass}
            scaleX={scale}
            scaleY={scale}
            height={height * scale}
            width={width * scale}
            offsetX={-width/2}
            offsetY={-height/2}
            onWheel={e => {
              e.evt.preventDefault()
              if (Math.abs(e.evt.deltaY) > 0) {
                this.props.onLayerChange({
                  startingWidth: this.scaleByWheel(currentLayer.startingWidth, e.evt.deltaY),
                  startingHeight: this.scaleByWheel(currentLayer.startingHeight, e.evt.deltaY),
                  id: currentLayer.id
                })
              }
            }}
            >
            <Provider store={store}>
              <Layer>
                {!machine.rectangular && <Circle x={0} y={0} radius={width / 2}
                  fill="transparent"
                  stroke="gray"
                />}
                {machine.rectangular && <Rect x={0} y={0} width={width} height={height}
                  fill="transparent"
                  stroke="gray"
                  offsetX={width/2}
                  offsetY={height/2}
                />}
                {konvaIds.map((id, i) => {
                  const idx = layerIds.findIndex(layerId => layerId === id)
                  const nextId = idx !== -1 && idx < layerIds.length - 1 ? layerIds[idx + 1] : null
                  return (
                    [
                      nextId && <PreviewConnector startId={id} endId={nextId} key={'c-' + i} />,
                      <PreviewLayer id={id} key={i} index={i} />
                    ].filter(e => e !== null)
                  )
                }).flat()}
              </Layer>
            </Provider>
          </Stage>
        )}
      </ReactReduxContext.Consumer>
    )
  }

  scaleByWheel(size, deltaY) {
    const sign = Math.sign(deltaY)
    const scale = 1 + Math.log(Math.abs(deltaY))/30 * sign
    let newSize = Math.max(roundP(size * scale, 0), 1)

    if (newSize === size) {
      // If the log scaled value isn't big enough to move the scale.
      newSize = Math.max(sign+size, 1)
    }

    return newSize
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(PreviewWindow)
