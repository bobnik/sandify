import { getLayers, createDeepEqualSelector } from '../store/selectors'
import { createSelector } from 'reselect'
import { memoizeArrayProducingFn } from '../../common/selectors'
import { log } from '../../common/util'

const getCurrentLayerId = createSelector(
  getLayers,
  (layers) => layers.current
)

const getLayersById = createSelector(
  getLayers,
  (layers) => layers.byId
)

const getLayerIds = createSelector(
  getLayers,
  (layers) => layers.allIds
)

export const getVisibleLayerIds = createSelector(
  [ getLayerIds, getLayersById ],
  (layerIds, layers) => {
    return layerIds.filter(id => layers[id].visible)
  }
)

 export const getVisibleNonEffectIds = createSelector(
   [ getVisibleLayerIds, getLayersById ],
   (layerIds, layers) => {
     return layerIds.filter(id => !layers[id].effect)
   }
 )

export const getCurrentLayer = createSelector(
  [ getLayersById, getCurrentLayerId ],
  (layers, current) => {
    return layers[current]
  }
)

export const getAllLayersInfo = createSelector(
  [ getLayerIds, getLayersById ],
  (layerIds, layersById) => {
    log("getAllLayersInfo")
    return layerIds.map(id => layersById[id])
  }
)

export const getNumLayers = createSelector(
  getLayerIds,
  (layerIds) => {
    log("getNumLayer")
    return layerIds.length
  }
)

// puts the current layer last in the list to ensure it can be rotated; else
// the handle will not rotate
export const getKonvaLayerIds = createSelector(
  [ getCurrentLayer, getVisibleLayerIds ],
  (currentLayer, visibleLayerIds) => {
      log("getKonvaLayerIds")
      const kIds = visibleLayerIds.filter(id => id !== currentLayer.id)
      if (currentLayer.visible) {
        kIds.push(currentLayer.id)
      }
      return kIds
  }
)

export const isDragging = createSelector(
  [ getLayerIds, getLayersById ],
  (layerIds, layers) => {
    log("isDragging")
    return layerIds.filter(id => layers[id].visible && layers[id].dragging).length > 0
  }
)

export const getNumVisibleLayers = createDeepEqualSelector(
  getVisibleNonEffectIds,
  (layers) => {
    return layers.length
  }
)

export const makeGetLayerIndex = layerId => {
  return createDeepEqualSelector(
    getVisibleLayerIds,
    (visibleLayerIds) => {
      return visibleLayerIds.findIndex(id => id === layerId)
    }
  )
}

// if a layer is an non-effect layer, returns that layer. Else returns the root layer
// affected by the effect
export const makeGetRootLayer = layerId => {
  return createSelector(
    [
      getLayerIds,
      getLayersById
    ],
    (layerIds, layers) => {
      const layer = layers[layerId]

      if (layer.effect) {
        // find first non-effect previous layer if it exists
        let idx = layerIds.findIndex(id => id === layerId)

        while (idx >= 0) {
          const prev = layers[layerIds[idx]]
          if (!prev.effect) {
            return prev
          }
          idx -= 1
        }
      }

      return layer
    }
  )
}

export const makeGetNonEffectLayerIndex = layerId => {
  return createDeepEqualSelector(
    getVisibleNonEffectIds,
    (visibleLayerIds) => {
      return visibleLayerIds.findIndex(id => id === layerId)
    }
  )
}

export const makeGetLayer = layerId => {
  return createSelector(
    getLayersById,
    (layers) => {
      log("makeGetLayer", layerId)
      return layers[layerId]
    }
  )
}

// returns any effects tied to a given layer; memoizeArrayProducingFn will ensure we
// only recompute transformed vertices when an effect changes.
export const makeGetEffects = layerId => {
  return createSelector(
    [
      getLayersById,
      getVisibleLayerIds
    ],
    memoizeArrayProducingFn(
      (layers, visibleLayerIds) => {
        log("makeGetEffects", layerId)

        let index = visibleLayerIds.findIndex(id => id === layerId)
        const layer = layers[layerId]

        if (layer.effect || index === visibleLayerIds.length - 1) {
          return []
        } else {
          index = index + 1
          const effects = []
          let id = visibleLayerIds[index]

          while (id && layers[id].effect) {
            effects.push(layers[id])
            index = index + 1
            id = visibleLayerIds[index]
          }

          return effects
        }
      }
    )
  )
}
