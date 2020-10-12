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
  EuiCheckbox,
  EuiToolTip,
} from '@elastic/eui';

const numericEsTypes = ["long", "integer", "short", "double", "float", "half_float", "scaled_float"];

class Point {
  constructor(x, y){
    this.x= x;
    this.y= y;
  }
  toArray(){
    return [[this.x], [this.y]];
  }
}

const planeOrigin = new Point(500, 500);

class CoordinatePlane extends React.Component{
  
  constructor(){
    super();
    this.state = {
      activeAxis: "",
      manuallyChangedAxesEndPointsList: []
    };
    // this.handleDivClick = this.handleDivClick.bind(this);
  }

  calculateInitialAxisPositionFromCartessian(axisNumber, numberOfAxes){
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

  transformDataToMatrix(docs, axesProperties, idProperty){
    var arrayMatrix = [];
    var ids = [];
    docs.forEach(doc => {
      var row = [];
      axesProperties.forEach(axis =>{
        var value = doc[axis];
        if(value !== undefined && value!== null){
          row.push(doc[axis]);
        }
      })
      if(row.length == axesProperties.length){//this means we've got a full row, every property has value
        arrayMatrix.push(row);
        ids.push(doc[idProperty]);
      }
    });

    var matrix = math.transpose(arrayMatrix);
    return {Matrix: matrix, Ids: ids};
  }

  changeto2Dimensions(data, axes){
    var twoDimensions = math.multiply(axes, data);
    return twoDimensions;
  }

  transformToPoints(matrix, ids){
    var points = [];
    var n = 0;
    ids.forEach(id => {
      var pointCoordinates = math.subset(matrix, math.index([0,1], n));
      var newPoint = new Point(pointCoordinates[0][0], pointCoordinates[1][0]);
      newPoint = this.rotationOfCartessianAxes(newPoint, planeOrigin);
      points.push(this.renderPoint(id, newPoint));
      n++;
    });
    return points;
  }

  renderAxis(key, axisEndPoint){
    var axis = (
      <line onClick={(e) => this.handleAxisClick(key, e)} key={key} x1="500" y1="500" x2={axisEndPoint.x} y2={axisEndPoint.y} style={{stroke:'rgb(255,0,0)', strokeWidth:'5'}} >
      </line>
    );
    return axis;
  }

  renderPoint(key, point){
    var point = (
      <circle key={key} cx={point.x} cy={point.y} stroke={"green"} strokeWidth={"2"} r={"1"} />
    );
    return point;
  }

  handleAxisClick(key, e){
    e.stopPropagation(); 
    this.setState({activeAxis: key});
    console.log(this.state.activeAxis);
  }

  handleRepositioningClick(e){
    if(this.state.activeAxis!== ""){
      const clickEvent = e.nativeEvent;
      var filteredCopy = this.state.manuallyChangedAxesEndPointsList.filter(axis => axis.key !== this.state.activeAxis);
      var copy = filteredCopy.concat({key: this.state.activeAxis, endPoint:  new Point(clickEvent.offsetX, clickEvent.offsetY)});
      this.setState({activeAxis: "", manuallyChangedAxesEndPointsList: copy});
    }
  }

  resetAxes(){
    this.setState({manuallyChangedAxesEndPointsList: []});
  }

  render(){
    var axes= [];
    var points = [];
    var axesMatrix = [];
    var axesCheckboxesArray = this.props.axesCheckboxes.slice();
    var axisNumber = 0;

    if(this.props.axesCheckboxes.length <=0 || this.props.idProperty === ''){
      return null;
    }

    // var filteredCopy = this.state.manuallyChangedAxesEndPointsList.filter(axis => axesCheckboxesArray.includes(axis.key));
    // this.setState({manuallyChangedAxesEndPointsList: filteredCopy});
    axesCheckboxesArray = axesCheckboxesArray.sort();
    axesCheckboxesArray.forEach(element => {
        var changedAxis = this.state.manuallyChangedAxesEndPointsList.filter(axis => axis.key === element);
        if(changedAxis.length >0){
          if(axesMatrix.length <=0){
            axesMatrix.push([changedAxis[0].endPoint.x-planeOrigin.x]);//the matrix must have the origin set to 0,0
            axesMatrix.push([changedAxis[0].endPoint.y-planeOrigin.y]);
          }else{
            axesMatrix[0].push(changedAxis[0].endPoint.x-planeOrigin.x);
            axesMatrix[1].push(changedAxis[0].endPoint.y-planeOrigin.y);
          }
          axes.push(this.renderAxis(element, changedAxis[0].endPoint));
        }else{
          var axisEndPoint = this.calculateInitialAxisPositionFromCartessian(axisNumber, axesCheckboxesArray.length);
          axisEndPoint = this.changeAxisLength(new Point(0, 0), axisEndPoint, 100);
          var axisEndPointRotation = this.rotationOfCartessianAxes(axisEndPoint, planeOrigin);
          if(axesMatrix.length <=0){
            axesMatrix.push([axisEndPoint.x]);
            axesMatrix.push([axisEndPoint.y]);
          }else{
            axesMatrix[0].push(axisEndPoint.x);
            axesMatrix[1].push(axisEndPoint.y);
          }
          axes.push(this.renderAxis(element, axisEndPointRotation));
        }
        axisNumber++;
      }
    );
    
    var matrixAndIds = this.transformDataToMatrix(this.props.indexDocs, axesCheckboxesArray, this.props.idProperty);

    var originalMatrix = matrixAndIds.Matrix;

    if(this.props.normalize){
      var normalizedMatrix = [];
      
      for (var m = 0; m < originalMatrix.length; m++) {
        var element = originalMatrix[m];
        var rowMax = math.max(element);
        var rowMin = math.min(element);
        var normalizedRow= [];
        for (var n = 0; n < element.length; n++) {
          var cell = element[n];
          var normalizedCell = (cell-rowMin) / (rowMax-rowMin);
          normalizedRow.push(normalizedCell);
        }
        normalizedMatrix.push(normalizedRow);
      }

      originalMatrix = normalizedMatrix;
    }

    var pointsToRender = this.changeto2Dimensions(originalMatrix, axesMatrix);

    points = this.transformToPoints(pointsToRender, matrixAndIds.Ids);
    return(
      <div>
        <div id="canvas" onClick={(e) => this.handleRepositioningClick(e)} style={{
        backgroundColor: '#ededed',
        height: '1000px',
        width: '1000px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        }}>
        <svg style={{width:'1000px', height:'1000px', overflow:'visible'}}>
          <line onClick={(e) => this.handleRepositioningClick(e)} key={"xcoordinate"} x1="0" y1="500" x2="1000" y2="500" style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
          <line onClick={(e) => this.handleRepositioningClick(e)} key={"ycoordinate"} x1="500" y1="0" x2="500" y2="1000" style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
          {axes}
          {points}
        </svg>
        </div>
        <div style={{display: 'flex', justifyContent: 'right', marginTop: '0.5em'}}>
        <EuiButton onClick={() => this.resetAxes()} fill>Reset Axes</EuiButton>
        </div>
      </div>);
  }
}

export class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      checkboxesAxesSet: [],
      axesCheckboxIdToSelectedMap: {},
      indices: [],
      selectedIndexName: '',
      selectedIndex: {},
      selectedIndexDocs: [],
      selectedIdProperty:'',
      normalizeDataEnabled: false,
    };
  }

  transformIndicesToOptions(list){
    var options = [];
    options.push({value: '', text: 'Select'});
    list.forEach(index => options.push({value: index, text:index}));

    return options;
  }

  transformPropertiesToOptions(list){
    var options = [];
    options.push({value: '', text: 'Select'});
    list.forEach(index => options.push({value: index.id, text:index.label}));

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

  onChangeSelectIdProperty(property){
    this.setState({
      selectedIdProperty: property.target.value
    });
  }


  onChangeButton(){
    const {httpClient} = this.props;
    var url = '../api/starcoordinates/example/getIndexInfo/' + this.state.selectedIndexName;
    httpClient.get(url).then((resp)=>{
      this.setState({
        selectedIndex: resp.data.body
      });
    });
  }

  onChangeIdSelectedButton(){
    const {httpClient} = this.props;
    var url = '../api/starcoordinates/example/getFirst1000/' + this.state.selectedIndexName;
    httpClient.get(url).then((resp) => {
      console.log(resp);
      var docs = [];
      var docsFromEs = resp.data.body.hits.hits;
      docsFromEs.forEach(doc => {
        docs.push(doc._source);
      });
      this.setState({selectedIndexDocs: docs});
    });
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

  getProperties(onlyNumeric){
    var properties = [];
    var position = 0;
    var index = this.state.selectedIndex[this.state.selectedIndexName];
    var propertiesNames = Object.keys(index.mappings.properties);
    propertiesNames.forEach(property=>{
      if(onlyNumeric){
        if (numericEsTypes.includes(index.mappings.properties[property].type)){
          properties.push({
            id: property,
            label : property,
            position: position
          });
          position ++;
        }
      }else{
        properties.push({
          id: property,
          label : property,
          position: position
        });
        position ++;
      }
      
    });

    return properties;
  }

  renderAllIndexProperties(allProperties){
    if(this.state.selectedIndexName!=="" && !(Object.keys(this.state.selectedIndex).length === 0 && this.state.selectedIndex.constructor === Object)){
      return(<EuiFlexGroup>
        <EuiFlexItem>
          <EuiText>
            Select the property to be the id for the points
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSelect options={this.transformPropertiesToOptions(allProperties)} onChange={e => this.onChangeSelectIdProperty(e)}>
          </EuiSelect>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButton
            size="s"
            isDisabled={this.state.selectedIdProperty === ''}
            fill
            onClick={() => this.onChangeIdSelectedButton()}> 
            Start
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>);
    }
    else{
      return;
    }
  }

  renderAxes(indexProperties){
    if(this.state.selectedIdProperty!== '' && this.state.selectedIndexDocs.length >0){
      return(
          <EuiFlexItem>
          <EuiTitle>
            <h4>Axes</h4>
          </EuiTitle>
            <EuiCheckboxGroup
              options={indexProperties}
              idToSelectedMap={this.state.axesCheckboxIdToSelectedMap}
              onChange={(optionId) => (this.onChange(optionId))}
            />
          </EuiFlexItem>);
    }
    else{
      return;
    }
  }

  render() {
    const { title } = this.props;
    var indexProperties;
    var allProperties;
    var properties = Object.keys(this.state.selectedIndex);
    if(properties.length> 0){
      indexProperties = this.getProperties(true);
      allProperties = this.getProperties(false);
    } else{
      indexProperties= [];
      allProperties= [];
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
                <EuiSelect options={this.transformIndicesToOptions(this.state.indices)} onChange={e => this.onChangeSelect(e)}>
                </EuiSelect>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCheckbox
                  id={"normalizeCheckbox"}
                  label="Normalize Data (MinMaxScaler)"
                  checked={this.state.normalizeDataEnabled}
                  onChange ={() => this.setState({normalizeDataEnabled: !this.state.normalizeDataEnabled})}
                />
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
            {this.renderAllIndexProperties(allProperties)}
            <EuiFlexGroup>
              <EuiFlexItem>
                <CoordinatePlane normalize={this.state.normalizeDataEnabled} idProperty={this.state.selectedIdProperty} axesCheckboxes = {this.state.checkboxesAxesSet} indexProperties={indexProperties} indexDocs={this.state.selectedIndexDocs}></CoordinatePlane>
              </EuiFlexItem>
              {this.renderAxes(indexProperties)}
            </EuiFlexGroup>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}