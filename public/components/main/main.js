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
  EuiFieldNumber,
  EuiFormRow,
  EuiDatePicker
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
      <svg  key={key + 'Svg'}>
      <line onClick={(e) => this.handleAxisClick(key, e)} key={key} x1="500" y1="500" x2={axisEndPoint.x} y2={axisEndPoint.y} style={{stroke:'rgb(255,0,0)', strokeWidth:'5'}} >
      </line>
      <title>{key + '. x: ' + Math.trunc(axisEndPoint.x) + ' y: ' + Math.trunc(axisEndPoint.y)}</title>
      </svg>
    );
    return axis;
  }

  renderAxisTag(key, axisEndPoint){
    var decrementX = key.length * 4
    var decrementY = 10;  
    if(axisEndPoint.y <=   planeOrigin.y){
      decrementY = decrementY * (-1)
    }
    var tag = (
      <text key={key + 'Tag'} fill="blue" x={axisEndPoint.x - decrementX} y={axisEndPoint.y + decrementY}>{key}</text>
    );
    return tag;
  }

  renderPoint(key, point){
    var pointData= this.props.indexDocs.filter(doc => doc[this.props.idProperty]=== key)[0];
    var data = '';
    if(pointData){
      this.props.axesCheckboxes.forEach(axis => {
        data = data + ' ' + axis + ': ' + pointData[axis];
      });
    }
    var point = (
      <svg key={key + 'Svg'}>
      <circle key={key} cx={point.x} cy={point.y} stroke={"green"} strokeWidth={"3"} r={"1.5"} />
      <title>{data}</title>
      </svg>
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
    var tags= [];
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
          tags.push(this.renderAxisTag(element, changedAxis[0].endPoint));
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
          tags.push(this.renderAxisTag(element, axisEndPointRotation));
        }
        axisNumber++;
      }
    );
    
    var matrixAndIds = this.transformDataToMatrix(this.props.indexDocs, axesCheckboxesArray, this.props.idProperty);

    var originalMatrix = matrixAndIds.Matrix;

    if(this.props.normalize){
      var normalizedMatrix = []
      if(this.props.normalize === "1"){
        normalizedMatrix = this.minMaxNormalization(originalMatrix);
        originalMatrix = normalizedMatrix;
      }
      else if(this.props.normalize === "2"){
        normalizedMatrix = this.normalDistribution(originalMatrix);
        originalMatrix = normalizedMatrix;
      }
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
          {/* {tags} */}
          {points}
        </svg>
        </div>
        <div style={{display: 'flex', justifyContent: 'right', marginTop: '0.5em'}}>
        <EuiButton onClick={() => this.resetAxes()} fill>Reset Axes</EuiButton>
        </div>
      </div>);
  }

  minMaxNormalization(originalMatrix) {
    var normalizedMatrix = [];

    for (var m = 0; m < originalMatrix.length; m++) {
      var element = originalMatrix[m];
      var rowMax = math.max(element);
      var rowMin = math.min(element);
      var normalizedRow = [];
      for (var n = 0; n < element.length; n++) {
        var cell = element[n];
        var normalizedCell = (cell - rowMin) / (rowMax - rowMin);
        normalizedRow.push(normalizedCell);
      }
      normalizedMatrix.push(normalizedRow);
    }
    return normalizedMatrix;
  }

  normalDistribution(originalMatrix) {
    var normalizedMatrix = [];
    originalMatrix.forEach(row => {
      var rowMean = math.mean(row);
      var rowStd = math.std(row);
      var normalizedRow = [];
      row.forEach(cell => {
        var normalizedCell = (cell - rowMean) / rowStd;
        normalizedRow.push(normalizedCell);
      });
      normalizedMatrix.push(normalizedRow);
    });
    return normalizedMatrix;
  }
}

export class Main extends React.Component {
  interlvalID = null;

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
      selectedOldestDate: null,
      selectedNormalization: '',
      refreshDataEnabled: false,
      refreshDataMins: 0,
      allNeededPropertiesSetted: false
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

  handleSelectedOldestDate(date){
    this.setState({selectedOldestDate: date});
  }

  onChangeSelectNormalization(normalization){
    this.setState({
      selectedNormalization: normalization.target.value
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

  onChangeStart(){
    this.setState({allNeededPropertiesSetted : true});
    this.getDocsFromES(100);
  }

  getDocsFromES(size){
    const {httpClient} = this.props;
    var url = '../api/starcoordinates/example/get?index=' + this.state.selectedIndexName + '&size=' + size;
    httpClient.get(url).then((resp) => {
      console.log(resp);
      var docs = [];
      var docsFromEs = resp.data.body.hits.hits;
      docsFromEs.forEach(doc => {
        docs.push(doc._source);
      });
      this.setState({selectedIndexDocs: docs});
      if(this.state.refreshDataEnabled && this.state.refreshDataMins > 0)
        this.intervalID = setTimeout(this.getDocsFromES.bind(this,size + 100), this.state.refreshDataMins*1000);
    });
  }

  componentDidMount(){
    if(this.state.selectedIndexName === ""){
      this.getIndexes();
    }
  }

  componentWillUnmount(){
    clearTimeout(this.interlvalID);
  }

  getIndexes() {
    const {httpClient} = this.props;
    httpClient.get('../api/starcoordinates/example/getIndices').then((resp) => {
      console.log(resp.data.body);
      var indices = resp.data.body;
      var finalIndices = [];
      indices.forEach(index => {
        if (index.index.charAt(0) !== '.') {
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
      if(onlyNumeric=== 1){
        if (numericEsTypes.includes(index.mappings.properties[property].type)){
          properties.push({
            id: property,
            label : property,
            position: position
          });
          position ++;
        }
      }
      else if(onlyNumeric === 2){
        if (index.mappings.properties[property].type === "date"){
          properties.push({
            id: property,
            label : property,
            position: position
          });
          position ++;
        }
      }
      else{
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

  renderAllIndexProperties(allProperties, dateProperties){
    if(!this.state.allNeededPropertiesSetted &&
      this.state.selectedIndexName!=="" && 
      !(Object.keys(this.state.selectedIndex).length === 0 && 
      this.state.selectedIndex.constructor === Object)){
      return(<EuiFlexGroup>
        <EuiFlexItem>
        <EuiFormRow label="Select the property to be the id for the points:">
          <EuiSelect options={this.transformPropertiesToOptions(allProperties)} onChange={e => this.onChangeSelectIdProperty(e)}>
          </EuiSelect>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
        <EuiFormRow label="We've detected date fields. Select one as the date range:" >
          <EuiSelect options={this.transformPropertiesToOptions(dateProperties)} onChange={e => this.onChangeSelectIdProperty(e)}>
          </EuiSelect>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="Select the oldest date to pull records from:">
            <EuiDatePicker selected={this.state.selectedOldestDate} onChange={(date) => this.handleSelectedOldestDate(date)} />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButton
            size="s"
            isDisabled={this.state.selectedIdProperty === ''}
            fill
            onClick={() => this.onChangeStart()}> 
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
  renderRefreshDataMinsFieldNumber(){
    if(this.state.refreshDataEnabled){
      return(
              <EuiFlexItem>
                <EuiFieldNumber
                  placeholder="Seconds to refresh"
                  onChange={(e) => {this.setState({refreshDataMins: parseInt(e.target.value)})}}
                />
              </EuiFlexItem>);
    }
    else{
      return;
    }
  }
  renderInitProperties(){
    if(!this.state.allNeededPropertiesSetted){
      return(<EuiFlexGroup>
              <EuiFlexItem>
              <EuiFormRow label="Select the index you want to work with:">
                <EuiSelect options={this.transformIndicesToOptions(this.state.indices)} onChange={e => this.onChangeSelect(e)}>
                </EuiSelect>
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
              <EuiFormRow label="Select the normalization you want to apply">
                <EuiSelect options={[{value: 0, text: "None"}, {value: 1, text: "MinMaxScaler"}, {value: 2, text: "Normal Distribution(mean 0, std 1)"}]} onChange={e => this.onChangeSelectNormalization(e)}>
                </EuiSelect>
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCheckbox
                    id={"refreshDataCheckbox"}
                    label="Refresh data periodically"
                    checked={this.state.refreshDataEnabled}
                    onChange ={() => this.setState({refreshDataEnabled: !this.state.refreshDataEnabled})}
                  />
              </EuiFlexItem>
              {this.renderRefreshDataMinsFieldNumber()}
              <EuiFlexItem>
                <EuiButton
                  size="s"
                  isDisabled={this.state.selectedIndexName === ''}
                  fill
                  onClick={() => this.onChangeButton()}> 
                  Start
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>);
    }
    else{
      return;
    }
  }

  render() {
    const { title } = this.props;
    var numericProperties;
    var dateProperties;
    var allProperties;
    var properties = Object.keys(this.state.selectedIndex);
    if(properties.length> 0){
      numericProperties = this.getProperties(1);
      dateProperties = this.getProperties(2);
      allProperties = this.getProperties(0);
    } else{
      numericProperties= [];
      dateProperties= [];
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
            {this.renderInitProperties()}
            {this.renderAllIndexProperties(allProperties, dateProperties)}
            <EuiFlexGroup>
              <EuiFlexItem>
                <CoordinatePlane normalize={this.state.selectedNormalization} idProperty={this.state.selectedIdProperty} axesCheckboxes = {this.state.checkboxesAxesSet} indexProperties={numericProperties} indexDocs={this.state.selectedIndexDocs}></CoordinatePlane>
              </EuiFlexItem>
              {this.renderAxes(numericProperties)}
            </EuiFlexGroup>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}