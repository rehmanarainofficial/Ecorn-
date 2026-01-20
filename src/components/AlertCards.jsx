import {View, TouchableOpacity} from 'react-native';
import React from 'react';
import PlatformGradient from './PlatformGradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';

const AlertCards = ({
  HeadingOne,
  ValueOne,
  IconOne,
  HeadingTwo,
  ValueTwo,
  IconTwo,
  HeadingThree,
  ValueThree,
  IconThree,
  AlertHeading,
  onValuePressOne,
  onValuePressTwo,
  onValuePressThree,
}) => {
  return (
    <View
      style={{
        backgroundColor: APPCOLORS.WHITE,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 20,
      }}>
      <PlatformGradient
        colors={[APPCOLORS.BLACK, APPCOLORS.Secondary]}
        style={{padding: 20, alignItems: 'center', justifyContent: 'center'}}>
        <AppText
          title={AlertHeading}
          titleColor={APPCOLORS.WHITE}
          titleSize={2}
          titleWeight
        />
      </PlatformGradient>

      <View style={{padding: 20, gap: 20}}>
        {HeadingOne && (
          <TouchableOpacity
            onPress={onValuePressOne}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Icon
                name={IconOne || 'file-text'}
                size={20}
                color={APPCOLORS.BLACK}
              />
              <AppText
                title={HeadingOne}
                titleSize={2}
                titleColor={APPCOLORS.BLACK}
              />
            </View>
            <AppText
              title={ValueOne}
              titleSize={2}
              titleColor={APPCOLORS.BLACK}
            />
          </TouchableOpacity>
        )}

        {HeadingTwo && (
          <TouchableOpacity
            onPress={onValuePressTwo}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Icon
                name={IconTwo || 'shopping-cart'}
                size={20}
                color={APPCOLORS.BLACK}
              />
              <AppText
                title={HeadingTwo}
                titleSize={2}
                titleColor={APPCOLORS.BLACK}
              />
            </View>
            <AppText
              title={ValueTwo}
              titleSize={2}
              titleColor={APPCOLORS.BLACK}
            />
          </TouchableOpacity>
        )}

        {HeadingThree && (
          <TouchableOpacity
            onPress={onValuePressThree}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Icon
                name={IconThree || 'truck'}
                size={20}
                color={APPCOLORS.BLACK}
              />
              <AppText
                title={HeadingThree}
                titleSize={2}
                titleColor={APPCOLORS.BLACK}
              />
            </View>
            <AppText
              title={ValueThree}
              titleSize={2}
              titleColor={APPCOLORS.BLACK}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AlertCards;
