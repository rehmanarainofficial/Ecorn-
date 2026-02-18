import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {formatNumber} from '../utils/NumberUtils';
import {useNavigation} from '@react-navigation/native';

/**
 * CustomerPayableCard
 * A clean black card for Receivable (Customer) and Payable (Supplier) lists.
 * Props:
 *   name       - customer/supplier name
 *   balance    - numeric balance
 *   accentColor - left border color (optional)
 *   type       - 'Customer' | 'Suppliers'
 *   item       - raw API item (for navigation)
 */
const CustomerPayableCard = ({name, balance, accentColor, type, item}) => {
  const navigation = useNavigation();

  const handleAgingPress = () => {
    navigation.navigate('Aging', {name: type, item});
  };

  const handleLedgerPress = () => {
    navigation.navigate('Ledger', {name: type, item});
  };

  return (
    <View
      style={[
        styles.card,
        accentColor ? {borderLeftColor: accentColor, borderLeftWidth: 4} : {},
      ]}>
      {/* Name row */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </View>

      {/* Amount + Icons row */}
      <View style={styles.bottomRow}>
        <Text style={styles.amount}>{formatNumber(balance)}</Text>
        <View style={styles.icons}>
          <TouchableOpacity
            onPress={handleAgingPress}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="calendar-today" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLedgerPress}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="receipt-long" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1c22',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  nameRow: {
    marginBottom: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});

export default CustomerPayableCard;
