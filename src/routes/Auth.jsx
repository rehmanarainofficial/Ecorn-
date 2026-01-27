import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../screens/auth/Login';
import EmployeeRegistration from '../screens/main/stacks/HCM/EmployeeRegistration';

const Stack = createNativeStackNavigator();
const Auth = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Registration" component={EmployeeRegistration} />
    </Stack.Navigator>
  );
};

export default Auth;
