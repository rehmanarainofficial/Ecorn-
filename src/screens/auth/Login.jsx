import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {CurrentLogin} from '../../redux/AuthSlice';
import Toast from 'react-native-toast-message';

const Login = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const Loading = useSelector(state => state.Data.Loading);

  const loginUser = () => {
    if (username.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Please enter a username',
      });
      return;
    }
    if (password.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Please enter a password',
      });
      return;
    }

    dispatch(CurrentLogin({username, password}));
  };

  return (
    <KeyboardAvoidingView 
      style={{flex: 1, backgroundColor: '#F3F4F6'}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: 20,
          paddingBottom: 80,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Company Logo */}
        <Image
          source={require('../../assets/images/Rider.png')}
          style={{
            height: 160,
            width: 160,
            borderRadius: 80,
            marginBottom: 15,
            alignSelf: 'center',
          }}
        />
        {/* Company Name */}
        <View style={{alignItems: 'center', marginBottom: 35}}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: '#1a1c22',
              textAlign: 'center',
            }}>
            Ercon Industries PVT Ltd
          </Text>
        </View>

        {/* Login Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 15,
            padding: 25,
            width: '90%',
            alignSelf: 'center',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 5,
            borderWidth: 1,
            borderColor: '#E0E0E0',
          }}>
            {/* Username Input */}
            <TextInput
              placeholder="Email or Username"
              placeholderTextColor="#999"
              style={styles.input}
              onChangeText={txt => setUsername(txt)}
              value={username}
            />

            {/* Password Input */}
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                onChangeText={txt => setPassword(txt)}
                value={password}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Button with Loader */}
            <TouchableOpacity
              style={styles.button}
              onPress={loginUser}
              disabled={Loading}>
              {Loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.text}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  input: {
    color: '#333',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: '#1a1c22',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    marginTop: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
