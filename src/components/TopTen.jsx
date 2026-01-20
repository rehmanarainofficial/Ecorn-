import {View, Text, TouchableOpacity, Platform} from 'react-native';
import React from 'react';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';

const TopTen = ({
  title,
  onPress,
  backgroundColor = '#2196F3',
  textColor = 'white',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: backgroundColor,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
      }}>
      <AppText title={title} titleSize={2} titleColor={textColor} titleWeight />
    </TouchableOpacity>
  );
};

export default TopTen;
