import React from 'react';
import elasticsearch from 'elasticsearch';
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
              <h1>{title} Hello World!</h1>
            </EuiTitle>
          </EuiPageHeader>
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiTitle>
                <h2>Congratulations</h2>
              </EuiTitle>
            </EuiPageContentHeader>
            <EuiPageContentBody>
              <EuiText>
                <h3>You have successfully created your first Kibana Plugin!</h3>
                <p>The server time (via API call) is {this.state.time || 'NO API CALL YET'}</p>
              </EuiText>
              <EuiCheckboxGroup
                options={checkboxes}
                idToSelectedMap={this.state.checkboxIdToSelectedMap}
                onChange={(optionId) => (this.onChange(optionId))}
              />
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
