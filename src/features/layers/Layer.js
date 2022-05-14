import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Button, Card, Row, Col } from 'react-bootstrap'
import Select from 'react-select'
import CommentsBox from '../../components/CommentsBox'
import InputOption from '../../components/InputOption'
import DropdownOption from '../../components/DropdownOption'
import CheckboxOption from '../../components/CheckboxOption'
import ToggleButtonOption from '../../components/ToggleButtonOption'
import Transforms from '../transforms/Transforms'
import { updateLayer, setShapeType, restoreDefaults } from '../layers/layersSlice'
import { getCurrentLayer } from './selectors'
import { getShape, getShapeSelectOptions } from '../../models/shapes'
import './Layer.scss'

const mapStateToProps = (state, ownProps) => {
  const layer = getCurrentLayer(state)
  const shape = getShape(layer)

  return {
    layer: layer,
    shape: shape,
    options: shape.getOptions(),
    selectOptions: getShapeSelectOptions(layer.effect),
    showShapeSelectRender: layer.selectGroup !== 'import',
    link: shape.link,
    linkText: shape.linkText
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const { id } = ownProps

  return {
    onChange: (attrs) => {
      attrs.id = id
      dispatch(updateLayer(attrs))
    },
    onChangeType: (selected) => {
      dispatch(setShapeType({id: id, type: selected.value}))
    },
    onRestoreDefaults: (event) => {
      dispatch(restoreDefaults(id))
    }
  }
}

class Layer extends Component {
  render() {
    const {
      shape, options, linkText, link, showShapeSelectRender, onChangeType, selectOptions,
      onRestoreDefaults, layer
    } = this.props
    const selectedOption = { value: shape.id, label: shape.name }
    const optionsRender = Object.keys(options).map((key, index) => {
      return this.getOptionComponent(key, index)
    })

    const linkLabel = linkText || link
    const linkRender = link ? <Row><Col sm={5}></Col><Col sm={7}><p className="mt-2">See <a target="_blank" rel="noopener noreferrer" href={link}>{linkLabel}</a> for ideas.</p></Col></Row> : undefined
    let optionsListRender = undefined

    if (Object.entries(options).length > 0) {
      optionsListRender =
        <div className="m-0">
          {optionsRender}
        </div>
    }

    let shapeSelectRender = undefined

    if (showShapeSelectRender) {
      shapeSelectRender =
        <Row className="align-items-center">
          <Col sm={5}>
            Type
          </Col>

          <Col sm={7}>
            <Select
              value={selectedOption}
              onChange={onChangeType}
              maxMenuHeight={305}
              options={selectOptions} />
          </Col>
        </Row>
    }

    return (
      <Card className="p-3 overflow-auto flex-grow-1" style={{borderTop: "1px solid #aaa", borderBottom: "none"}}>
        <Row className="align-items-center mb-2">
          <Col sm={5}>
            <h2 className="panel m-0">Properties</h2>
          </Col>
          <Col sm={7}>
            <Button className="ml-auto" variant="outline-primary" size="sm" onClick={onRestoreDefaults}>Restore defaults</Button>
          </Col>
        </Row>

        { shapeSelectRender }

        { linkRender }

        <div className="pt-1">
          { optionsListRender }
          <Transforms id={layer.id} />
        </div>
      </Card>
    )
  }

  getOptionComponent(key, index) {
    const { options, layer, onChange } = this.props
    const option = options[key]

    if (option.type === 'dropdown') {
      return  <DropdownOption
                onChange={onChange}
                options={options}
                optionKey={key}
                key={key}
                index={index}
                model={layer} />
    } else if (option.type === 'checkbox') {
      return  <CheckboxOption
                onChange={onChange}
                options={options}
                optionKey={key}
                key={key}
                index={index}
                model={layer} />
    } else if (option.type === 'comments') {
      return  <CommentsBox
                options={options}
                optionKey={key}
                key={key}
                comments={layer.comments} />
    } else if (option.type === 'togglebutton') {
      return  <ToggleButtonOption
                onChange={onChange}
                options={options}
                optionKey={key}
                key={key}
                index={index}
                model={layer} />
    } else {
      return  <InputOption
                onChange={onChange}
                options={options}
                optionKey={key}
                key={key}
                index={index}
                model={layer} />
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Layer)
