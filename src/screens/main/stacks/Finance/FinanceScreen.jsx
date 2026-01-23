import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import PlatformGradient from '../../../../components/PlatformGradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import * as Animatable from 'react-native-animatable';

const buttons = [
  {name: 'View Ledger', icon: 'book-open-page-variant', screen: 'ViewLedger'},
  {
    name: 'Expense Claim Submission',
    icon: 'file-document-edit',
    screen: 'ExpenseClaim',
  },
  {
    name: 'Local Purchase',
    icon: 'cart-plus',
    screen: 'LocalPurchase',
  },
  {
    name: 'Attendance',
    icon: 'account-clock',
    screen: 'Attendance',
  },
  {
    name: 'Financial Transactions',
    icon: 'check-circle',
    screen: 'ApprovedRecordsScreen',
    params: {screenType: 'finance'},
  },
];

export default function FinanceScreen({navigation}) {
  const renderButton = ({item, index}) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 120}
      useNativeDriver
      style={styles.buttonWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate(item.screen, item.params || {})}
        style={styles.buttonContainer}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          iterationDelay={4000}
          style={styles.iconContainer}>
          <Icon name={item.icon} size={22} color="#FFFFFF" />
        </Animatable.View>
        <Text style={styles.buttonText}>{item.name}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Finance" />
      <FlatList
        data={buttons}
        renderItem={renderButton}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{paddingVertical: 20}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  buttonWrapper: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a1c22',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
  },
  iconContainer: {
    padding: 10,
    marginRight: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
