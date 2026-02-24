import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import AppText from './AppText';
import PlatformGradient from './PlatformGradient';
import {responsiveFontSize, responsiveWidth} from '../utils/Responsive';
import {APPCOLORS} from '../utils/APPCOLORS';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {formatNumber} from '../utils/NumberUtils';

const RevenueCards = ({
  amount,
  gradientBottomColor,
  gradientTopColor,
  title,
  IsUp,
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}>
      <PlatformGradient
        colors={[gradientTopColor, gradientBottomColor]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{
          padding: 20,
          width: responsiveWidth(44),
          marginLeft: 10,
          borderRadius: 20,
          justifyContent: 'space-between',
          opacity: disabled ? 0.5 : 1,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <AppText
            title={title}
            titleSize={1.8}
            titleWeight
            titleColor={APPCOLORS.WHITE}
          />
          {disabled && (
            <AntDesign name="lock" size={16} color={APPCOLORS.WHITE} />
          )}
        </View>
        <View
          style={{
            marginTop: 2,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <AppText
            title={`${formatNumber(amount)}`}
            titleSize={2}
            titleColor={parseFloat(amount) < 0 ? '#FF5252' : APPCOLORS.WHITE}
            titleWeight
          />

          {IsUp ? (
            <AntDesign
              name={'arrowup'}
              size={responsiveFontSize(3)}
              color={APPCOLORS.WHITE}
            />
          ) : (
            <AntDesign
              name={'arrowdown'}
              size={responsiveFontSize(3)}
              color={APPCOLORS.WHITE}
            />
          )}
        </View>
      </PlatformGradient>
    </TouchableOpacity>
  );
};

export default RevenueCards;
