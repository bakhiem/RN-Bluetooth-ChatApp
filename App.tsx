/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, View} from 'react-native';
import ChatContainer from './src/ChatContainer';
import Toast from 'react-native-toast-message';

function App(): JSX.Element {
  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <ChatContainer />
      </SafeAreaView>
      <Toast />
    </View>
  );
}

export default App;
