// @ts-nocheck
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

interface User {
  id: number;
  name: string;
}

interface DashboardProps {
  title: string;
  count: number; // This will be unhandled in usage
  users: User[];
}

export class LegacyDashboard extends Component<DashboardProps, any> {
  static propTypes = {
    title: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    users: PropTypes.array.isRequired,
  };

  constructor(props: DashboardProps) {
    super(props);
    this.state = { data: null };
  }

  // Ghost Hunter: Deprecated React 18
  UNSAFE_componentWillMount() {
    console.log("Mounting dashboard...");
    
    // Anti Pattern: Unhandled Fetch
    fetch('https://api.legacy.com/data')
      .then(res => res.json())
      .then(data => this.setState({ data }));
  }

  focusInput() {
    // Anti Pattern: FindDOMNode
    const node = ReactDOM.findDOMNode(this.refs.myInput);
    if (node) {
      (node as HTMLElement).focus();
    }
  }

  render() {
    return (
      <div className="dashboard">
        <h1>{this.props.title}</h1>
        
        {/* Anti Pattern: String Ref */}
        <input type="text" ref="myInput" placeholder="Search..." />

        <ul>
          {this.props.users.map((user) => {
            // Anti Pattern: Missing Key in Map
            return <li>{user.name as string}</li>;
          })}
        </ul>
      </div>
    );
  }
}
