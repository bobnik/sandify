import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { Button, ListGroup } from 'react-bootstrap'
import { FaEye, FaEyeSlash, FaChevronRight, FaChevronDown, FaLock, FaUnlock } from 'react-icons/fa'

import SortableEffects from './SortableEffects'

const SortableLayer = SortableElement((
  {
    active,
    numLayers,
    currentLayer,
    layer,
    onLayerSelected,
    onEffectMoved,
    onSortStarted,
    onToggleLayerOpen,
    onToggleLayerVisible,
    onToggleLayerLocked
  }) => {
    const { name, id, visible, open, locked } = layer
    const activeClass = active ? 'active' : ''
    const dragClass = numLayers > 1 ? 'cursor-move' : ''
    const visibleClass = visible ? '' : 'layer-hidden'
    const hasEffects = layer.effects && layer.effects.length > 0

    return <ListGroup.Item
      className={[activeClass, dragClass,  visibleClass, 'layer p-0'].join(' ')}
      key={id}
      id={id}
    >
      <div
        className={[`layer-${activeClass}`, 'd-flex align-items-center'].join(' ')}
        onClick={onLayerSelected}
      >
        <div className="layer-left">
          <Button
            className="layer-button"
            variant="link"
            data-id={id}
            onClick={onToggleLayerVisible.bind(this, id)}
          >
            {visible && <FaEye size="0.8em" />}
            {!visible && <FaEyeSlash size="0.8em" />}
          </Button>
          {hasEffects && <Button
            className="layer-button px-1"
            variant="link"
            data-id={id}
            onClick={onToggleLayerLocked.bind(this, id)}
            >
            {locked && <FaLock size="0.8em" />}
            {!locked && <FaUnlock size="0.8em" />}
          </Button>}
        </div>

        <Button
          className={`layer-button px-2 ${hasEffects ? '' : 'invisible'}`}
          variant="link"
          data-id={id}
          onClick={onToggleLayerOpen.bind(this, id)}
          >
          {!open && <FaChevronRight size="0.8em" />}
          {open && <FaChevronDown size="0.8em" />}
        </Button>

        <div className="no-select">
           {name}
        </div>
      </div>
      {open && layer.effects && <SortableEffects
        pressDelay={150}
        lockAxis="y"
        effects={layer.effects}
        currentLayer={currentLayer}
        onLayerSelected={onLayerSelected}
        updateBeforeSortStart={onSortStarted}
        onToggleLayerVisible={onToggleLayerVisible}
        onSortEnd={onEffectMoved}
      />}
    </ListGroup.Item>
  }
)

const SortableLayers = SortableContainer((props) => {
  const {
    layers,
    currentLayer,
    ...other
  } = props

  return (
    <ListGroup
      variant="flush"
      style={{maxHeight: "240px"}}
      className="border overflow-auto"
      id="playlist-group"
    >
      {layers.map((layer, index) => {
        return (
          <SortableLayer
            key={layer.id}
            id={layer.id}
            index={index}
            active={currentLayer.id === layer.id}
            layer={layer}
            currentLayer={currentLayer}
            {...other}
          />
        )
      })}
    </ListGroup>
  )
})

export default SortableLayers
