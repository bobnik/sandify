import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { Button, ListGroup } from 'react-bootstrap'
import { FaEye, FaEyeSlash, FaChevronRight, FaChevronDown } from 'react-icons/fa'

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
    onToggleLayerVisible
  }) => {
    const { name, id, visible, open } = layer
    const activeClass = active ? 'active' : ''
    const dragClass = numLayers > 1 ? 'cursor-move' : ''
    const visibleClass = visible ? '' : 'layer-hidden'

    return <ListGroup.Item
      className={[activeClass, dragClass,  visibleClass, 'layer p-0'].join(' ')}
      key={id}
      id={id}
    >
      <div
        className={[`layer-${activeClass}`, 'd-flex align-items-center'].join(' ')}
        onClick={onLayerSelected}
      >
        <Button
          className="layer-button"
          variant="link"
          data-id={id}
          onClick={onToggleLayerVisible}
        >
          {visible && <FaEye />}
          {!visible && <FaEyeSlash />}
        </Button>
        <div className="layer-left">
          {!open && <Button
            className={`layer-button px-2 ${!layer.effects && 'invisible'}`}
            variant="link"
            data-id={id}
            onClick={onToggleLayerOpen.bind(this, id)}
            >
            <FaChevronRight />
          </Button>}
          {open && <Button
            className={`layer-button px-2 ${!layer.effects && 'invisible'}`}
            variant="link"
            data-id={id}
            onClick={onToggleLayerOpen.bind(this, id)}
          >
            <FaChevronDown />
          </Button>}
        </div>
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
