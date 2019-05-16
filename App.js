import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

export default class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      error: null
    }
  }


  componentDidMount(){
    navigator.geolocation.getCurrentPosition(
      position =>{
        alert(position.coords.latitude)
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null
        });
       
      },
      error => this.setState({ error : error.message}),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 2000}
    )
  }
  render() {
    return (
      <MapView
       provider={PROVIDER_GOOGLE} // remove if not using Google Maps
       style={styles.mapStyle}
       region={{
         latitude: this.state.latitude,
         longitude: this.state.longitude,
         latitudeDelta: 0.015,
         longitudeDelta: 0.0121,
       }}
      >
      <Marker coordinate= {this.state} />
      </MapView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  mapStyle: {
    flex: 1
  },
 
});
