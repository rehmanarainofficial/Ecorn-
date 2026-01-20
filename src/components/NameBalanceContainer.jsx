import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';
import PlatformGradient from './PlatformGradient';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {formatNumber} from '../utils/NumberUtils';

const NameBalanceContainer = ({Name, type, balance, item}) => {
  const navigation = useNavigation();
  const handleAgingPress = () => {
    navigation.navigate('Aging', {
      name: type,
      item: item,
    });
  };

  const handleLedgerPress = () => {
    navigation.navigate('Ledger', {
      name: type,
      item: item,
    });
  };

  return (
    <PlatformGradient
      colors={[APPCOLORS.BLACK, APPCOLORS.Secondary]}
      style={{padding: 15, borderRadius: 10}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View
          style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3}}>
          <View style={{flex: 1}}>
            <AppText
              title={Name}
              titleSize={1.6}
              titleColor={APPCOLORS.WHITE}
              numberOfLines={1}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginHorizontal: 8,
          }}>
          <AppText
            title={formatNumber(balance)}
            titleSize={1.6}
            titleColor={APPCOLORS.WHITE}
          />
        </View>

        {(type === 'Customer' ||
          type === 'Suppliers' ||
          type === 'Items' ||
          type === 'Banks') && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {type === 'Items' || type === 'Banks' ? (
              <TouchableOpacity onPress={handleLedgerPress}>
                <Icon name="receipt-long" size={20} color={APPCOLORS.WHITE} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity onPress={handleAgingPress}>
                  <Icon
                    name="calendar-today"
                    size={20}
                    color={APPCOLORS.WHITE}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLedgerPress}>
                  <Icon name="receipt-long" size={20} color={APPCOLORS.WHITE} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </PlatformGradient>
  );
};

export default NameBalanceContainer;
