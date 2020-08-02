import React from 'react';
import * as math from 'mathjs';
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
  EuiButton,
  EuiSelect,
} from '@elastic/eui';
import { EuiFlexGrid } from '@elastic/eui';


const checkboxes = [
  {
    id: 'checkBox1',
    label: 'Check Box 1',
    position: 0,
  },
  {
    id: 'checkBox2',
    label: 'Check Box 2',
    position: 1,
  },
  {
    id: 'checkBox3',
    label: 'Check Box 3',
    position: 2,
  },
  {
    id: 'checkBox4',
    label: 'Check Box 4',
    position: 3,
  },
  {
    id: 'checkBox5',
    label: 'Check Box 5',
    position: 4,
  },
  {
    id: 'checkBox6',
    label: 'Check Box 6',
    position: 5,
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

  transformDataToMatrix(data){
    var arrayMatrix = [];

    data.forEach(dataItem => {
      var row = [dataItem.c1, dataItem.c2, dataItem.c3, dataItem.c4, dataItem.c5, dataItem.c6];
      arrayMatrix.push(row);
    });

    var matrix = math.transpose(arrayMatrix);
    return matrix;
  }

  changeto2Dimensions(data, axes){
    var twoDimensions = math.multiply(axes, data);
    return twoDimensions;
  }

  transformToPoints(matrix, data){
    var points = [];
    var n = 0;
    data.forEach(dataItem => {
      var pointCoordinates = math.subset(matrix, math.index([0,1], n));
      var newPoint = new Point(pointCoordinates[0][0], pointCoordinates[1][0]);
      newPoint = this.rotationOfCartessianAxes(newPoint, planeOrigin);
      points.push(this.renderPoint(dataItem.key, newPoint));
      n++;
    });
    return points;
  }

  renderAxis(key, axisEndPoint){
    var axis = (
      <line key={key} x2="250" y2="250" x1={axisEndPoint.x} y1={axisEndPoint.y} style={{stroke:'rgb(255,0,0)', strokeWidth:'2'}} />
    );
    return axis;
  }

  renderPoint(key, point){
    var point = (
      <circle key={key} cx={point.x} cy={point.y} stroke={"green"} strokeWidth={"2"} r={"1"} />
    );
    return point;
  }

  render(){
    var axes= [];
    var points = [];
    var axesMatrix = [];
    var axesActivePositions = [];
    var dataMatrix = [];
    var axesCheckboxesArray = this.props.axesCheckboxes.slice();
    var axisNumber = 0;

    if(this.props.axesCheckboxes.length <=0){
      return null;
    }

    axesCheckboxesArray = axesCheckboxesArray.sort();

    axesCheckboxesArray.forEach(element => {
        var axisPosition = checkboxes.filter(checkbox => checkbox.id==element)[0].position; 
        axesActivePositions.push(axisPosition);
        var axisEndPoint = this.calculateAxisPositionFromCartessian(axisNumber, axesCheckboxesArray.length);
        axisEndPoint = this.changeAxisLength(new Point(0, 0), axisEndPoint, 50);
        var axisEndPointRotation = this.rotationOfCartessianAxes(axisEndPoint, planeOrigin);
        if(axesMatrix.length <=0){
          axesMatrix.push([axisEndPoint.x]);
          axesMatrix.push([axisEndPoint.y]);
        }else{
          axesMatrix[0].push(axisEndPoint.x);
          axesMatrix[1].push(axisEndPoint.y);
        }
        axes.push(this.renderAxis(element, axisEndPointRotation));
        axisNumber++;
      }
    );

    var originalMatrix = this.transformDataToMatrix(data)

    axesActivePositions.forEach(position => {
      dataMatrix.push(originalMatrix[position]);
    })

    var pointsToRender = this.changeto2Dimensions(dataMatrix, axesMatrix);

    points = this.transformToPoints(pointsToRender, data);
    return(
      <div style={{
      backgroundColor: '#ededed',
      height: '1000px',
      width: '1000px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      }}>
      <svg style={{width:'500px', height:'500px', overflow:'visible'}}>
        <line key={"xcoordinate"} x1="750" y1="250" x2="-250" y2="250" style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
        <line key={"ycoordinate"} x1="250" y1="-250" x2="250" y2="750" style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
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
      checkboxesAxesSet: [],
      axesCheckboxIdToSelectedMap: {},
      indices: [],
      selectedIndexName: '',
      selectedIndex: {}
    };
  }

  transformIndicesToOptions(){
    var options = [];
    options.push({value: '', text: 'Select'});
    this.state.indices.forEach(index => options.push({value: index, text:index}));

    return options;
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

  onChangeSelect(index){
    this.setState({
      selectedIndexName: index.target.value
    });
  }


  onChangeButton(){
    const {httpClient} = this.props;
    var url = '../api/starcoordinates/example/getIndexInfo/' + this.state.selectedIndexName;
    httpClient.get(url).then((resp)=>{
      console.log(resp);
      this.setState({
        selectedIndex: resp.data.body
      });
    })
  }

  componentDidMount(){
    const {httpClient} = this.props;
    httpClient.get('../api/starcoordinates/example/getIndices').then((resp) => {
      console.log(resp.data.body);
      var indices = resp.data.body;
      var finalIndices = [];
      indices.forEach(index => {
        if(index.index.charAt(0) !== '.'){
          finalIndices.push(index.index);
        }
      });
      this.setState({
        indices: finalIndices
      });
    });
  }

  renderProperty(property){
    return(
    <EuiFlexItem>
      {property}
    </EuiFlexItem>
    );
  }

  renderIndex(){
    var properties = [];
    var index = this.state.selectedIndex[this.state.selectedIndexName];
    var propertiesNames = Object.keys(index.mappings.properties);
    propertiesNames.forEach(property=>{
      if (index.mappings.properties[property].type === "double"){
        properties.push(this.renderProperty(property));
      }
    });

    return(
      <div>
         <EuiFlexGroup>
        <EuiFlexItem>
          The index {this.state.selectedIndexName} has the following numeric properties:
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
          {properties}
      </EuiFlexGroup>
      </div>
    );
  }

  render() {
    const { title } = this.props;
    var index;
    var properties = Object.keys(this.state.selectedIndex);
    if(properties.length> 0){
      index = this.renderIndex();
    }else{
      index= null;
    }
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
              <EuiText>
                Select the index you want to work with
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSelect options={this.transformIndicesToOptions()} onChange={e => this.onChangeSelect(e)}>
              </EuiSelect>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton
                size="s"
                isDisabled={this.state.selectedIndexName === ''}
                fill
                onClick={() => this.onChangeButton()}> 
                Start
              </EuiButton>
            </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              {index}
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
