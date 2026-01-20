import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import AppText from './AppText';
import PlatformGradient from './PlatformGradient';
import {responsiveFontSize, responsiveWidth} from '../utils/Responsive';
import {APPCOLORS} from '../utils/APPCOLORS';
import AntDesign from 'react-native-vector-icons/AntDesign';

const RevenueCards = ({
  amount,
  gradientBottomColor,
  gradientTopColor,
  title,
  IsUp,
  onPress,
  accessData,
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
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
        }}>
        <View>
          <AppText
            title={title}
            titleSize={1.8}
            titleWeight
            titleColor={APPCOLORS.WHITE}
          />
          <View
            style={{
              marginTop: 2,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <AppText
              title={`Rs.${Math.round(amount).toLocaleString()}`}
              titleSize={2}
              titleColor={APPCOLORS.WHITE}
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
        </View>
      </PlatformGradient>
    </TouchableOpacity>
  );
};

export default RevenueCards;
