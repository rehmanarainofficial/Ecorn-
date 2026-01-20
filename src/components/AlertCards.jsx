import {View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import PlatformGradient from './PlatformGradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

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
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(15).stiffness(100)}
      style={{
        backgroundColor: APPCOLORS.WHITE,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderRadius: expanded ? 0 : 20, // Optional: adjust radius when expanded
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 20,
        overflow: 'hidden',
      }}>
      <TouchableOpacity activeOpacity={0.8} onPress={toggleExpand}>
        <PlatformGradient
          colors={[APPCOLORS.BLACK, APPCOLORS.Secondary]}
          style={{
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <AppText
            title={AlertHeading}
            titleColor={APPCOLORS.WHITE}
            titleSize={2}
            titleWeight
          />
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={APPCOLORS.WHITE}
          />
        </PlatformGradient>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={{padding: 20, gap: 20}}>
          {HeadingOne && (
            <TouchableOpacity
              onPress={onValuePressOne}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
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
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
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
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
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
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default AlertCards;
