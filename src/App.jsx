import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Routes from './routes/Routes';
import {Provider} from 'react-redux';
import {Store} from './redux/Store';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  return (
    <Provider store={Store}>
      <SafeAreaProvider style={{flex: 1}}>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </SafeAreaProvider>
      <Toast />
    </Provider>
  );
};

export default App;
