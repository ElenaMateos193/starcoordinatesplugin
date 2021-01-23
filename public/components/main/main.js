import React from 'react';
import * as math from 'mathjs';
import {UncontrolledReactSVGPanZoom} from 'react-svg-pan-zoom';
import {
  EuiTitle,
  EuiCheckboxGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSelect,
  EuiFieldNumber,
  EuiFormRow,
  EuiDatePicker,
  EuiPanel,
  EuiSpacer,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiButtonIcon,
  EuiDatePickerRange,
  EuiColorPicker
} from '@elastic/eui';

const numericEsTypes = ["long", "integer", "short", "double", "float", "half_float", "scaled_float"];
const timeUnits =[ {text: "Select", value:0},
                    {text: "Second", value: 1}, 
                    {text: "Minute", value: 60}, 
                    {text: "Hour", value: 3600}, 
                    {text:"Day", value: 86400}, 
                    {text: "Week", value: 604800},
                    {text: "Month", value: 2592000}
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

function numberUnitToMomentUnit(number){
  var momentUnit = '';
  switch (number) {
    case 1:
      momentUnit = 's';
      break;
    case 60:
      momentUnit = 'm';
      break;
    case 3600:
      momentUnit = 'h';
      break;
    case 86400:
      momentUnit = 'd';
      break;
    case 604800:
      momentUnit = 'w';
      break;
    case 2592000:
      momentUnit = 'm';
      break;
    default:
      break;
  }
  return momentUnit;
}

function transformPropertiesToOptions(list){
  var options = [];
  options.push({value: '', text: 'Select'});
  list.forEach(index => options.push({value: index.id, text:index.label}));

  return options;
}
const planeOrigin = new Point(500, 375);

class CoordinatePlane extends React.Component{
  
  constructor(){
    super();
    this.state = {
      activeAxis: "",
      manuallyChangedAxesEndPointsList: [],
      showPointHoverModal: false,
      showColorCodeHoverModal: false,
      colorCodeField: '',
      colorCodeFieldValues: [],
      colorCodeFieldValue: '',
      color: '',
      pointHoverPropertiesSet: [],
      pointHoverPropertiesIdToSelectedMap: {}
    };
  }

  calculateInitialAxisPositionFromCartessian(axisNumber, numberOfAxes){
    var commonFormula = (2 * axisNumber * Math.PI)/numberOfAxes;
    var xCoordinate = math.round(Math.cos(commonFormula), 3);
    var yCoordinate = math.round(Math.sin(commonFormula), 3);
    return new Point(xCoordinate, yCoordinate);
  }

  rotationOfCartessianAxes(cartessianPoint, newOrigin){
    var newXCoordinate = cartessianPoint.x + newOrigin.x;
    var newYCoordinate = cartessianPoint.y + newOrigin.y;
    return new Point(newXCoordinate, newYCoordinate);
  }

  changeAxisLength(axisStartPoint, axisEndPoint, newLength){
    var currentAxisLength = math.round(Math.sqrt(Math.pow(Math.abs(axisStartPoint.x - axisEndPoint.x), 2) + Math.pow(Math.abs(axisStartPoint.y - axisEndPoint.y), 2)), 3);

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
      var colorCode = false;
      if(this.state.colorCodeField !== '' && this.state.colorCodeField != undefined){
        var pointData = this.props.indexDocs.filter(doc => doc[this.props.idProperty]=== id)[0];
        var pointColorFieldValue = pointData[this.state.colorCodeField];
        colorCode = pointColorFieldValue === this.state.colorCodeFieldValue;
        if(!colorCode && Array.isArray(pointColorFieldValue)){
          colorCode = pointColorFieldValue.filter(value => value === this.state.colorCodeFieldValue).length > 0;
        }
      }
      points.push(this.renderPoint(id, newPoint, colorCode));
      n++;
    });
    return points;
  }

  renderAxis(key, axisEndPoint){
    var cartessianAxis = this.rotationOfCartessianAxes(axisEndPoint, new Point(-planeOrigin.x, -planeOrigin.y));
    var axis = (
      <svg  key={key + 'Svg'}>
      <line onClick={(e) => this.handleAxisClick(key, e)} key={key} x1={planeOrigin.x} y1={planeOrigin.y} x2={axisEndPoint.x} y2={axisEndPoint.y} style={{stroke:'rgb(255,0,0)', strokeWidth:'5'}} >
      </line>
      <title>{key + '. x: ' + Math.trunc(cartessianAxis.x) + ' y: ' + Math.trunc(0-cartessianAxis.y)}</title>
      </svg>
    );
    return axis;
  }

  renderAxisTag(key, axisEndPoint){
    var tagXCoordinate = (axisEndPoint.x < planeOrigin.x) ? axisEndPoint.x - 5 : axisEndPoint.x + 5;
    var tagYCoordinate = (axisEndPoint.y < planeOrigin.y) ? axisEndPoint.y - 5 : axisEndPoint.y + 5;
    var tag = (
      <text x={tagXCoordinate} y={tagYCoordinate}>{key}</text>
    );
    return tag;
  }

  renderPoint(key, point, colorCode){
    var pointData= this.props.indexDocs.filter(doc => doc[this.props.idProperty]=== key)[0];
    var data = '';
    if(pointData && this.state.pointHoverPropertiesSet.length>0){
      this.state.pointHoverPropertiesSet.forEach(property => {
        data = data + ' ' + property + ': ' + pointData[property];
      });
    }
    var stroke = "green";
    if(colorCode){
      stroke = this.state.color;
    }
    var point = (
      <svg key={key + 'Svg'}>
      <circle key={key} cx={point.x} cy={point.y} stroke={stroke} strokeWidth={"3"} r={"1.5"} />
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
      var filteredCopy = this.state.manuallyChangedAxesEndPointsList.filter(axis => axis.key !== this.state.activeAxis);
      var copy = filteredCopy.concat({key: this.state.activeAxis, endPoint:  new Point(e.x, e.y)});
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
       <UncontrolledReactSVGPanZoom
          width={planeOrigin.x*2} height={planeOrigin.y*2}
          ref={Viewer => this.Viewer = Viewer}
          onClick={(e) => this.handleRepositioningClick(e)}
          style={{backgroundColor:'#ededed'}}
        >
        <svg width={planeOrigin.x*2} height={planeOrigin.y*2} style={{overflow:'visible'}}>
          <line onClick={(e) => this.handleRepositioningClick(e)} key={"xcoordinate"} x1="0" y1={planeOrigin.y} x2={planeOrigin.x*2} y2={planeOrigin.y} style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
          <line onClick={(e) => this.handleRepositioningClick(e)} key={"ycoordinate"} x1={planeOrigin.x} y1="0" x2={planeOrigin.x} y2={planeOrigin.y*2} style={{stroke:'rgb(0,0,0)', strokeWidth:'2'}}/>
          {axes}
          {points}
          {/* {tags} */}
        </svg>
        </UncontrolledReactSVGPanZoom>
        <div style={{display: 'flex', justifyContent: 'right', marginTop: '0.5em'}}>
        <EuiButton style={{marginRight:'0.5em'}} onClick={() => this.resetAxes()} fill>Reset Axes</EuiButton>
        {this.renderPointHoverOption()}
        {this.renderColorCodeHoverOption()}
        </div>
      </div>);
  }

  onChangePointHoverProperties(optionId){
    var label = this.props.indexProperties.filter(property => property.id === optionId)[0].label;

    const newCheckboxIdToSelectedMap = {... this.state.pointHoverPropertiesIdToSelectedMap}

    var newOptionValue = !newCheckboxIdToSelectedMap[optionId];

    newCheckboxIdToSelectedMap[optionId]= newOptionValue;

    var newSet = this.state.pointHoverPropertiesSet.slice();

    if(newOptionValue){
      newSet.push(label);
    }
    else{
      newSet = newSet.filter(item => item!==label);
    }

    this.setState({
      pointHoverPropertiesSet: newSet,
      pointHoverPropertiesIdToSelectedMap: newCheckboxIdToSelectedMap
    });
  }

  renderPointHoverOption(){
    var modal;
    var indexPropertiesCopy= this.props.indexProperties.slice();
    if (this.state.showPointHoverModal) {
      modal = (
        <EuiOverlayMask>
          <EuiModal onClose={()=> this.setState({showPointHoverModal: false})} initialFocus="[name=popswitch]">
            <EuiModalHeader>
              <EuiModalHeaderTitle>Point Hover Configuration</EuiModalHeaderTitle>
            </EuiModalHeader>
  
            <EuiModalBody><EuiCheckboxGroup options={indexPropertiesCopy}
              idToSelectedMap={this.state.pointHoverPropertiesIdToSelectedMap}
              onChange={(optionId) => (this.onChangePointHoverProperties(optionId))}></EuiCheckboxGroup></EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      );
    }
    return (
      <div>
        <EuiButton style={{marginRight:'0.5em'}} onClick={()=> this.setState({showPointHoverModal: true})} fill>Point hover</EuiButton>
        {modal}
      </div>
    );
  }

  onChangeColorCodeHoverField(e){
    var field = e.target.value;
    this.setState({
      colorCodeField: field
    });
    var url = '../api/starcoordinates/example/getFieldValues?index=' 
              + this.props.indexName
              + '&fieldName=' + field;
    this.props.httpClient.get(url).then((resp)=>{
      var values = resp.data.body.aggregations.fieldValues.buckets.map(function(bucket){return {value: bucket["key"], text:bucket["key"]};})
      values.unshift({value: '', text: 'Select'});
      this.setState({
        colorCodeFieldValues: values
      });
    });
  }

  onChangeColorCodeHoverFieldValue(e){
    var value = e.target.value;
    this.setState({
      colorCodeFieldValue: value
    });
  }

  onChangeColorCodeHoverColor(color){
    this.setState({
      color: color
    });
  }

  renderColorCodeHoverOption(){
    var modal;
    var nonNumericProperties = this.props.nonNumericProperties.slice();
    if (this.state.showColorCodeHoverModal) {
      modal = (
        <EuiOverlayMask>
          <EuiModal onClose={()=> this.setState({showColorCodeHoverModal: false})} initialFocus="[name=popswitch]">
            <EuiModalHeader>
              <EuiModalHeaderTitle>Color coding</EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiFormRow label="Field">
                <EuiSelect 
                options={nonNumericProperties}
                value={this.state.colorCodeField}
                onChange={(e) => (this.onChangeColorCodeHoverField(e))}></EuiSelect>
              </EuiFormRow>
              <EuiFormRow label="Value">
                <EuiSelect 
                isLoading = {this.state.colorCodeFieldValues === []}
                value={this.state.colorCodeFieldValue}
                options={this.state.colorCodeFieldValues}
                onChange={(e) => (this.onChangeColorCodeHoverFieldValue(e))}></EuiSelect>
              </EuiFormRow>
              <EuiFormRow label="Color">
                <EuiColorPicker color={this.state.color} onChange={(color)=> this.onChangeColorCodeHoverColor(color)}/>
              </EuiFormRow>
            </EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      );
    }
    return (
      <div>
        <EuiButton onClick={()=> this.setState({showColorCodeHoverModal: true})} fill>Field Color Coding</EuiButton>
        {modal}
      </div>
    );
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
        normalizedRow.push(math.round(normalizedCell, 3));
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
        if(rowStd == 0){
          normalizedRow.push(0);
        }
        else{
          var normalizedCell = (cell - rowMean) / rowStd;
          normalizedRow.push(math.round(normalizedCell, 3));
        }
      });
      normalizedMatrix.push(normalizedRow);
    });
    return normalizedMatrix;
  }
}

const initialState = {
  checkboxesAxesSet: [],
  axesCheckboxIdToSelectedMap: {},
  indices: [],
  selectedIndexName: '',
  selectedIndex: {},
  selectedIndexDocs: [],
  selectedIdProperty: '',
  selectedDateProperty: '',
  selectedOldestDate: null,
  selectedNormalization: '',
  refreshDataEnabled: false,
  refreshRate: 0,
  allNeededPropertiesSetted: false,
  size: 0,
  startDate: null,
  endDate: null,
  refreshRateUnit: 0
};
export class Main extends React.Component {
  interlvalID = null;

  constructor() {
    super();
    this.state = initialState;
  }

  transformIndicesToOptions(list){
    var options = [];
    options.push({value: '', text: 'Select'});
    list.forEach(index => options.push({value: index, text:index}));

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

  onChangeRefreshRateUnit(unit){
    this.setState({
      refreshRateUnit: unit.target.value
    });
  }

  onChangeSelectIdProperty(property){
    this.setState({
      selectedIdProperty: property.target.value
    });
  }

  onChangeSelectDateProperty(property){
    this.setState({
      selectedDateProperty: property.target.value
    });
  }

  handleSelectedOldestDate(moment){
    this.setState({selectedOldestDate: moment});
  }

  handleStartDate(moment){
    this.setState({startDate: moment});
  }

  handleEndDate(moment){
    this.setState({endDate: moment});
  }

  onChangeSelectNormalization(normalization){
    this.setState({
      selectedNormalization: normalization.target.value
    });
  }

  onChangeRefreshRate(e){
    if(e.target.value !== ""){
      var number = parseInt(e.target.value);
      if(number>0){
        this.setState({refreshDataEnabled:true, refreshRate: number});
      }
      else{
        this.setState({refreshDataEnabled:false});
      }
    }
    else{
      this.setState({refreshDataEnabled:false});
    }
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
    this.getDocsFromES(false);
  }

  getDocsFromES(isRefresh){
    const {httpClient} = this.props;
    
    var url = '../api/starcoordinates/example/get?index=' + this.state.selectedIndexName + '&size=' + this.state.size;
    if(this.state.selectedDateProperty !== ''){
      var startDate = this.state.startDate;
      var endDate = this.state.endDate;
      var momentUnit = numberUnitToMomentUnit(this.state.refreshRateUnit);
      if(isRefresh){
        startDate = startDate.add(this.state.refreshRateUnit, momentUnit);
        endDate = endDate.add(this.state.refreshRateUnit, momentUnit);
      }
      url = url + '&dateFieldName=' + this.state.selectedDateProperty + '&startDate=' + startDate.format("YYYY-MM-DDTHH:mm:ssZ") + '&endDate=' + endDate.format("YYYY-MM-DDTHH:mm:ssZ");
    }
    httpClient.get(url).then((resp) => {
      console.log(resp);
      var docs = [];
      var docsFromEs = resp.data.body.hits.hits;
      docsFromEs.forEach(doc => {
        docs.push(doc._source);
      });
      this.setState({selectedIndexDocs: docs});
      if(this.state.refreshDataEnabled && this.state.refreshRate > 0)
        this.intervalID = setTimeout(this.getDocsFromES.bind(this), this.state.refreshRate*1000*this.state.refreshRateUnit);
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
      else if(onlyNumeric === 3){
        if(!numericEsTypes.includes(index.mappings.properties[property].type) && index.mappings.properties[property].type !== "date"){
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
          id: property + '-Property',
          label : property,
          position: position
        });
        position ++;
      }
    });

    return properties;
  }

  renderAllIndexProperties(allProperties, dateProperties){
    if(this.readyToRenderPropertiesConfig()){
      return(<EuiFlexGroup>
        <EuiFlexItem>
        <EuiFormRow label="Point id">
          <EuiSelect options={transformPropertiesToOptions(allProperties)} onChange={e => this.onChangeSelectIdProperty(e)}>
          </EuiSelect>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="Max docs number">
            <EuiFieldNumber placeholder="Doc number" min={1} max={10000} onChange={(e) => {this.setState({
      size: e.target.value
    })}}></EuiFieldNumber>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
        <EuiFormRow label="Date range field (optional):" >
          <EuiSelect options={transformPropertiesToOptions(dateProperties)} onChange={e => this.onChangeSelectDateProperty(e)}>
          </EuiSelect>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="Date range:">
          <EuiDatePickerRange
        startDateControl={
          <EuiDatePicker
            selected={this.state.startDate}
            onChange={(moment) => this.handleStartDate(moment)}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            isInvalid={this.state.startDate > this.state.endDate}
            aria-label="Start date"
            showTimeSelect
          />
        }
        endDateControl={
          <EuiDatePicker
            selected={this.state.endDate}
            onChange={(moment) => this.handleEndDate(moment)}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            isInvalid={this.state.startDate > this.state.endDate}
            aria-label="End date"
            showTimeSelect
          />
        }
      />
            {/* <EuiDatePicker selected={this.state.selectedOldestDate} onChange={(date) => this.handleSelectedOldestDate(date)} /> */}
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
              <EuiFormRow label="Refresh rate:">
                <EuiFieldNumber
                  placeholder="Refresh rate"
                  onChange={(e) => this.onChangeRefreshRate(e)}
                />
                </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
              <EuiFormRow label="Refresh rate unit:">
              <EuiSelect options={timeUnits} onChange={e => this.onChangeRefreshRateUnit(e)}>
                </EuiSelect>
                </EuiFormRow>
              </EuiFlexItem>
        <EuiFlexItem>
          <EuiButton
                          style={{
    marginTop: 'auto',
    padding: '1.5em'
}}
            size="s"
            isDisabled={this.isNotReadyToStart()}
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


  readyToRenderPropertiesConfig() {
    return !this.state.allNeededPropertiesSetted &&
      this.state.selectedIndexName !== "" &&
      !(Object.keys(this.state.selectedIndex).length === 0 &&
        this.state.selectedIndex.constructor === Object);
  }

  isNotReadyToStart() {
    if(this.state.size <= 0 
      || 
      this.state.selectedIdProperty === ''){
        return true;
    }else if(this.state.selectedDateProperty !== ''){
      return this.state.startDate == null || this.state.endDate == null || this.state.refreshRate <=0 || this.state.refreshRateUnit <=0;
    } else{
      return false;
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
  renderInitProperties(){
    if(!this.state.allNeededPropertiesSetted){
      return(<EuiFlexGroup justifyContent="spaceAround">
              <EuiFlexItem grow={false}>
              <EuiFormRow label="Index to work with">
                <EuiSelect options={this.transformIndicesToOptions(this.state.indices)} onChange={e => this.onChangeSelect(e)}>
                </EuiSelect>
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
              <EuiFormRow label="Normalization to apply">
                <EuiSelect options={[{value: 0, text: "None"}, {value: 1, text: "MinMaxScaler"}, {value: 2, text: "Standard Normal Distribution"}]} onChange={e => this.onChangeSelectNormalization(e)}>
                </EuiSelect>
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{
                        marginTop: 'auto',
                        padding: '1.5em'
                        }}
                  size="s"
                  isDisabled={this.state.selectedIndexName === ''}
                  fill
                  onClick={() => this.onChangeButton()}> 
                  Next
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>);
    }
    else{
      return;
    }
  }
  renderConfiguration(){
    var title = (this.state.allNeededPropertiesSetted) ? 'Index: ' + this.state.selectedIndexName : 'Star coordinates configuration';
    return(
    <div>
    <EuiFlexGroup justifyContent="spaceAround">
    <EuiFlexItem grow={false}>
    <EuiTitle size="l">
      <h2>{title}</h2>
    </EuiTitle>
    </EuiFlexItem>
    </EuiFlexGroup>
    <EuiFlexGroup justifyContent="spaceAround">
    <EuiFlexItem grow={false}>
      {this.renderInitProperties()}
    </EuiFlexItem>
  </EuiFlexGroup></div>);
  }
  renderPropertiesConfiguration(allProperties, dateProperties){
    if(this.readyToRenderPropertiesConfig()){
    return(<div>
      <EuiFlexGroup justifyContent="spaceAround">
      <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>Properties configuration</h2>
          </EuiTitle>
      </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup justifyContent="spaceAround">
      <EuiFlexItem grow={true}>
        {this.renderAllIndexProperties(allProperties, dateProperties)}
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>);
    }else{
      return null;
    }
  }

  render() {
    var dateProperties;
    var allProperties;
    var properties = Object.keys(this.state.selectedIndex);
    if(this.state.allNeededPropertiesSetted){
      const {httpClient} = this.props;
      var numericProperties = this.getProperties(1);
      allProperties = this.getProperties(0);
      var nonNumericProperties = this.getProperties(3);
      var transformedNonNumericProperties = transformPropertiesToOptions(nonNumericProperties);
      var idPropertyLabel = allProperties.filter(property=>property.id===this.state.selectedIdProperty)[0].label
      return(
      <EuiPanel style={{margin: '2em 2em 2em 2em'}}>
      <EuiFlexGroup>
      <EuiFlexItem  grow={false}>
      <EuiButtonIcon
          onClick={() => {this.setState({allNeededPropertiesSetted: false})}}
          iconType="arrowLeft"
          aria-label="Back"
        />
      </EuiFlexItem>
    <EuiFlexItem grow={false}>
    <EuiTitle size="l">
      <h2>Index - {this.state.selectedIndexName}</h2>
    </EuiTitle>
    </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer></EuiSpacer>
        <EuiFlexGroup>
          <EuiFlexItem>
            <CoordinatePlane httpClient={httpClient} indexName={this.state.selectedIndexName} nonNumericProperties={transformedNonNumericProperties} normalize={this.state.selectedNormalization} idProperty={idPropertyLabel} axesCheckboxes = {this.state.checkboxesAxesSet} indexProperties={allProperties} indexDocs={this.state.selectedIndexDocs}></CoordinatePlane>
          </EuiFlexItem>
          {this.renderAxes(numericProperties)}
        </EuiFlexGroup>
        </EuiPanel>      
      );
    }else{
    if(properties.length> 0){
      dateProperties = this.getProperties(2);
      allProperties = this.getProperties(0);
    } else{
      dateProperties= [];
      allProperties= [];
    }
    return (
      <div>
      <EuiSpacer />
      <EuiPanel style={{marginLeft:'0.5em', marginRight:'0.5em'}}>
      {this.renderConfiguration()}
      <EuiSpacer></EuiSpacer>
      {this.renderPropertiesConfiguration(allProperties, dateProperties)}
      </EuiPanel>
      </div>
    );
  }
  }
}