import { getLayers, createDeepEqualSelector } from '../store/selectors'
import { createSelector } from 'reselect'
import { memoizeArrayProducingFn } from '../../common/selectors'
import { log } from '../../common/util'

function getAllLayerIds(layerIds, layersById) {
  return layerIds.map(layerId => {
    const layer = layersById[layerId]
    return [layer.id, (layer.effectIds || [])].flat()
  }).flat()
}

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

export const getCurrentLayer = createSelector(
  [ getLayersById, getCurrentLayerId ],
  (layers, current) => {
    return layers[current]
  }
)

export const getAllLayersInfo = createSelector(
  [ getLayersById, getLayerIds ],
  (layersById, layerIds) => {
    log("getAllLayersInfo")

    return layerIds.map(layerId => {
      const layer = { ...layersById[layerId] }
      layer.effects = layer.effectIds && layer.effectIds.map(effectId => {
        return layersById[effectId]
      })
      return layer
    })
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
  [ getCurrentLayer, getVisibleLayerIds, getLayersById ],
  (currentLayer, visibleLayerIds, layersById) => {
      log("getKonvaLayerIds")
      const allLayerIds = getAllLayerIds(visibleLayerIds, layersById)
      const kIds = allLayerIds.filter(id => id !== currentLayer.id)

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
  getVisibleLayerIds,
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

export const makeGetRootLayer = layerId => {
  return createSelector(
    [
      getLayersById
    ],
    (layers) => {
      const layer = layers[layerId]
      return (layer && layer.effect) ? layers[layer.parentId] : layer
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
        const layer = layers[layerId]
        const effects = []

        if (layer.effectIds) {
          layer.effectIds.forEach(effectId => {
            const effect = layers[effectId]
            if (effect && effect.visible) effects.push({...effect})
          })

          const draggedIndex = layer.dragging ? 0 : effects.findIndex(effect => effect.dragging)
          effects.forEach((effect, index) => {
            effect.siblingDragging = draggedIndex != -1 && draggedIndex < effect
          })
        }

        return effects
      }
    )
  )
}

export const makeGetParentLayer = layerId => {
  return createSelector(
    [
      getLayersById
    ],
    (layers) => {
      log("makeGetParentLayer", layerId)
      const layer = layers[layerId]
      return layers[layer.parentId]
    }
  )
}
