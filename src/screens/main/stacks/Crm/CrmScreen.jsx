import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';
import {useSelector} from 'react-redux';

const buttons = [
  {
    name: 'Add Lead',
    icon: 'account-plus',
    screen: 'AddLeadScreen',
    accessKey: 'add_lead',
  },
  {
    name: 'View Leads',
    icon: 'account-search',
    screen: 'ViewLeads',
    accessKey: 'view_lead',
  },
  {
    name: 'Schedule Meeting',
    icon: 'calendar-clock',
    screen: 'ScheduleMeetingScreen',
    accessKey: 'shedule_meeting',
  },
  {
    name: 'View Lead to Order',
    icon: 'cart-check',
    screen: 'LeadToOrderScreen',
    accessKey: 'view_lead_to_order',
  },
];

export default function CrmScreen({navigation}) {
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
          onPress={() => navigation.navigate(item.screen)}
          style={styles.buttonContainer}>
          <View style={styles.iconContainer}>
            <Icon name={item.icon} size={22} color="#fff" />
          </View>
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
      <SimpleHeader title="CRM" />
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#1a1c22',
  },
  iconContainer: {
    padding: 10,
    marginRight: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
