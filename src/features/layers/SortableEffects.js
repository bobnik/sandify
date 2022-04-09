import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { Button, ListGroup } from 'react-bootstrap'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const SortableEffect = SortableElement((
  {
    active,
    effect,
    onLayerSelected,
    onToggleLayerVisible
  }) => {
    const activeClass = active ? 'layer-active' : ''
    const { name, id, visible } = effect

    return <ListGroup.Item
      className={[activeClass, 'd-flex align-items-center p-0 cursor-move layer-effect'].join(' ')}
      key={id}
      id={id}
      onClick={onLayerSelected}
    >
      <Button
        className="layer-button"
        variant="link"
        data-id={id}
        onClick={onToggleLayerVisible.bind(this, id)}
      >
        {visible && <FaEye size="0.8em" />}
        {!visible && <FaEyeSlash size="0.8em" />}
      </Button>
      <div className="layer-effect-spacer" />
      <div className="no-select">
         {name}
      </div>
    </ListGroup.Item>
  }
)

const SortableEffects = SortableContainer((props) => {
  const {
    effects,
    currentLayer,
    ...other
  } = props

  return (
    <ListGroup
      variant="flush"
      style={{maxHeight: "240px"}}
      className="overflow-auto"
      id="playlist-group"
    >
      {effects.map((effect, index) => {
        return (
          <SortableEffect
            key={effect.id}
            id={effect.id}
            index={index}
            active={currentLayer.id === effect.id}
            effect={effect}
            {...other}
          />
        )
      })}
    </ListGroup>
  )
})

export default SortableEffects
