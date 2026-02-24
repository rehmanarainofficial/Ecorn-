import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';
import {useSelector} from 'react-redux';

const buttons = [
  {
    name: 'Add Suppliers',
    icon: 'account-multiple-plus',
    screen: 'AddSuppliersScreen',
    accessKey: 'add_supplier',
  },
  {
    name: 'GRN against PO',
    icon: 'file-clock',
    screen: 'GrnAgainst',
    accessKey: 'grn',
  },
  {
    name: 'Post Dated Cheque Detail',
    icon: 'file-chart',
    screen: 'PdcDetailScreen',
    accessKey: 'post_dated_cheque',
  },
  {
    name: 'Payable Summary',
    icon: 'cash-multiple',
    screen: 'PayableSummary',
    accessKey: 'payable',
  },
  {
    name: 'Purchase Transactions',
    icon: 'check-circle',
    screen: 'ApprovedRecordsScreen',
    params: {screenType: 'purchase'},
    accessKey: 'purchase_transction',
  },
];

export default function PurchaseScreen({navigation}) {
  const mobileAccessData = useSelector(state => state.Data.mobileAccessData);

  const renderButton = ({item, index}) => {
    const isDisabled = mobileAccessData?.[0]?.[item.accessKey] === '1';

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 120}
        useNativeDriver
        style={[styles.buttonWrapper, {opacity: isDisabled ? 0.5 : 1}]}>
        <TouchableOpacity
          activeOpacity={isDisabled ? 1 : 0.85}
          disabled={isDisabled}
          onPress={() => navigation.navigate(item.screen, item.params || {})}
          style={styles.buttonContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            iterationDelay={4000}
            style={styles.iconContainer}>
            <Icon name={item.icon} size={22} color="#FFFFFF" />
          </Animatable.View>
          <View style={{flex: 1}}>
            <Text style={styles.buttonText}>{item.name}</Text>
            {isDisabled && (
              <Text style={{color: '#94A3B8', fontSize: 10}}>
                Access Restricted
              </Text>
            )}
          </View>
          {isDisabled && <Icon name="lock" size={16} color="#94A3B8" />}
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Purchase" />
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
