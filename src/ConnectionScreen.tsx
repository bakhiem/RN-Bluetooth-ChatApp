/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import {Buffer} from 'buffer';
import {Button, Icon, Text} from '@rneui/themed';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-community/async-storage';

interface ConnectionScreenProps {
  device: any; // Replace with the actual type of device
  onBack: () => void;
}

const ConnectionScreen: React.FC<ConnectionScreenProps> = props => {
  const [text, setText] = useState<string | undefined>(undefined);
  const [data, setData] = useState<any[]>([]);
  const [polling, setPolling] = useState(false);
  const [connection, setConnection] = useState(false);
  const scrollRef = useRef<any>();
  const connectionOptions = {
    CONNECTOR_TYPE: 'rfcomm',
    DELIMITER: '\r',
    secureSocket: false,
    DEVICE_CHARSET: Platform.OS === 'ios' ? 1536 : 'utf-8',
  };

  // let disconnectSubscription: any;
  let readSubscription: any;
  let readInterval: NodeJS.Timeout;

  useEffect(() => {
    setTimeout(() => {
      connect();
    }, 0);
    return componentWillUnmount;
  }, []);

  const getDataFromLocal = async () => {
    const conversation = await AsyncStorage.getItem(
      `Conversation_${props.device.address}`,
    );
    if (conversation) {
      return Promise.resolve(JSON.parse(conversation));
    }
    return Promise.resolve(null);
  };
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd();
    }
  }, [data?.length]);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (scrollRef.current) {
          setTimeout(() => {
            scrollRef.current.scrollToEnd();
          }, 150);
        }
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);
  const backBtnPress = () => {
    if (!connection) {
      props.onBack();
      return;
    }
    Alert.alert('Confirm', 'You want to exit?', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'OK', onPress: () => disconnect().then(() => props.onBack())},
    ]);
  };
  useEffect(() => {
    if (data && data.length > 0) {
      const saveDataToLocal = async () => {
        AsyncStorage.setItem(
          `Conversation_${props.device.address}`,
          JSON.stringify(data),
        );
      };
      if (data.length > 0) {
        saveDataToLocal();
      }
    }
  }, [data, props.device.address]);
  useEffect(() => {
    getDataFromLocal().then(res => {
      if (res && res.length > 0) {
        setData(res);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const componentWillUnmount = async () => {
    if (connection) {
      try {
        await props.device.disconnect();
      } catch (error) {
        // Unable to disconnect from device
      }
    }
    uninitializeRead();
  };

  const connect = async () => {
    try {
      let isConnected = await props.device.isConnected();
      if (!isConnected) {
        Toast.show({
          type: 'info',
          text1: `Attempting connection to ${props.device.name}`,
        });
        // console.log(connectionOptions);
        isConnected = await props.device.connect(connectionOptions);
        Toast.show({
          type: 'success',
          text1: 'Connection successful',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: `Connected to ${props.device.name}`,
        });
      }
      setConnection(isConnected);
      initializeRead();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Connection failed',
      });
    }
  };

  const disconnect = async (disconnected?: boolean) => {
    try {
      if (!disconnected) {
        disconnected = await props.device.disconnect();
      }
      Toast.show({
        type: 'info',
        text1: 'Disconnected',
      });
      setConnection(!disconnected);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Disconnect failed',
      });
    }
    uninitializeRead();
    return Promise.resolve();
  };

  const initializeRead = () => {
    disconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(() =>
      disconnect(true),
    );
    if (polling) {
      readInterval = setInterval(() => performRead(), 5000);
    } else {
      readSubscription = props.device.onDataReceived((data: any) =>
        onReceivedData(data),
      );
    }
  };

  const uninitializeRead = () => {
    if (readInterval) {
      clearInterval(readInterval);
    }
    if (readSubscription) {
      readSubscription.remove();
    }
  };

  const performRead = async () => {
    try {
      // console.log('Polling for available messages');
      let available = await props.device.available();
      // console.log(`There is data available [${available}], attempting read`);

      if (available > 0) {
        for (let i = 0; i < available; i++) {
          // console.log(`reading ${i}th time`);
          let data = await props.device.read();

          // console.log(`Read data ${data}`);
          console.log(data);
          onReceivedData({data});
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const onReceivedData = async (event: any) => {
    event.timestamp = new Date();
    addData({
      data: event.data,
      timestamp: new Date(),
      type: 'receive',
    });
  };

  const addData = (message: any) => {
    console.log('vao day', data);
    setData((prevData: any) => [message, ...prevData]);
  };

  const sendData = async () => {
    try {
      // console.log(`Attempting to send data ${text}`);
      let message = text + '\r';
      await RNBluetoothClassic.writeToDevice(props.device.address, message);
      addData({
        timestamp: new Date(),
        data: text,
        type: 'sent',
      });

      // let bufferData = Buffer.alloc(10, 0xef);
      // await props.device.write(bufferData);

      // addData({
      //   timestamp: new Date(),
      //   data: `Byte array: ${bufferData.toString()}`,
      //   type: 'sent',
      // });

      setText(undefined);
    } catch (error) {
      console.log(error);
    }
  };
  // console.log('data', data);
  const toggleConnection = () => {
    if (connection) {
      disconnect();
    } else {
      connect();
    }
  };

  const getTime = (date: string) => {
    const newDate = new Date(date);
    const hours = newDate.getHours().toString().padStart(2, '0');
    const minutes = newDate.getMinutes().toString().padStart(2, '0');
    // const seconds = newDate.getSeconds().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    return formattedTime;
  };
  const renderMessage = (item: any) => {
    const isSent = item.type === 'sent';
    return (
      // <View
      //   key={item.timestamp.toISOString()}
      //   style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
      //   <Text>{getTime(item.timestamp)}</Text>
      //   <Text>{item.type === 'sent' ? ' < ' : ' > '}</Text>
      //   <Text style={{flexShrink: 1}}>{item.data.trim()}</Text>
      // </View>
      <View
        key={item.timestamp}
        style={{
          flexDirection: 'row',
          justifyContent: isSent ? 'flex-end' : 'flex-start',
        }}>
        <View
          style={{
            maxWidth: '80%',
            marginVertical: 10,
          }}>
          <View
            style={{
              backgroundColor: isSent ? '#3490de' : '#E5E5E5',
              padding: 5,
              paddingHorizontal: 10,
              borderRadius: 12,
            }}>
            <Text style={{color: isSent ? 'white' : 'black', flexShrink: 1}}>
              {item.data}
            </Text>
          </View>
          <Text
            style={{
              alignSelf: isSent ? 'flex-end' : 'flex-start',
              fontSize: 10,
              marginHorizontal: 5,
            }}>
            {getTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };
  return (
    <View style={{flex: 1}}>
      <View style={{paddingHorizontal: 24}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={backBtnPress}>
            <Icon name="arrow-left" type="font-awesome" color="#517fa4" />
          </TouchableOpacity>
          <Text h3 style={{textAlign: 'center', color: '#2d2d2d', flexGrow: 1}}>
            {props.device.name}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 10,
            justifyContent: 'space-evenly',
          }}>
          {!connection && <Text>Not connected</Text>}
          <Button
            title={connection ? 'Disconnect' : 'Connect'}
            icon={{
              name: 'link',
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
              width: 200,
            }}
            onPress={toggleConnection}
          />
        </View>
      </View>
      <KeyboardAvoidingView style={{flex: 1}}>
        <View
          style={{
            height: '100%',
            justifyContent: 'space-between',
          }}>
          {data && data.length > 0 ? (
            <ScrollView
              ref={scrollRef}
              style={{
                paddingHorizontal: 24,
              }}>
              {data
                .slice()
                .reverse()
                .map(item => renderMessage(item))}
            </ScrollView>
          ) : (
            <View style={{flex: 1}} />
          )}
          <InputArea
            text={text}
            onChangeText={newText => setText(newText)}
            onSend={() => {
              console.log('vao day');
              if (text && text.trim() !== '') {
                sendData();
              }
            }}
            disabled={!connection}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const InputArea: React.FC<{
  text: string | undefined;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}> = ({text, onChangeText, onSend, disabled}) => {
  let style = disabled ? styles.inputArea : styles.inputAreaConnected;
  return (
    <View style={[style]}>
      <TextInput
        style={styles.inputAreaTextInput}
        placeholder={'Type message here...'}
        value={text}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onSend}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={styles.inputAreaSendButton}
        onPress={onSend}
        disabled={disabled}>
        <Icon name="paper-plane" type="font-awesome" color={'#757575'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputArea: {
    flexDirection: 'row',
    alignContent: 'stretch',
    backgroundColor: '#ccc',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  inputAreaConnected: {
    flexDirection: 'row',
    alignContent: 'stretch',
    backgroundColor: '#90EE90',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  inputAreaTextInput: {
    flex: 1,
    height: 40,
  },
  inputAreaSendButton: {
    justifyContent: 'center',
    flexShrink: 1,
  },
});

export default ConnectionScreen;
