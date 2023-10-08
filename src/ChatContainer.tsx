/* eslint-disable react-native/no-inline-styles */
import {Text, Button} from '@rneui/themed';
import React, {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform, View} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import DeviceListScreen from './DeviceListScreen';
import ConnectionScreen from './ConnectionScreen';

const ChatContainer = () => {
  const [device, setDevice] = useState(undefined);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const requestAccessFineLocationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      return true;
    }
  };
  const enableBluetooth = async () => {
    // let granted = await requestAccessFineLocationPermission();
    // if (granted) {
    RNBluetoothClassic.requestBluetoothEnabled();
    // }
  };
  useEffect(() => {
    const enabledSubscription = RNBluetoothClassic.onBluetoothEnabled(event =>
      onStateChanged(event),
    );
    const disabledSubscription = RNBluetoothClassic.onBluetoothDisabled(event =>
      onStateChanged(event),
    );

    checkBluetoothEnabled();

    return () => {
      enabledSubscription.remove();
      disabledSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (bluetoothEnabled) {
      setDevice(undefined);
    }
  }, [bluetoothEnabled]);

  const onStateChanged = stateChangedEvent => {
    setBluetoothEnabled(stateChangedEvent.enabled);
    if (!stateChangedEvent.enabled) {
      setDevice(undefined);
    }
  };

  const selectDevice = value => {
    // console.log('App::selectDevice() called with: ', value);
    setDevice(value);
  };

  const checkBluetoothEnabled = async () => {
    try {
      console.log('App::componentDidMount Checking bluetooth status');
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();

      console.log(`App::componentDidMount Status: ${enabled}`);
      setBluetoothEnabled(enabled);
    } catch (error) {
      console.log('App::componentDidMount Status Error: ', error);
      setBluetoothEnabled(false);
    }
  };
  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <Text h1 style={{textAlign: 'center'}}>
        Bluetooth Chat
      </Text>
      {bluetoothEnabled ? (
        !device ? (
          <DeviceListScreen selectDevice={selectDevice} />
        ) : (
          <ConnectionScreen
            device={device}
            onBack={() => setDevice(undefined)}
          />
        )
      ) : (
        <View style={{flex: 1, marginTop: 40}}>
          <Button
            title="Enable Bluetooth"
            icon={{
              name: 'bluetooth',
              type: 'font-awesome',
              size: 15,
              color: 'white',
            }}
            iconContainerStyle={{marginRight: 10}}
            titleStyle={{fontWeight: '700'}}
            buttonStyle={{
              backgroundColor: 'rgba(199, 43, 98, 1)',
              borderColor: 'transparent',
              borderWidth: 0,
              borderRadius: 30,
            }}
            onPress={enableBluetooth}
          />
        </View>
      )}
    </View>
  );
};
export default ChatContainer;
