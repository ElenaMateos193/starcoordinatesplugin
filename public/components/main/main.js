import React from 'react';
//import elasticsearch from 'elasticsearch';
import {
  EuiPage,
  EuiPageHeader,
  EuiTitle,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentBody,
  EuiText,
  EuiCheckboxGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTextArea,
  EuiButton,
} from '@elastic/eui';

const checkboxes = [
  {
    id: 'checkBox1',
    label: 'Check Box 1',
  },
  {
    id: 'checkBox2',
    label: 'Check Box 2',
  },
  {
    id: 'checkBox3',
    label: 'Check Box 3',
  },
  {
    id: 'checkBox4',
    label: 'Check Box 4',
  },
];
class Point {
  constructor(x, y){
    this.x= x;
    this.y= y;
  }
}
class CoordinatePlane extends React.Component{
  
  calculateAxisPositionFromCartessian(axisNumber, numberOfAxes){
    var commonFormula = (2 * axisNumber * Math.PI)/numberOfAxes;
    var xCoordinate = Math.cos(commonFormula);
    var yCoordinate = Math.sin(commonFormula);
    return new Point(xCoordinate, yCoordinate);
  }

  rotationOfCartessianAxes(cartessianPoint, newOrigin){
    var newXCoordinate = cartessianPoint.x + newOrigin.x;
    var newYCoordinate = cartessianPoint.y + newOrigin.y;
    return new Point(newXCoordinate, newYCoordinate);
  }

  changeAxisLength(axisEndPoint, newLength){
    var currentAxisLength = Math.sqrt(Math.pow(Math.abs(axisStartPoint.x - axisEndPoint.x), 2) + Math.pow(Math.abs(axisStartPoint.y - axisEndPoint.y), 2));

    var actualNewLength = newLength / currentAxisLength;

    var newAxisEndPoint = new Point(actualNewLength+axisEndPoint.x, actualNewLength + axisEndPoint.y);

    return newAxisEndPoint;
  }

  renderAxis(count, count2){
    var axis = (
      <line x2="250" y2="250" x1={count} y1={count2} style={{stroke:'rgb(255,0,0)', strokeWidth:'2'}} />
    /* <circle cx= cy={count2} r="2"/> */
    );
    return axis;
  }
  render(){
    var axes= [];
    var count = 10;
    var count2 = 10;
    var axesCheckboxesSet = new Set(this.props.axesCheckboxes);
    axesCheckboxesSet.forEach(element => {
        axes.push(this.renderAxis(count, count2));
        count = count + 30;
        count2 = count2 + 30;
      });
    return(
      <div style={{
      backgroundColor: '#ededed',
      borderRadius: '1em',
      height: '500px',
      width: '500px',
      alignSelf: 'center',
      }} class="col-6">
      <svg style={{width:'100%', height:'100%'}}>
        {axes}
      </svg>
      </div>);
  }
}

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checkboxesAxesSet: new Set(),
      axesCheckboxIdToSelectedMap: {},
    };
  }
  onChange(optionId) {
    const newCheckboxIdToSelectedMap = {... this.state.axesCheckboxIdToSelectedMap}

    var newOptionValue = !newCheckboxIdToSelectedMap[optionId];

    newCheckboxIdToSelectedMap[optionId]= newOptionValue;

    var newSet = new Set(this.state.checkboxesAxesSet);

    if(newOptionValue){
      newSet.add(optionId);
    }
    else{
      newSet.delete(optionId);
    }

    this.setState({
      checkboxesAxesSet: newSet,
      axesCheckboxIdToSelectedMap: newCheckboxIdToSelectedMap
    });
  };

  render() {
    const { title } = this.props;
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageHeader>
            <EuiTitle size="l">
              <h1>{title}</h1>
            </EuiTitle>
          </EuiPageHeader>
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiTitle>
                <h2></h2>
              </EuiTitle>
            </EuiPageContentHeader>
            <EuiPageContentBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size="m">
                  <h1>Holi</h1>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem grow={1} component="span">
                Title:
              </EuiFlexItem>
              <EuiFlexItem grow={2}>
                <EuiTextArea placeholder="your title">
                </EuiTextArea>
              </EuiFlexItem>
              <EuiFlexItem gutterSize="s">
                <EuiButton>
                  Save
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <CoordinatePlane axesCheckboxes = {this.state.checkboxesAxesSet}></CoordinatePlane>
              </EuiFlexItem>
              <EuiFlexItem>
              <EuiTitle>
                <h4>Axes</h4>
              </EuiTitle>
                <EuiCheckboxGroup
                  options={checkboxes}
                  idToSelectedMap={this.state.axesCheckboxIdToSelectedMap}
                  onChange={(optionId) => (this.onChange(optionId))}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
