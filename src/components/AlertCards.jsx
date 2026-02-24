import {View, TouchableOpacity, StyleSheet} from 'react-native';
import React, {useState} from 'react';
import PlatformGradient from './PlatformGradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';
import * as Animatable from 'react-native-animatable';

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
  disabledOne,
  disabledTwo,
  disabledThree,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container(expanded)}>
      <TouchableOpacity activeOpacity={0.8} onPress={toggleExpand}>
        <PlatformGradient
          colors={[APPCOLORS.BLACK, APPCOLORS.Secondary]}
          style={styles.header}>
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
        <Animatable.View
          animation="fadeIn"
          duration={400}
          useNativeDriver
          style={styles.content}>
          {HeadingOne && (
            <TouchableOpacity
              onPress={disabledOne ? undefined : onValuePressOne}
              activeOpacity={disabledOne ? 1 : 0.7}
              style={[styles.itemRow, {opacity: disabledOne ? 0.5 : 1}]}>
              <View style={styles.itemInfo}>
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
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <AppText
                  title={ValueOne}
                  titleSize={2}
                  titleColor={APPCOLORS.BLACK}
                />
                {disabledOne && (
                  <Icon
                    name="lock"
                    size={14}
                    color="#94A3B8"
                    style={{marginLeft: 8}}
                  />
                )}
              </View>
            </TouchableOpacity>
          )}

          {HeadingTwo && (
            <TouchableOpacity
              onPress={disabledTwo ? undefined : onValuePressTwo}
              activeOpacity={disabledTwo ? 1 : 0.7}
              style={[styles.itemRow, {opacity: disabledTwo ? 0.5 : 1}]}>
              <View style={styles.itemInfo}>
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
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <AppText
                  title={ValueTwo}
                  titleSize={2}
                  titleColor={APPCOLORS.BLACK}
                />
                {disabledTwo && (
                  <Icon
                    name="lock"
                    size={14}
                    color="#94A3B8"
                    style={{marginLeft: 8}}
                  />
                )}
              </View>
            </TouchableOpacity>
          )}

          {HeadingThree && (
            <TouchableOpacity
              onPress={disabledThree ? undefined : onValuePressThree}
              activeOpacity={disabledThree ? 1 : 0.7}
              style={[styles.itemRow, {opacity: disabledThree ? 0.5 : 1}]}>
              <View style={styles.itemInfo}>
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
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <AppText
                  title={ValueThree}
                  titleSize={2}
                  titleColor={APPCOLORS.BLACK}
                />
                {disabledThree && (
                  <Icon
                    name="lock"
                    size={14}
                    color="#94A3B8"
                    style={{marginLeft: 8}}
                  />
                )}
              </View>
            </TouchableOpacity>
          )}
        </Animatable.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: expanded => ({
    backgroundColor: APPCOLORS.WHITE,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderRadius: expanded ? 0 : 20,
    elevation: 2,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  }),
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default AlertCards;
