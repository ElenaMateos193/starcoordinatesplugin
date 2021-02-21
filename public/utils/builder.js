export class Builder {

  static transformIndicesToOptions(list){
    var options = [];
    options.push({value: '', text: 'Select'});
    list.forEach(index => options.push({value: index, text:index}));

    return options;
  }

  static transformPropertiesToOptions(list){
      var options = [];
      options.push({value: '', text: 'Select'});
      list.forEach(element => options.push({value: element.id, text:element.label}));
      return options;
  }

  static getProperties(type, index){
    var properties = [];
    var position = 0;
    var propertiesNames = Object.keys(index.mappings.properties);
    var numericEsTypes = ["long", "integer", "short", "double", "float", "half_float", "scaled_float"];
    propertiesNames.forEach(property=>{
      if(type=== 1){
        if (numericEsTypes.includes(index.mappings.properties[property].type)){
          properties.push({
            id: property,
            label : property,
            position: position
          });
          position ++;
        }
      }
      else if(type === 2){
        if (index.mappings.properties[property].type === "date"){
          properties.push({
            id: property,
            label : property,
            position: position
          });
          position ++;
        }
      }
      else if(type === 3){
        if(index.mappings.properties[property].type === "keyword"){
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
}