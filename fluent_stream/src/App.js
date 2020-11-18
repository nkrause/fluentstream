import React, { Component } from 'react';
import ReactFileReader from 'react-file-reader';
import axios from 'axios';
import './App.css';
import {string} from './constants/global_strings.js';

class App extends Component{
  /**
   * constructor
   * @param {object} props
   */
    constructor(props) {
        super(props);     
        this.state = {
          ipMatches: [],
          ipAddress: '',
          clicked: false,
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

   /**
   * handleChange
   * @param {object} event
   */
    handleChange(event) {
      this.setState({ipAddress: event.target.value});  
    }

    /**
    * handleSubmit
    * @param {object} event
    */
    handleSubmit(event) {
      event.preventDefault();
      this.checkSingleIP(this.state.ipAddress);
    }

    /**
    * checkSingleIP
    * @param {string} ip
    */
    checkSingleIP = (ip) => {
      // if the IP isn't valid, clear the input and results list and show an error message
      if(!this.isValidIP(ip)){
        this.setState({ invalidIP: true, ipAddress: '', ipMatches: [] });
        return;
      }
      else{
        this.setState({ invalidIP: false });
      }

      // call the server app endpoint
      axios.post(`${string.API_BASE_URL_DEV}/check-ip`, {ipList: [ip]}, {
      }).then(res => {
        this.setState({ipMatches: res.data.ipMatches, clicked: true});
      }).catch(err => console.log(err))
    }

    /**
    * isValidIP
    * @param {string} ip
    */
    isValidIP(ip){
      if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)){
        return true;
      }
      return false;
    }

    /**
    * uploadFile
    * @param {string} file
    */
    uploadFile = (file) => {
      const formData = new FormData();        
      formData.append('file', file[0]);
      axios.post(`${string.API_BASE_URL_DEV}/upload`, formData, {
      }).then(res => {
        this.setState({ipMatches: res.data.ipMatches, clicked: true});
      }).catch(err => console.log(err))
    }

    /**
    * render
    * @return {div} 
    */
    render(){  
      const blockedIPs = this.state.ipMatches.map((ip) =>  <p>{ip}</p>);

      return(
          <div className="App">
            <h1>{string.HEADER}</h1>  
            <p className='subheader'>{string.SUBHEADER}</p>
              <div className="col-md-12">
                <form onSubmit={this.handleSubmit}>
                  <label>{string.IP_ADDRESS}
                    <input className='margin-left' type="text" value={this.state.ipAddress} onChange={this.handleChange} />
                  </label>
                  <input className='btn margin-left' type="submit" value="Check" />
                </form>
                <ReactFileReader handleFiles={this.uploadFile} fileTypes={['.csv','.txt']}>
                  <button className='btn btn-file margin-top'>{string.UPLOAD_FILE}</button>
                </ReactFileReader>
              </div>

              {!this.state.invalidIP && this.state.clicked && this.state.ipMatches.length >= 0 && 
                <div>
                  <h4>{string.RESULTS}</h4>
                  <p>{blockedIPs.len} {string.BLOCKED_IPS}</p>
                  <div>{blockedIPs}</div>
                </div>
              }
              {this.state.invalidIP && <p className='red'>{string.INVALID_IP}</p>}
          </div>
      );
   }
}

export default App;
