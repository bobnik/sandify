import React, { Component } from 'react'
import Select from 'react-select'
import { Button, Modal, Row, Col, Form } from 'react-bootstrap'
import { connect } from 'react-redux'

import { getLayers } from '../store/selectors'
import { getCurrentLayer } from '../layers/selectors'
import { registeredShapes, getShapeSelectOptions, getShape } from '../../models/shapes'
import { addEffect, updateLayers, setNewEffectType } from '../layers/layersSlice'

const customStyles = {
  control: base => ({
    ...base,
    height: 55,
    minHeight: 55
  })
}

const mapStateToProps = (state, ownProps) => {
  const layers = getLayers(state)
  const layer = getCurrentLayer(state)

  return {
    newEffectType: layers.newEffectType,
    newEffectName: layers.newEffectName,
    currentLayer: layer,
    selectOptions: getShapeSelectOptions(true),
    showModal: ownProps.showModal
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onChangeNewType: (selected) => {
      dispatch(setNewEffectType(selected.value))
    },
    onChangeNewName: (event) => {
      dispatch(updateLayers({ newEffectName: event.target.value, newEffectNameOverride: true }))
    },
    onEffectAdded: (type, parentId) => {
      const attrs = registeredShapes[type].getInitialState()
      attrs.parentId = parentId
      dispatch(addEffect(attrs))
    },
    toggleModal: () => {
      ownProps.toggleModal()
    }
  }
}

class NewEffect extends Component {
  render() {
    const {
      newEffectType, currentLayer, toggleModal, showModal, selectOptions, newEffectName,
      onChangeNewType, onChangeNewName, onEffectAdded
    } = this.props
    const selectedShape = getShape({type: newEffectType})
    const selectedOption = { value: selectedShape.id, label: selectedShape.name }

    return <Modal
      show={showModal}
      onHide={toggleModal}
    >
      <Modal.Header closeButton>
        <Modal.Title>Create new effect</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="align-items-center">
          <Col sm={5}>
            Type
          </Col>
          <Col sm={7}>
            <Select
              value={selectedOption}
              onChange={onChangeNewType}
              styles={customStyles}
              maxMenuHeight={305}
              options={selectOptions} />
          </Col>
        </Row>
        <Row className="align-items-center mt-2">
          <Col sm={5}>
            Name
          </Col>
          <Col sm={7}>
            <Form.Control
              value={newEffectName}
              onFocus={this.handleNameFocus}
              onChange={onChangeNewName}
            />
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button
          id="new-layer-close"
          variant="link"
          onClick={toggleModal}
        >
          Cancel
        </Button>
        <Button
          id="new-layer-add"
          variant="primary"
          onClick={() => {
            onEffectAdded(newEffectType, currentLayer.effect ? currentLayer.parentId : currentLayer.id)
            toggleModal()
          }}
        >
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  }

  handleNameFocus(event) {
    event.target.select()
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewEffect)
