import React, { Component } from 'react';
import { TextInput, Platform, StyleSheet, Text, View, TouchableHighlight, Keyboard } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import {apiKey} from './apiKey'
import _ from 'lodash'
import PolyLine from '@mapbox/polyline'

export default class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      error: null,
      destination: '',
      locationPredictions: [],
      pointsCoord: [],
    }
    this.onChangeDestinationDebounced = _.debounce(this.onChangeDestination, 1000);
  }


  componentDidMount(){
    navigator.geolocation.getCurrentPosition(
      position =>{
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null
        });
        this.getRouteDirections();
      },
      error => this.setState({ error : error.message}),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 2000}
    ) 
  }

  async getRouteDirections (destinationPlaceId, destinationName){
    try{
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.latitude},${this.state.longitude}&destination=place_id:${destinationPlaceId}&key=${apiKey}`
      );
      const result = await response.json();
      const points = PolyLine.decode(result.routes[0].overview_polyline.points)
      const pointsCoord = points.map(point => {
        return{ latitude: point[0], longitude: point[1]}
      })
      this.setState({pointsCoord, predictions: [], destination: destinationName})
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointsCoord)
    } catch(err){
      console.error(err)
    }
  }

  async onChangeDestination (destination){
    this.setState({destination})
    const apiURL = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}&location=${this.state.latitude}, ${this.state.longitude}&radius=2000&input=${destination}`;
    try{
      const result = await fetch(apiURL)
      const json = await result.json();
      this.setState({locationPredictions: json.predictions })
    } catch(err){
      console.error(err)
    }
  }

  pressedPrediction(prediction){
    KeyboardEvent.dismiss();
    this.setState({
      locationPredictions: [],
      destination: prediction.description
    });
    Keyboard;
  }
  render() {
    let marker = null;
    if(this.state.pointsCoord.length > 1){
      marker = <Marker coordinate={this.state.pointsCoord[this.state.pointsCoord.length - 1]} />
    }
    const predictions = this.state.locationPredictions.map(prediction => ( 
        <TouchableHighlight 
          key= {prediction.id}
          onPressed={()=> this.getRouteDirections(prediction.place_id, prediction.structured_formatting.main_text)}
        >
          <View>
            <Text style={styles.suggestions}>{prediction.structured_formatting.main_text}</Text>
          </View>
        </TouchableHighlight>
      )
    )
    return (
      <View style= {styles.container}>
        <MapView
        ref={map => {
             this.map = map 
            }
          }
        provider={PROVIDER_GOOGLE} // remove if not using Google Maps
        style={styles.mapStyle}
        region={{
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
        showsUserLocation = {true}
        >
          <Polyline
            coordinates={this.state.pointsCoord}
            strokeWidth={2}
            strokeColor='red'
          />
          {marker}
        </MapView>

        <TextInput placeholder="Enter destination..." 
        style={styles.destinationInput}
          value={this.state.destination}
          onChangeText= {destination => this.onChangeDestinationDebounced(destination)}
        />
        {predictions}
      </View>
  
    );
  }
}

const styles = StyleSheet.create({
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    padding:5,
    marginTop: 50,
    marginLeft: 5,
    marginRight: 5,
    backgroundColor: 'white',
  },
  container: {
    ...StyleSheet.absoluteFillObject
  },
  mapStyle: {
    ...StyleSheet.absoluteFillObject
  },
  suggestions:{
    backgroundColor: 'white',
    padding: 5,
    borderWidth: 0.5,
    fontSize: 18,
    marginLeft: 5,
    marginRight: 5
  },
 
});
