import {View, Text, TouchableOpacity, Platform} from 'react-native';
import React from 'react';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';

const TopTen = ({title, onPress}) => {
  // iOS ke liye different background color, Android ke liye same
  const buttonBgColor = Platform.OS === 'ios' 
    ? '#2d2f3a' // iOS ke liye thoda lighter color
    : APPCOLORS.Primary; // Android ke liye original color

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: buttonBgColor,
        borderRadius: 20,
      }}>
      <AppText title={title} titleSize={2} titleColor={'white'} titleWeight />
    </TouchableOpacity>
  );
};

export default TopTen;
