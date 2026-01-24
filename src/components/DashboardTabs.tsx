import {View, TouchableOpacity} from 'react-native';
import React from 'react';
import {responsiveHeight} from '../utils/Responsive';
import {APPCOLORS} from '../utils/APPCOLORS';
import AppText from './AppText';
import Feather from 'react-native-vector-icons/Feather';

type Props = {
  name?: string;
  isNew?: boolean;
  onPress?: () => void;
  icon: string;
  isMoreButton?: boolean;
};

const DashboardTabs = ({name, onPress, icon, isMoreButton}: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        height: responsiveHeight(14),
        width: responsiveHeight(14),
        backgroundColor: APPCOLORS.WHITE,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: 15,
      }}>
      <Feather name={icon} size={35} color="black" />
      <AppText
        title={name}
        titleAlignment="center"
        titleColor={APPCOLORS.BLACK}
        titleSize={1.5}
        titleWeight
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          width: '90%',
        }}
      />
    </TouchableOpacity>
  );
};

export default DashboardTabs;
