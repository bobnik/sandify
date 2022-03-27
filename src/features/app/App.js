import React, { Component } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Provider } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import Header from './Header'
import InputTabs from './InputTabs'
import MachinePreview from '../preview/MachinePreview'
import store from './store'
import './App.scss'

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <ReactTooltip effect="solid" place="bottom" backgroundColor="#666666" />
        <div className="App">
          <Header />

          <main>
            <Row className="no-gutters">
              <Col className="full-page d-flex flex-column">
                <MachinePreview />
              </Col>

              <div id="sidebar">
                <InputTabs />
              </div>
            </Row>
          </main>
        </div>
      </Provider>
    )
  }
}

export default App
