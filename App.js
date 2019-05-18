import React, { Component } from 'react';
import { Button, StyleSheet, Text, View} from 'react-native';
import Passenger from './screens/Passenger'
import Driver from './screens/Driver'

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDriver: false,
      isPassenger: false
    };
  }


  render() {
    if(tsThisType.state.isPassenger){
      return <Passenger />
    }
    
    if(this.state,isDriver){
      return <Driver />
    }
    return (
      <View style={ styles.container}>
          <Button onPress={()=> this.setState({isPassenger : true})} title="Passenger" />
          <Button onPress={()=> this.setState({isDriver : true})} title= "Driver" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
 container:{
    flex: 1,
    marginTop: 50,
 },
});
