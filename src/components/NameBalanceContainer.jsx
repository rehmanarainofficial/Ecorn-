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
    // Normalize 'Bank' to 'Banks' for Ledger screen
    const ledgerType = type === 'Bank' ? 'Banks' : type;
    navigation.navigate('Ledger', {
      name: ledgerType,
      item: item,
    });
  };

  // For Banks - navigate to ViewLedger with account code
  const handleBankPress = () => {
    // Log item to see available fields
    console.log('Bank Item:', JSON.stringify(item, null, 2));
    
    navigation.navigate('ViewLedger', {
      accountCode: item?.account, // API returns 'account' field e.g. "1012015"
      accountName: item?.bank_name || Name,
      item: item,
    });
  };

  // For Banks - make entire card clickable
  if (type === 'Banks' || type === 'Bank') {
    return (
      <TouchableOpacity onPress={handleBankPress} activeOpacity={0.7}>
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
              <Icon name="chevron-right" size={24} color={APPCOLORS.WHITE} />
            </View>
          </View>
        </PlatformGradient>
      </TouchableOpacity>
    );
  }

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
          type === 'Items') && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {type === 'Items' ? (
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
