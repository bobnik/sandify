import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import { FaTrash, FaCopy, FaPlusSquare } from 'react-icons/fa'
import { MdLibraryAdd, MdOutlineFileUpload } from 'react-icons/md'

import { getCurrentLayer, getNumLayers, getAllLayersInfo } from '../layers/selectors'
import { setCurrentLayer, addLayer, removeLayer, moveLayer, moveEffect, removeEffect, toggleVisible, toggleOpen } from '../layers/layersSlice'
import { registeredShapes, getShape } from '../../models/shapes'
import NewLayer from './NewLayer'
import CopyLayer from './CopyLayer'
import ImportLayer from './ImportLayer'
import NewEffect from './NewEffect'
import SortableLayers from './SortableLayers'
import './Playlist.scss'

const mapStateToProps = (state, ownProps) => {
  const layer = getCurrentLayer(state)
  const shape = getShape(layer)
  const numLayers = getNumLayers(state)

  return {
    layers: getAllLayersInfo(state),
    numLayers: numLayers,
    currentLayer: layer,
    shape: shape
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onLayerSelected: (event) => {
      const id = event.target.closest('.list-group-item').id
      dispatch(setCurrentLayer(id))
    },
    onLayerAdded: (type) => {
      const attrs = registeredShapes[type].getInitialState()
      dispatch(addLayer(attrs))
    },
    onLayerRemoved: (id) => {
      dispatch(removeLayer(id))
    },
    onLayerMoved: ({oldIndex, newIndex}) => {
      dispatch(moveLayer({oldIndex: oldIndex, newIndex: newIndex}))
    },
    onEffectRemoved: (id) => {
      dispatch(removeEffect(id))
    },
    onEffectMoved: ({nodes, oldIndex, newIndex}) => {
      const parent = nodes[0].node.closest('.layer')

      dispatch(moveEffect({
        parentId: parent.id,
        oldIndex: oldIndex,
        newIndex: newIndex
      }))
    },
    onSortStarted: ({node}) => {
      dispatch(setCurrentLayer(node.id))
    },
    onToggleLayerOpen: (id) => {
      dispatch(toggleOpen({ id: id }))
    },
    onToggleLayerVisible: (event) => {
      const id = event.target.closest('.list-group-item').id
      dispatch(toggleVisible({id: id}))
    }
  }
}

class Playlist extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showNewLayer: false,
      showNewEffect: false,
      showImportLayer: false,
      showCopyLayer: false
    }
  }

  scrollToBottom() {
    // we're not supposed to directly access DOM with React, with instead use a ref. That said, I can't figure
    // out how to get the nested ref in an elegant way.
    const el = document.getElementById('playlist-group')
    el.scrollTop = el.scrollHeight
  }

  toggleNewLayerModal() {
    this.setState({showNewLayer: !this.state.showNewLayer})
  }

  toggleNewEffectModal() {
    this.setState({showNewEffect: !this.state.showNewEffect})
  }

  toggleImportModal() {
    this.setState({showImportLayer: !this.state.showImportLayer})
  }

  toggleCopyModal() {
    this.setState({showCopyLayer: !this.state.showCopyLayer})
  }

  componentDidUpdate(prevProps) {
    if (this.props.numLayers > prevProps.numLayers) {
      // new layer added; make sure we scroll down to it
      this.scrollToBottom()
    }
  }

  render() {
    const {
      currentLayer, numLayers, onLayerMoved, onLayerRemoved, onSortStarted, onEffectRemoved
    } = this.props
    const canRemove = numLayers > 1

    return (
      <div>
        <NewLayer
          showModal={this.state.showNewLayer}
          toggleModal={this.toggleNewLayerModal.bind(this)}
        />

        <NewEffect
          showModal={this.state.showNewEffect}
          toggleModal={this.toggleNewEffectModal.bind(this)}
        />

        <ImportLayer
          showModal={this.state.showImportLayer}
          toggleModal={this.toggleImportModal.bind(this)}
        />

        <CopyLayer
          showModal={this.state.showCopyLayer}
          toggleModal={this.toggleCopyModal.bind(this)}
        />

        <div className="p-3">
          <h2 className="panel">Layers ({numLayers})</h2>
          <SortableLayers
            pressDelay={150}
            onSortEnd={onLayerMoved}
            updateBeforeSortStart={onSortStarted}
            lockAxis="y"
            {...this.props}
          />
          <div className="d-flex align-items-center border-left border-right border-bottom">
            <Button
              className="ml-2 layer-button"
              variant="link" size="sm"
              data-tip="Create new layer"
              onClick={this.toggleNewLayerModal.bind(this)}
            >
              <FaPlusSquare />
            </Button>
            <Button
              className="layer-button"
              variant="link"
              data-tip="Create new effect"
              onClick={this.toggleNewEffectModal.bind(this)}
            >
              <MdLibraryAdd />
            </Button>
            <Button
              className="layer-button"
              variant="link"
              data-tip="Import new layer"
              onClick={this.toggleImportModal.bind(this)}
            >
              <MdOutlineFileUpload />
            </Button>
            <div className="ml-auto">
              <Button
                className="layer-button"
                variant="link"
                data-tip="Copy layer"
                onClick={this.toggleCopyModal.bind(this)}
              >
                <FaCopy />
              </Button>
              {canRemove && !currentLayer.effect && <Button
                className="mr-2 layer-button"
                variant="link"
                data-tip="Delete layer"
                onClick={onLayerRemoved.bind(this, currentLayer.id)}
              >
                <FaTrash />
              </Button>}
              {currentLayer.effect && <Button
                className="mr-2 layer-button"
                variant="link"
                data-tip="Delete effect"
                onClick={onEffectRemoved.bind(this, currentLayer.id)}
              >
                <FaTrash />
              </Button>}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Playlist)
