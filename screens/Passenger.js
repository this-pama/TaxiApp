import React, { Component } from 'react';
import { TextInput, Platform, StyleSheet, Text, View, TouchableHighlight, Keyboard, PermissionsAndroid,
ToachableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import {apiKey} from '../apiKey';
import _ from 'lodash';
import PolyLine from "@mapbox/polyline";
import sockeIO from "socket.io-client";

export default class Passenger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: "",
      latitude: 0,
      longitude: 0,
      destination: "",
      predictions: [],
      pointCoords: []
    };
    this.onChangeDestinationDebounced = _.debounce(
      this.onChangeDestination,
      1000
    );
  }

  componentDidMount() {
    this.permissionForLocation()
  }

  async requestDriver(){
    const socket = sockeIO.connect("http://localhost:3000/")
    socket.on('connect', ()=>{
      console.log('client connected')
      //Request a taxi
      socket.emit('taxiRequest', this.state.routeResponse)
    })
  }

  async permissionForLocation(){
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Taxi App Location Request',
          message:
            'Taxi App require your permission to access your location details ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //Get current location and set initial region to this
          navigator.geolocation.getCurrentPosition(
            position => {
              this.setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            error => console.error(error),
            { enableHighAccuracy: true, timeout: 60000 }
          );
      } else {
        alert('Taxi App might not work because of the denied permission.')
      }
    } catch (err) {
      console.warn(err);
    }
  }

  async getRouteDirections(destinationPlaceId, destinationName) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${
          this.state.latitude
        },${
          this.state.longitude
        }&destination=place_id:${destinationPlaceId}&key=${apiKey}`
      );
      const json = await response.json();
      console.log(json);
      const points = PolyLine.decode(json.routes[0].overview_polyline.points);
      const pointCoords = points.map(point => {
        return { latitude: point[0], longitude: point[1] };
      });
      this.setState({
        pointCoords,
        predictions: [],
        destination: destinationName,
        routeResponse: json
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointCoords);
    } catch (error) {
      console.error(error);
    }
  }

  async onChangeDestination(destination) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}
    &input=${destination}&location=${this.state.latitude},${
      this.state.longitude
    }&radius=2000`;
    console.log(apiUrl);
    try {
      const result = await fetch(apiUrl);
      const json = await result.json();
      this.setState({
        predictions: json.predictions
      });
      console.log(json);
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    let marker = null;
    let driverButton = null;

    if (this.state.pointCoords.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
        />
      );
      driverButton = (
        <TouchableOpacity onPress={()=> this.requestDriver()} style={styles.bottomButton}>
          <View>
            <Text style={styles.bottomButtonText}>FIND A DRIVER</Text>
          </View>
        </TouchableOpacity>
      )
    }

    const predictions = this.state.predictions.map(prediction => (
      <TouchableHighlight
        onPress={() =>
          this.getRouteDirections(
            prediction.place_id,
            prediction.structured_formatting.main_text
          )
        }
        key={prediction.id}
      >
        <View>
          <Text style={styles.suggestions}>
            {prediction.structured_formatting.main_text}
          </Text>
        </View>
      </TouchableHighlight>
    ));

    return (
      <View style={styles.container}>
        <MapView
          ref={map => {
            this.map = map;
          }}
          style={styles.map}
          region={{
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121
          }}
          showsUserLocation={true}
        >
          <Polyline
            coordinates={this.state.pointCoords}
            strokeWidth={4}
            strokeColor="red"
          />
          {marker}
        </MapView>
        <TextInput
          placeholder="Enter destination..."
          style={styles.destinationInput}
          value={this.state.destination}
          clearButtonMode="always"
          onChangeText={destination => {
            console.log(destination);
            this.setState({ destination });
            this.onChangeDestinationDebounced(destination);
          }}
        />
        {predictions}
        {driverButton}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bottomButton:{
    backgroundColor: 'black',
    marginTop: 'auto',
    margin: 20,
    padding:15,
    paddingLeft: 30,
    paddingRight: 30,
    alignSelf: 'center'
  },
  bottomButtonText:{
    color: 'white',
    fontSize: 20
  },
  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 18,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5
  },
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    marginTop: 50,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    backgroundColor: "white"
  },
  container: {
    ...StyleSheet.absoluteFillObject
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});
