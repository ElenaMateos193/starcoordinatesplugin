import React from 'react';
import * as math from 'mathjs';
import {UncontrolledReactSVGPanZoom} from 'react-svg-pan-zoom';
import {
  EuiCheckboxGroup,
  EuiButton,
  EuiSelect,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiColorPicker
} from '@elastic/eui';
import { norm } from 'mathjs';

class Point {
    constructor(x, y){
      this.x= x;
      this.y= y;
    }
    toArray(){
      return [[this.x], [this.y]];
    }
  }

const planeOrigin = new Point(500, 375);

export class CoordinatePlane extends React.Component{
  
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
      
      if(this.props.indexDocs.length >0){
      
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
      }
  
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
            var firstPart = cell - rowMin;
            var secondPart = rowMax - rowMin;
            var normalizedCell = 0;
            if(secondPart > 0){
                normalizedCell = firstPart / secondPart;
            }
          
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