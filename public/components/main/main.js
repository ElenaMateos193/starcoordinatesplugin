import React from 'react';
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
  EuiButtonIcon,
  EuiDatePickerRange,
} from '@elastic/eui';

import {CoordinatePlane} from "../coordinate_plane/coordinate_plane"

const numericEsTypes = ["long", "integer", "short", "double", "float", "half_float", "scaled_float"];
const timeUnits =[ {text: "Select", value:0},
                    {text: "Second", value: 1}, 
                    {text: "Minute", value: 60}, 
                    {text: "Hour", value: 3600}, 
                    {text:"Day", value: 86400}, 
                    {text: "Week", value: 604800},
                    {text: "Month", value: 2592000}
                  ];

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
  selectedNormalization: 0,
  refreshDataEnabled: false,
  refreshRate: null,
  allNeededPropertiesSetted: false,
  size: null,
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
    if(unit.target.value !== 0){
      var number = parseInt(unit.target.value);
      if(number > 0){
        this.setState({
          refreshRateUnit: number
        });
      }
    }
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
      if(isRefresh){
        var momentUnit = numberUnitToMomentUnit(this.state.refreshRateUnit);
        this.setState({startDate: this.state.startDate.add(this.state.refreshRate, momentUnit)});
        this.setState({endDate: this.state.endDate.add(this.state.refreshRate, momentUnit)});
      }
      url = url + '&dateFieldName=' + this.state.selectedDateProperty + '&startDate=' + this.state.startDate.format("YYYY-MM-DDTHH:mm:ss.SSS") + '&endDate=' + this.state.endDate.format("YYYY-MM-DDTHH:mm:ss.SSS");
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
        this.intervalID = setTimeout(this.getDocsFromES.bind(this, true), this.state.refreshRate*1000*this.state.refreshRateUnit);
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
          <EuiSelect value={this.state.selectedIdProperty} options={transformPropertiesToOptions(allProperties)} onChange={e => this.onChangeSelectIdProperty(e)}>
          </EuiSelect>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow label="Max docs number">
            <EuiFieldNumber value={this.state.size} placeholder="Doc number" min={1} max={10000} onChange={(e) => {this.setState({
      size: e.target.value
    })}}></EuiFieldNumber>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
        <EuiFormRow label="Date range field (optional):" >
          <EuiSelect value={this.state.selectedDateProperty} options={transformPropertiesToOptions(dateProperties)} onChange={e => this.onChangeSelectDateProperty(e)}>
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
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
              <EuiFormRow label="Refresh rate:">
                <EuiFieldNumber
                  value={this.state.refreshRate}
                  placeholder="Refresh rate"
                  onChange={(e) => this.onChangeRefreshRate(e)}
                />
                </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
              <EuiFormRow label="Refresh rate unit:">
              <EuiSelect value={this.state.refreshRateUnit} options={timeUnits} onChange={e => this.onChangeRefreshRateUnit(e)}>
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
                <EuiSelect value={this.state.selectedIndexName} options={this.transformIndicesToOptions(this.state.indices)} onChange={e => this.onChangeSelect(e)}>
                </EuiSelect>
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
              <EuiFormRow label="Normalization to apply">
                <EuiSelect value={this.state.selectedNormalization} options={[{value: 0, text: "None"}, {value: 1, text: "MinMaxScaler"}, {value: 2, text: "Standard Normal Distribution"}]} onChange={e => this.onChangeSelectNormalization(e)}>
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