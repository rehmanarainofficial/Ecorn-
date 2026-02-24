import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {useSelector} from 'react-redux';

const COLORS = {
  WHITE: '#FFFFFF',
  PRIMARY: '#1a1c22',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
};

export default function HCMScreen({navigation}) {
  const mobileAccessData = useSelector(state => state.Data.mobileAccessData);

  const buttons = [
    {
      name: 'Attendance',
      icon: 'calendar-check',
      screen: 'Attendance',
      color: '#10B981',
      accessKey: 'hcm_attendence',
    },
    {
      name: 'Expense Claim',
      icon: 'file-document-edit',
      screen: 'ExpenseClaimInquiry',
      color: '#EF4444',
      accessKey: 'hcm_expense_claim',
    },
    {
      name: 'DVR Inquiry',
      icon: 'card-search-outline',
      screen: 'DVRInquiry',
      color: '#6366F1',
      accessKey: 'hcm_dvr_inquiry',
    },
    {
      name: 'Local Purchase',
      icon: 'cart-plus',
      screen: 'LocalPurchase',
      color: '#10B981',
      accessKey: 'hcm_local_purchase',
    },
  ];

  const renderButton = ({item, index}) => {
    const isDisabled = mobileAccessData?.[0]?.[item.accessKey] === '1';

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 120}
        useNativeDriver
        style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={isDisabled ? 1 : 0.7}
          disabled={isDisabled}
          onPress={() => (isDisabled ? null : navigation.navigate(item.screen))}
          style={[styles.buttonContainer, {opacity: isDisabled ? 0.5 : 1}]}>
          <View style={[styles.iconContainer, {backgroundColor: item.color}]}>
            <Icon name={item.icon} size={24} color={COLORS.WHITE} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.buttonText}>{item.name}</Text>
            <Text style={styles.buttonSubtext}>
              {isDisabled
                ? 'Access Restricted'
                : `Manage ${item.name.toLowerCase()}`}
            </Text>
          </View>
          {isDisabled ? (
            <Icon name="lock" size={24} color="#94A3B8" />
          ) : (
            <Icon name="chevron-right" size={24} color={COLORS.TextMuted} />
          )}
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="HCM" />
      <FlatList
        data={buttons}
        renderItem={renderButton}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  buttonWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    color: COLORS.TextDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonSubtext: {
    color: COLORS.TextMuted,
    fontSize: 13,
  },
});
