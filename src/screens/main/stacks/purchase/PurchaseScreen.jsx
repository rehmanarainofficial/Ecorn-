import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import PlatformGradient from '../../../../components/PlatformGradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import * as Animatable from 'react-native-animatable';

const buttons = [
  {name: 'Add Suppliers', icon: 'account-multiple-plus', screen: 'AddSuppliersScreen'},
  {name: 'GRN AGAINST PO', icon: 'file-clock', screen: 'GrnAgainst'},
  {name: 'Post Dated Cheque Detail', icon: 'file-chart', screen: 'PdcDetailScreen'},
  {name: 'Payable Summary', icon: 'cash-multiple', screen: 'PayableSummary'},
];

export default function PurchaseScreen({navigation}) {
  const renderButton = ({item, index}) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 120}
      useNativeDriver
      style={styles.buttonWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate(item.screen)}>
        <PlatformGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          style={styles.buttonContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            iterationDelay={4000}
            style={styles.iconContainer}>
            <Icon name={item.icon} size={22} color="#fff" />
          </Animatable.View>
          <Text style={styles.buttonText}>{item.name}</Text>
        </PlatformGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <PlatformGradient
      colors={[APPCOLORS.BLACK, '#1c1c1c', APPCOLORS.WHITE]}
      style={styles.container}>
      <SimpleHeader title="Purchase" />
      <FlatList
        data={buttons}
        renderItem={renderButton}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{paddingVertical: 20}}
      />
    </PlatformGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonWrapper: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
