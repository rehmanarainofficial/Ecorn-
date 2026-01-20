import { View, TouchableOpacity, Platform } from 'react-native';
import React from 'react';
import PlatformGradient from './PlatformGradient';
import { responsiveFontSize, responsiveHeight } from '../utils/Responsive';
import { APPCOLORS } from '../utils/APPCOLORS';
import AppText from './AppText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setLogout } from '../redux/AuthSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AppHeader = ({ title, onPress }) => {
  const userData = useSelector(state => state.Data.currentData);
  const dispatch = useDispatch();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();

  // iOS ke liye proper padding, Android ke liye extra vertical padding
  const paddingTop = Platform.OS === 'ios' 
      ? insets.top + 10 
      : insets.top + 15; // Android ke liye extra padding

  return (
    <PlatformGradient
      colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingTop: paddingTop,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'android' ? 10 : 0, // Android ke liye extra padding
      }}>
      {/* --- Top Icons Row --- */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
        }}>
        <AppText
          title="Ecorn Industry"
          titleColor={APPCOLORS.WHITE}
          titleSize={3}
          titleWeight
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => onPress?.('bell')}>
            <FontAwesome
              name="bell"
              color={APPCOLORS.WHITE}
              size={responsiveFontSize(2.5)}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onPress?.('mail')}>
            <Entypo
              name="mail"
              color={APPCOLORS.WHITE}
              size={responsiveFontSize(2.5)}
            />
          </TouchableOpacity>

          <View
            style={{
              height: responsiveHeight(2),
              backgroundColor: APPCOLORS.WHITE,
              width: 1,
            }}
          />

          <TouchableOpacity onPress={() => nav.navigate('ProfitAndLossScreen')}>
            <Ionicons
              name="person"
              color={APPCOLORS.WHITE}
              size={responsiveFontSize(2.5)}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => dispatch(setLogout())}>
            <AntDesign
              name="poweroff"
              color={'yellow'}
              size={responsiveFontSize(2.5)}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Profile and Balance Section --- */}
      <View
        style={{
          height: responsiveHeight(15),
          justifyContent: 'space-between',
          paddingTop: 30,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              height: responsiveHeight(5),
              width: responsiveHeight(5),
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderRadius: 200,
              borderColor: APPCOLORS.WHITE,
            }}>
            <AppText title="MA" titleColor={APPCOLORS.WHITE} />
          </View>

          <View>
            <AppText
              title={userData?.real_name || 'User'}
              titleColor={APPCOLORS.WHITE}
              titleSize={2}
            />
            <AppText
              title="Dashboard"
              titleColor={APPCOLORS.WHITE}
              titleSize={1.5}
            />
          </View>
        </View>
      </View>
    </PlatformGradient>
  );
};

export default AppHeader;
