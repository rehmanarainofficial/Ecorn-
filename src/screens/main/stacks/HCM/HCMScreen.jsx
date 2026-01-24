import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';

const COLORS = {
  WHITE: '#FFFFFF',
  PRIMARY: '#1a1c22',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
};

const buttons = [
  {name: 'Employees', icon: 'account-group', screen: 'EmployeesScreen', color: '#3B82F6'},
  {name: 'Attendance', icon: 'calendar-check', screen: 'Attendance', color: '#10B981'},
  {name: 'Leave Request', icon: 'calendar-remove', screen: 'LeaveRequestScreen', color: '#F59E0B'},
  {name: 'Payroll', icon: 'cash-multiple', screen: 'PayrollScreen', color: '#8B5CF6'},
  {name: 'Expense Claim', icon: 'file-document-edit', screen: 'ExpenseClaimInquiry', color: '#EF4444'},
];

export default function HCMScreen({navigation}) {
  const renderButton = ({item, index}) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 120}
      useNativeDriver
      style={styles.buttonWrapper}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate(item.screen)}
        style={styles.buttonContainer}>
        <View style={[styles.iconContainer, {backgroundColor: item.color}]}>
          <Icon name={item.icon} size={24} color={COLORS.WHITE} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.buttonText}>{item.name}</Text>
          <Text style={styles.buttonSubtext}>Manage {item.name.toLowerCase()}</Text>
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.TextMuted} />
      </TouchableOpacity>
    </Animatable.View>
  );

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
