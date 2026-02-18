import {View, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import AppText from './AppText';
import {APPCOLORS} from '../utils/APPCOLORS';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {formatNumber} from '../utils/NumberUtils';

const NameBalanceContainer = ({Name, type, balance, item, darkMode}) => {
  const textColor = darkMode ? '#FFFFFF' : APPCOLORS.PRIMARY;
  const navigation = useNavigation();

  const handleAgingPress = () => {
    navigation.navigate('Aging', {name: type, item: item});
  };

  const handleLedgerPress = () => {
    const ledgerType = type === 'Bank' ? 'Banks' : type;
    navigation.navigate('Ledger', {name: ledgerType, item: item});
  };

  const handleBankPress = () => {
    navigation.navigate('ViewLedger', {
      accountCode: item?.account,
      accountName: item?.bank_name || Name,
      item: item,
    });
  };

  // For Banks - make entire card clickable
  if (type === 'Banks' || type === 'Bank') {
    return (
      <TouchableOpacity
        onPress={handleBankPress}
        activeOpacity={0.7}
        style={styles.row}>
        <View style={styles.nameWrapper}>
          <AppText
            title={Name}
            titleSize={1.6}
            titleColor={textColor}
            numberOfLines={2}
          />
        </View>
        <View style={styles.rightSection}>
          <AppText
            title={formatNumber(balance)}
            titleSize={1.6}
            titleColor={textColor}
          />
          <Icon name="chevron-right" size={22} color={textColor} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.row}>
      {/* Name - flex:1 so it wraps and doesn't push icons */}
      <View style={styles.nameWrapper}>
        <AppText
          title={Name}
          titleSize={1.6}
          titleColor={textColor}
          numberOfLines={2}
        />
      </View>

      {/* Amount + Icons - fixed width, always visible */}
      <View style={styles.rightSection}>
        <AppText
          title={formatNumber(balance)}
          titleSize={1.6}
          titleColor={textColor}
        />

        {(type === 'Customer' || type === 'Suppliers' || type === 'Items') && (
          <View style={styles.iconsRow}>
            {type === 'Items' ? (
              <TouchableOpacity
                onPress={handleLedgerPress}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon name="receipt-long" size={20} color={textColor} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleAgingPress}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Icon name="calendar-today" size={20} color={textColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLedgerPress}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Icon name="receipt-long" size={20} color={textColor} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  nameWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default NameBalanceContainer;
