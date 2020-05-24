import React from 'react';
//import math from 'mathjs';
// import elasticsearch from 'elasticsearch';
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
  {
    id: 'checkBox5',
    label: 'Check Box 5',
  },
  {
    id: 'checkBox6',
    label: 'Check Box 6',
  },
];



class Point {
  constructor(x, y){
    this.x= x;
    this.y= y;
  }
  toArray(){
    return [[this.x], [this.y]];
  }
}

class DataItem {
  constructor(key, c1, c2, c3, c4, c5, c6){
    this.key = key;
    this.c1= c1;
    this.c2= c2;
    this.c3= c3;
    this.c4= c4;
    this.c5= c5;
    this.c6= c6;
  }
}

const data = [
  new DataItem("data1",4, 4, 8, 2, 10, 1),
  new DataItem("data2",2, 16, 3, 3, 1, 4),
  new DataItem("data3",6, 1, 2, 6, 4, 3),
  new DataItem("data4",5, 6, 7, 7, 5, 3),
  new DataItem("data5",4, 3, 11, 0, 13, 2),
  new DataItem("data6",6, 5, 0, 9, 4, 7),
  new DataItem("data7",12, 6, 3, 3, 8, 5),
  new DataItem("data8",3, 2, 1, 4, 9, 11),
  new DataItem("data9",9, 10, 5, 4, 0, 1),
];


const planeOrigin = new Point(250, 250);


class Axis {
  constructor(active, axisX, axisY){
    this.active = active;
    this.axisEnd = new Point(axisX, axisY);
  }
}
class CoordinatePlane extends React.Component{
  
  calculateAxisPositionFromCartessian(axisNumber, numberOfAxes){
    var commonFormula = (2 * axisNumber * Math.PI)/numberOfAxes;
    var xCoordinate = Math.round(Math.cos(commonFormula)*100)/100;
    var yCoordinate = Math.round(Math.sin(commonFormula)*100)/100;
    return new Point(xCoordinate, yCoordinate);
  }

  rotationOfCartessianAxes(cartessianPoint, newOrigin){
    var newXCoordinate = cartessianPoint.x + newOrigin.x;
    var newYCoordinate = cartessianPoint.y + newOrigin.y;
    return new Point(newXCoordinate, newYCoordinate);
  }

  changeAxisLength(axisStartPoint, axisEndPoint, newLength){
    var currentAxisLength = Math.sqrt(Math.pow(Math.abs(axisStartPoint.x - axisEndPoint.x), 2) + Math.pow(Math.abs(axisStartPoint.y - axisEndPoint.y), 2));

    var actualNewLength = newLength / currentAxisLength;

    var newAxisEndPoint = new Point(actualNewLength*axisEndPoint.x, actualNewLength*axisEndPoint.y);

    return newAxisEndPoint;
  }

  changeto2Dimensions(dataItem, axes){
    var matrixForDataItem = [[dataItem.c1], [dataItem.c2], [dataItem.c3], [dataItem.c4], [dataItem.c5], [dataItem.c6]];
    
    var pointCoordinateAcc = 0;
    var r = 0;
    var pointR = 0;
    var result = [[],[]];
    axes.forEach(row => {
        row.forEach(element =>{
          pointCoordinateAcc = element * matrixForDataItem[r][0] + pointCoordinateAcc;
          r++;
        });
        result[pointR][0] = pointCoordinateAcc;
        pointCoordinateAcc = 0;
        r = 0;
        pointR++;
    });
    var point = new Point(result[0][0], result[1][0]);
    return point;
  }

  renderAxis(key, axisEndPoint){
    var axis = (
      <line key={key} x2="250" y2="250" x1={axisEndPoint.x} y1={axisEndPoint.y} style={{stroke:'rgb(255,0,0)', strokeWidth:'2'}} />
    );
    return axis;
  }

  renderPoint(key, point){
    var point = (
      <circle key={key} cx={point.x} cy={point.y} style={{stroke:'rgb(255,0,0)', strokeWidth:'2'}} />
    );
    return point;
  }

  render(){
    var axes= [];
    var points = [];
    var axesMatrix = [[], []];
    var axesCheckboxesArray = this.props.axesCheckboxes.slice();
    var axisNumber = 0;

    axesCheckboxesArray.forEach(element => {
        var axisEndPoint = this.calculateAxisPositionFromCartessian(axisNumber, axesCheckboxesArray.length);
        axisEndPoint = this.changeAxisLength(new Point(0, 0), axisEndPoint, 100);
        axisEndPoint = this.rotationOfCartessianAxes(axisEndPoint, planeOrigin);
        axesMatrix[0].push(axisEndPoint.x);
        axesMatrix[1].push(axisEndPoint.y);
        axes.push(this.renderAxis(element, axisEndPoint));
        axisNumber++;
      }
    );

    data.forEach(element=> {
      var point = this.changeto2Dimensions(element, axesMatrix);
      points.push(this.renderPoint(element.key, point));
    });
    return(
      <div style={{
      backgroundColor: '#ededed',
      borderRadius: '1em',
      height: '500px',
      width: '500px',
      alignSelf: 'center',
      }}>
      <svg style={{width:'100%', height:'100%'}}>
        <line key={"xcoordinate"} x1="0" y1="250" x2="500" y2="250" style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
        <line key={"ycoordinate"} x1="250" y1="0" x2="250" y2="500" style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
        {axes}
        {points}
      </svg>
      </div>);
  }
}

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checkboxesAxesSet: new Array(),
      axesCheckboxIdToSelectedMap: {},
    };
  }
  onChange(optionId) {
    const newCheckboxIdToSelectedMap = {... this.state.axesCheckboxIdToSelectedMap}

    var newOptionValue = !newCheckboxIdToSelectedMap[optionId];

    newCheckboxIdToSelectedMap[optionId]= newOptionValue;

    var newSet = this.state.checkboxesAxesSet.slice();

    if(newOptionValue){
      newSet.push(optionId);
    }
    else{
      newSet = newSet.filter(item => item!==optionId);
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
            {/* <EuiFlexGroup>
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
              <EuiFlexItem>
                <EuiButton>
                  Save
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup> */}
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
