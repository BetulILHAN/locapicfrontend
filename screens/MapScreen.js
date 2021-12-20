import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Button, Overlay, Input } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';

import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import socketIOClient from "socket.io-client";
var socket = socketIOClient("https://backendlocapic.herokuapp.com/");

function MapScreen(props) {

  const [currentLatitude, setCurrentLatitude] = useState(0);
  const [currentLongitude, setCurrentLongitude] = useState(0);
  const [addPOI, setAddPOI] = useState(false);
  const [listPOI, setListPOI] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const [titrePOI, setTitrePOI] = useState();
  const [descPOI, setDescPOI] = useState();

  const [tempPOI, setTempPOI] = useState();
  const [userConnected,setUserConnected]= useState([])

  useEffect(() => {
    async function askPermissions() {
      let { status } = await Permissions.askAsync(Permissions.LOCATION);
      if (status === 'granted') {
        Location.watchPositionAsync({ distanceInterval: 2 },
          (location) => {
            setCurrentLatitude(location.coords.latitude)
            setCurrentLongitude(location.coords.longitude);
            socket.emit("currentLocation", {latitude: location.coords.latitude, longitude: location.coords.longitude,  pseudo: props.pseudo} ); 
           
           }
          
        );
      }
    }
 
    askPermissions();
    AsyncStorage.getItem("POI", function(error, data) {
     
      if(data){
      var POIdata = JSON.parse(data);
      setListPOI(POIdata)
      }
      // console.log(listPOI)
      // console.log("BUG",listPOI[0].description);  
      }

       );
  }, []);

  useEffect(() => { 
    socket.on('currentLocationofAll', (newlocationData)=> {
      var userConnectedCopy =([...userConnected, ]);
    var  userConnectedCopy = userConnectedCopy.filter(e=> e.pseudo != newlocationData.pseudo)
    userConnectedCopy.push(newlocationData)
    setUserConnected(userConnectedCopy)

    });
  }, [userConnected]);


  var selectPOI = (e) => {
    if (addPOI) {
      setAddPOI(false);
      setIsVisible(true);
      setTempPOI({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude });
    }
  }

  var handleSubmit = () => {
    var listPOICopie= [...listPOI, { longitude: tempPOI.longitude, latitude: tempPOI.latitude, titre: titrePOI, description: descPOI }];
    setIsVisible(false);
    setTempPOI();
    setDescPOI();
    setTitrePOI();
AsyncStorage.setItem("POI", JSON.stringify(listPOICopie))
setListPOI(listPOICopie)
   
  }
  var markerUser = userConnected.map((POI, i) => {
    return <Marker key={i} pinColor="green"  coordinate={{ latitude: POI.latitude, longitude: POI.longitude }}
      title={POI.pseudo}
      description={POI.description}
    />
  });

  
  var markerPOI = listPOI.map((POI, i) => {
    return <Marker key={i} pinColor="blue" coordinate={{ latitude: POI.latitude, longitude: POI.longitude }}
      title={POI.titre}
      description={POI.description}
    />
  });
  var isDisabled = false;
  if (addPOI) {
    isDisabled = true;
  }
console.log("g",listPOI)
  return (
    <View style={{ flex: 1 }} >
      <Overlay
        isVisible={isVisible}
        onBackdropPress={() => { setIsVisible(false) }}
      >
        <View>
          <Input
            containerStyle={{ marginBottom: 25 }}
            placeholder='titre'
            onChangeText={(val) => setTitrePOI(val)}

          />

          <Input
            containerStyle={{ marginBottom: 25 }}
            placeholder='description'
            onChangeText={(val) => setDescPOI(val)}

          />

          <Button
            title="Ajouter POI"
            buttonStyle={{ backgroundColor: "#eb4d4b" }}
            onPress={() => handleSubmit()}
            type="solid"
          />
        </View>
      </Overlay>

      <MapView
        onPress={(e) => { selectPOI(e) }}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 48.866667,
          longitude: 2.333333,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        
        <Marker key={"currentPos"}
          pinColor="red"
          title="Hello"
          description="I'am here"
          coordinate={{ latitude: currentLatitude, longitude: currentLongitude }}
        />
        {markerPOI}
        {markerUser}
      </MapView>
      <Button
        disabled={isDisabled}
        title="Add POI"
        icon={
          <Icon
            name="map-marker"
            size={20}
            color="#ffffff"
          />
        }
        buttonStyle={{ backgroundColor: "#eb4d4b" }}
        type="solid"
        onPress={() => setAddPOI(true)} />
    </View>
  );
}

function mapStateToProps(state) {
  return { pseudo : state.pseudo }
}

export default connect(
  mapStateToProps, 
  null
)(MapScreen);