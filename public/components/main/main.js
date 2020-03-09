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
  EuiFlexItem
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
class CoordinatePlane extends React.Component{
  render(){
    return(<div style={{
    backgroundColor: '#ededed',
    borderRadius: '1em',
    minHeight: '30em'
     }} class="col-6">
      <span>But this item will.</span>
    </div>);
  }
}

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checkboxIdToSelectedMap: {
      },
    };
  }
  onChange(optionId) {
    const newCheckboxIdToSelectedMap = {... this.state.checkboxIdToSelectedMap}

    newCheckboxIdToSelectedMap[optionId]= !newCheckboxIdToSelectedMap[optionId];

    this.setState({
      checkboxIdToSelectedMap: newCheckboxIdToSelectedMap,
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
              <CoordinatePlane></CoordinatePlane>
              <div class="col-6">
              <EuiCheckboxGroup
                options={checkboxes}
                idToSelectedMap={this.state.checkboxIdToSelectedMap}
                onChange={(optionId) => (this.onChange(optionId))}
              />
              </div>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
