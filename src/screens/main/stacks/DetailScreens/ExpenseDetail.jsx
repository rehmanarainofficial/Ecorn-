import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import SimpleHeader from '../../../../components/SimpleHeader';
import PlatformGradient from '../../../../components/PlatformGradient';
import PieChart from 'react-native-pie-chart';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

const ExpenseDetail = ({navigation}) => {
  const widthAndHeight = 250;

  // Data for the three categories
  const expenses = [
    {
      id: 1,
      title: 'Payroll Expense',
      amount: '45,000',
      color: '#4CAF50', // Green
      icon: 'account-group',
    },
    {
      id: 2,
      title: 'Admin Expense',
      amount: '15,000',
      color: '#2196F3', // Blue
      icon: 'shield-account',
    },
    {
      id: 3,
      title: 'Selling & Marketing',
      amount: '25,000',
      color: '#FF9800', // Orange
      icon: 'bullhorn',
    },
  ];

  // Prepare series for PieChart (v4 API)
  const series = expenses.map(item => ({
    value: parseInt(item.amount.replace(/,/g, ''), 10),
    color: item.color,
  }));

  // Calculate Total for display in center (optional, or just for context)
  const totalExpense = expenses.reduce(
    (acc, item) => acc + parseInt(item.amount.replace(/,/g, ''), 10),
    0,
  );

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={styles.container}>
      <SimpleHeader title="Expense Detail" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Graphical Representation (Mixup) */}
        <Text style={styles.sectionTitle}>Expense Overview</Text>
        <View style={styles.chartContainer}>
          <PieChart
            widthAndHeight={widthAndHeight}
            series={series}
            cover={{radius: 0.6, color: 'transparent'}} // Doughnut style
          />
          {/* Centered Total Text Overlaid */}
          <View style={styles.centeredTextContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatNumber(totalExpense)}</Text>
          </View>
        </View>

        {/* Detailed List with Icons */}
        <View style={styles.listContainer}>
          {expenses.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => {
                if (item.title === 'Payroll Expense')
                  navigation.navigate('PayrollExpenseDetail');
                else if (item.title === 'Admin Expense')
                  navigation.navigate('AdminExpenseDetail');
                else if (item.title === 'Selling & Marketing')
                  navigation.navigate('SellingExpenseDetail');
              }}>
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor: item.color + '20'},
                ]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={item.color}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardAmount}>{item.amount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </PlatformGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  centeredTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  totalAmount: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 15,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
});

export default ExpenseDetail;
