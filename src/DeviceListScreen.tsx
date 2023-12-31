/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {View, FlatList, Platform, PermissionsAndroid} from 'react-native';
import {Button, CheckBox, ListItem} from '@rneui/themed';
import {Text} from 'react-native-elements';

const DeviceListScreen: React.FC<{
  selectDevice: (device: any) => void;
}> = ({selectDevice}) => {
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesBonded, setDevicesBonded] = useState<any[]>([]);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [discovering, setDiscovering] = useState<boolean>(false);

  useEffect(() => {
    acceptConnections();
  }, []);

  useEffect(() => {
    return () => {
      if (accepting) {
        cancelAcceptConnections();
      }
    };
  }, [accepting]);

  const acceptConnections = async () => {
    if (accepting) {
      cancelAcceptConnections();
      return;
    }
    setAccepting(true);
    try {
      let device = await RNBluetoothClassic.accept({delimiter: '\r'});
      if (device) {
        selectDevice(device);
      }
    } catch (error) {
      console.log('Attempt to accept connection failed.');
    } finally {
      setAccepting(false);
    }
  };
  const cancelAcceptConnections = async () => {
    try {
      let cancelled = await RNBluetoothClassic.cancelAccept();
      setAccepting(!cancelled);
    } catch (error) {
      console.log('Unable to cancel accept connection.');
    }
  };
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
  const startDiscovery = async () => {
    let granted = await requestAccessFineLocationPermission();
    if (!granted) {
      return;
    }
    setDiscovering(true);
    let devicesCopy = [...devices];
    try {
      let unpaired = await RNBluetoothClassic.startDiscovery();
      console.log('vao dayh', unpaired)
      let index = devicesCopy.findIndex(d => !d.bonded);
      if (index >= 0) {
        devicesCopy.splice(index, devicesCopy.length - index, ...unpaired);
      } else {
        devicesCopy.push(...unpaired);
      }
    } catch (err: any) {
      console.error(`Error occurred while enabling bluetooth: ${err?.message}`);
    } finally {
      setDevices(devicesCopy);
      setDiscovering(false);
    }
  };

  const onPressDevice = (device: any) => {
    selectDevice(device);
  };
  const getBondedDevices = async (unloading: boolean = false) => {
    try {
      let bonded = await RNBluetoothClassic.getBondedDevices();

      if (!unloading) {
        setDevicesBonded(bonded);
      }
    } catch (err: any) {
      setDevicesBonded([]);
      console.log(err.message);
    }
  };
  useEffect(() => {
    getBondedDevices();
  }, []);
  const renderItem = ({item}) => (
    <ListItem bottomDivider onPress={() => onPressDevice(item)}>
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
        {/* <ListItem.Subtitle>{item.id}</ListItem.Subtitle> */}
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}>
        <Button
          title="Scan Devices"
          icon={{
            name: 'search',
            type: 'font-awesome',
            size: 15,
            color: 'white',
          }}
          iconContainerStyle={{marginRight: 10}}
          titleStyle={{fontWeight: '700'}}
          buttonStyle={{
            backgroundColor: 'rgba(90, 154, 230, 1)',
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 30,
          }}
          loading={discovering}
          onPress={startDiscovery}
        />
        {/* <Button
          title="Accept connection"
          icon={{
            name: 'search',
            type: 'font-awesome',
            size: 15,
            color: 'white',
          }}
          iconContainerStyle={{marginRight: 10}}
          titleStyle={{fontWeight: '700'}}
          buttonStyle={{
            backgroundColor: 'rgba(111, 202, 186, 1)',
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 30,
          }}
          loading={accepting}
          onPress={acceptConnections}
        /> */}
        <CheckBox
          center
          title="Accept message"
          checked={accepting}
          onPress={() => acceptConnections()}
        />
      </View>
      <View>
        {devicesBonded.length > 0 && (
          <>
            <Text h5 style={{textAlign: 'center'}}>
              Paired devices
            </Text>
            <FlatList
              keyExtractor={(item, index) => index.toString()}
              data={devicesBonded}
              renderItem={renderItem}
            />
          </>
        )}
        {devices.length > 0 && (
          <>
            <Text h5 style={{textAlign: 'center'}}>
              Available devices
            </Text>
            <FlatList
              keyExtractor={(item, index) => index.toString()}
              data={devices}
              renderItem={renderItem}
            />
          </>
        )}
      </View>
    </View>
  );
};

export default DeviceListScreen;
