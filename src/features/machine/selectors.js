import LRUCache from 'lru-cache'
import { createSelector } from 'reselect'
import Victor from 'victor'
import Color from 'color'
import {
  transformShapes,
  transformShape,
  polishVertices,
  getMachineInstance
} from './computer'
import { getShape } from '../../models/shapes'
import { getLayersById, makeGetLayer, makeGetLayerIndex, getNumVisibleLayers, getVisibleLayerIds, makeGetNextLayerId, makeGetEffects } from '../layers/selectors'
import { rotate, offset, getSliderBounds } from '../../common/geometry'

const cache = new LRUCache({
  length: (n, key) => { return n.length },
  max: 500000
})

const getCacheKey = (state) => {
  return JSON.stringify(state)
}

const getState = state => state
const getMachine = state => state.machine
const getPreview = state => state.preview

// the make selector functions below are patterned after the comment here:
// https://github.com/reduxjs/reselect/issues/74#issuecomment-472442728
const cachedSelectors = {}

// by returning null for shapes which don't use machine settings, this selector will ensure
// transformed vertices are not redrawn when machine settings change
const makeGetLayerMachine = layerId => {
  return createSelector(
    [ getLayersById, getMachine ],
    (layers, machine) => {
      const layer = layers[layerId]
      return layer.usesMachine ? machine : null
    }
  )
}

// creates a selector that returns shape vertices for a given layer
const makeGetLayerVertices = layerId => {
  return createSelector(
    [
      getCachedSelector(makeGetLayer, layerId),
      getCachedSelector(makeGetLayerMachine, layerId)
    ],
    (layer, machine) => {
      const state = {
        shape: layer,
        machine: machine
      }
      const metashape = getShape(layer)
      if (layer.shouldCache) {
        const key = getCacheKey(state)
        let vertices = cache.get(key)

        if (!vertices) {
          vertices = metashape.getVertices(state)
          cache.set(key, vertices)
          // for debugging purposes
          // console.log('caching shape...' + cache.length + ' ' + cache.itemCount)
        }

        return vertices
      } else {
        if (!state.shape.dragging && state.shape.effect) {
          return []
        } else {
          return metashape.getVertices(state)
        }
      }
    }
  )
}

// creates a selector that returns transformed vertices for a given layer
const makeGetTransformedVertices = layerId => {
  return createSelector(
    [
      getCachedSelector(makeGetLayerVertices, layerId),
      getCachedSelector(makeGetLayer, layerId),
      getCachedSelector(makeGetEffects, layerId)
    ],
    (vertices, layer, effects) => {
      return transformShapes(vertices, layer, effects)
    }
  )
}

// creates a selector that returns computed (machine-bound) vertices for a given layer
const makeGetComputedVertices = layerId => {
  return createSelector(
    [
      getCachedSelector(makeGetTransformedVertices, layerId),
      getCachedSelector(makeGetLayerIndex, layerId),
      getCachedSelector(makeGetNextLayerId, layerId),
      getNumVisibleLayers,
      getLayersById,
      getMachine
    ],
    (vertices, layerIndex, nextLayerId, numLayers, layers, machine) => {
      const state = { layers: layers, machine: machine }
      let nextLayer

      console.log('computed vertices for layer' + layerId)
      if (layerIndex < numLayers - 1) {
        nextLayer = nextLayerId && layers[nextLayerId]

        if (nextLayer && !nextLayer.dragging) {
          const nextVertices = getCachedSelector(makeGetComputedVertices, nextLayerId)(state)

          if (nextVertices[0]) {
            const layer = layers[layerId]
            if (layer.connectionMethod === 'along perimeter') {
              const start = vertices[vertices.length - 1]
              const end = nextVertices[0]
              const machineInstance = getMachineInstance([], machine)
              const startPerimeter = machineInstance.nearestPerimeterVertex(start)
              const endPerimeter = machineInstance.nearestPerimeterVertex(end)
              vertices = vertices.concat([startPerimeter, machineInstance.tracePerimeter(startPerimeter, endPerimeter), endPerimeter, end].flat())
            } else {
              vertices = vertices.concat(nextVertices[0])
            }
          }
        }
      }

      return polishVertices(vertices, machine, {
        start: layerIndex === 0,
        end: layerIndex === numLayers - 1
      })
    }
  )
}

// creates a selector that returns previewable vertices for a given layer
export const makeGetPreviewVertices = layerId => {
  return createSelector(
    [
        getLayersById,
        getMachine,
        getCachedSelector(makeGetTransformedVertices, layerId),
        getCachedSelector(makeGetComputedVertices, layerId)
    ],
    (layers, machine, transformedVertices, computedVertices) => {
      const layer = layers[layerId]
      const vertices = layer.dragging ? transformedVertices : computedVertices
      const konvaScale = layer.autosize ? 5 : 1 // our transformer is 5 times bigger than the actual starting shape
      const konvaDeltaX = (konvaScale - 1)/2 * layer.startingWidth
      const konvaDeltaY = (konvaScale - 1)/2 * layer.startingHeight

      return vertices.map(vertex => {
        return offset(rotate(offset(vertex, -layer.offsetX, -layer.offsetY), layer.rotation), konvaDeltaX, -konvaDeltaY)
      })
    }
  )
}

// ensures we only create a single selector for a given layer
export const getCachedSelector = (fn, layerId) => {
  if (!cachedSelectors[fn.name]) {
    cachedSelectors[fn.name] = {}
  }

  if (!cachedSelectors[fn.name][layerId]) {
    cachedSelectors[fn.name][layerId] = fn(layerId)
  }

  return cachedSelectors[fn.name][layerId]
}

// returns a flattened list of all visible computed vertices (across layers)
export const getAllComputedVertices = createSelector(
  [getState, getVisibleLayerIds],
  (state, visibleLayerIds) => {
    return visibleLayerIds.map(id => getCachedSelector(makeGetComputedVertices, id)(state)).flat()
  }
)

// returns a flattened list of all visible preview vertices (across layers)
export const getAllPreviewVertices = createSelector(
  [getState, getVisibleLayerIds],
  (state, visibleLayerIds) => {
    return visibleLayerIds.map(id => getCachedSelector(makeGetPreviewVertices, id)(state)).flat()
  }
)

// returns the starting offset for each layer, given previous layers
export const getVertexOffsets = createSelector(
  [getState, getVisibleLayerIds],
  (state, visibleLayerIds) => {
    let offsets = {}
    let offset = 0

    visibleLayerIds.forEach((id) => {
      const vertices = getCachedSelector(makeGetComputedVertices, id)(state)
      offsets[id] = offset
      offset += vertices.length + 1
    })
    return offsets
  }
)

// returns statistics across all layers
export const getVerticesStats = createSelector(
  getAllComputedVertices,
  (vertices) => {
    let distance = 0.0
    let previous = null

    vertices.forEach((vertex) => {
      if (previous) {
        distance += Math.sqrt(Math.pow(vertex.x - previous.x, 2.0) +
                              Math.pow(vertex.y - previous.y, 2.0))
      }
      previous = vertex
    })

    return {
      numPoints: vertices.length,
      distance: Math.floor(distance)
    }
  }
)

// returns a hash of { index => color } that specifies the gradient color of the
// line drawn at each index.
export const getSliderColors = layerId => {
  return createSelector(
    [
      getAllPreviewVertices,
      getPreview,
      getCachedSelector(makeGetPreviewVertices, layerId),
      getVertexOffsets
    ],
    (vertices, preview, layerVertices, offsets) => {
      const sliderValue = preview.sliderValue
      const colors = {}
      let start, end

      if (sliderValue > 0) {
        const bounds = getSliderBounds(vertices, sliderValue)
        start = bounds.start
        end = bounds.end
      } else {
        start = offsets[layerId]
        end = start + layerVertices.length
      }

      let startColor = Color('yellow')
      const colorStep = 3.0 / 8 / (end - start)

      for(let i=end; i>=start; i--) {
        colors[i] = startColor.darken(colorStep * (end-i)).hex()
      }

      return colors
    }
  )
}

// used by the preview window; reverses rotation and offsets because they are
// re-added by Konva transformer.
export const makeGetPreviewTrackVertices = layerId => {
  return createSelector(
    getLayersById,
    (layers) => {
      const layer = layers[layerId]
      const numLoops = layer.numLoops
      const konvaScale = layer.autosize ? 5 : 1 // our transformer is 5 times bigger than the actual starting shape
      const konvaDeltaX = (konvaScale - 1)/2 * layer.startingWidth
      const konvaDeltaY = (konvaScale - 1)/2 * layer.startingHeight
      let trackVertices = []

      for (var i=0; i<numLoops; i++) {
        if (layer.trackEnabled) {
          trackVertices.push(transformShape(layer, new Victor(0.0, 0.0), i, i))
        }
      }

      return trackVertices.map(vertex => {
        return offset(rotate(offset(vertex, -layer.offsetX, -layer.offsetY), layer.rotation), konvaDeltaX, -konvaDeltaY)
      })
    }
  )
}
