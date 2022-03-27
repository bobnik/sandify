import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { Button, ListGroup } from 'react-bootstrap'
import { FaEye, FaEyeSlash, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { MdMasks } from 'react-icons/md'

const SortableItem = SortableElement((
  {
    active,
    numLayers,
    layer,
    onLayerSelected,
    onToggleLayerOpen,
    onToggleLayerVisible
  }) => {
    const activeClass = active ? 'active' : ''
    const dragClass = numLayers > 1 ? 'cursor-move' : ''
    const { effect, name, id, visible, open } = layer
    const hasEffects = layer.effectIds && layer.effectIds.length > 0

    return <ListGroup.Item
      className={[activeClass, dragClass, 'd-flex align-items-center'].join(' ')}
      key={id}
      id={id}
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
      {!effect && !open && <Button
        className={`layer-button px-2 ${!hasEffects && 'invisible'}`}
        variant="link"
        data-id={id}
        onClick={onToggleLayerOpen.bind(this, id)}
        >
        <FaChevronRight />
      </Button>}
      {!effect && open && <Button
        className={`layer-button px-2 ${!hasEffects && 'invisible'}`}
        variant="link"
        data-id={id}
        onClick={onToggleLayerOpen.bind(this, id)}
      >
        <FaChevronDown />
      </Button>}
      <div className="no-select">
        {effect && <span className="ml-3">
          <MdMasks className="ml-4 mr-2 layer-button" />
        </span>} {name}
      </div>
    </ListGroup.Item>
  }
)

const SortableList = SortableContainer((props) => {
  const {
    layers,
    currentLayer,
    ...other
  } = props

  return (
    <ListGroup
      variant="flush"
      style={{maxHeight: "200px"}}
      className="border overflow-auto"
      id="playlist-group"
    >
      {layers.map((layer, index) => {
        return (
          <SortableItem
            key={layer.id}
            id={layer.id}
            index={index}
            active={currentLayer.id === layer.id}
            layer={layer}
            {...other}
          />
        )
      })}
    </ListGroup>
  )
})

export default SortableList
