import React, { Component } from 'react';
import { TextInput, Platform, StyleSheet, Text, View, TouchableHighlight, Keyboard, PermissionsAndroid, TouchableOpacity,
ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import {apiKey} from '../apiKey'
import _ from 'lodash'
import PolyLine from '@mapbox/polyline'
import SocketIO from 'socket.io-client'

export default class Driver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: "",
      latitude: 0,
      longitude: 0,
      pointCoords: [],
      lookingForPassengers:false,
      bottomText: "FIND PASSENGER",
    };
  }

  componentDidMount() {
    this.permissionForLocation()
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
            error =>  alert("App couldn't get device location. Please ensure your device is connected to internet and gprs enabled."),
            { enableHighAccuracy: true, timeout: 60000 }
          );
      } else {
        alert('Taxi App might not work because of the denied permission.')
      }
    } catch (err) {
      console.warn(err);
    }
  }

  async getRouteDirections(destinationPlaceId) {
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
      });
      this.map.fitToCoordinates(pointCoords);
    } catch (error) {
      console.error(error);
    }
  }

  async lookForPassangers(){
    this.setState({
      lookingForPassengers: true,
    })
    const socket = SocketIO.connect("http://192.168.43.92:3000");
    socket.on('connect', ()=>{
      socket.emit("lookingForPassenger")
    })

    socket.on('taxiRequest', routeResponse => {
      console.log(routeResponse)
      this.getRouteDirections(routeResponse.geocoded_waypoints[0].place_id)
      this.setState({ lookingForPassengers : false, bottomText: "PASSENGER FOUND. TAP TO ACCEPT PASSENGER." })
    })

  }

  render() {
    let marker = null;

    if (this.state.pointCoords.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
        />
      );
    }

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
        <TouchableOpacity onPress={()=> this.lookForPassangers()} style={styles.bottomButton}>
          <View>
            <Text style={styles.bottomButtonText}>{this.state.bottomText}</Text>
            {this.state.lookingForPassengers === true ? ( 
              <ActivityIndicator 
                animating={this.state.lookingForPassengers} 
              size='large' />
            ) : null }
          </View>
        </TouchableOpacity>
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
