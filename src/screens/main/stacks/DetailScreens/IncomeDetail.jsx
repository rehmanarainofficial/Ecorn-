import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
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

const IncomeDetail = ({navigation}) => {
  const widthAndHeight = 250;

  // Data for Income Categories
  const incomeData = [
    {
      id: 1,
      title: 'Product Sales',
      amount: '123,000',
      color: '#fbd203', // Yellow
      icon: 'cart-outline',
    },
    {
      id: 2,
      title: 'Service Revenue',
      amount: '321,000',
      color: '#ffb300', // Amber
      icon: 'wrench-outline',
    },
    {
      id: 3,
      title: 'Investments',
      amount: '123,000',
      color: '#ff9100', // Orange
      icon: 'chart-line',
    },
    {
      id: 4,
      title: 'Online Expenses',
      amount: '789,000',
      color: '#ff6c00', // Deep Orange
      icon: 'web',
    },
    {
      id: 5,
      title: 'Other Income',
      amount: '537,000',
      color: '#ff3c00', // Red
      icon: 'cash-plus',
    },
  ];

  // Prepare series for PieChart (v4 API)
  const series = incomeData.map(item => ({
    value: parseInt(item.amount.replace(/,/g, ''), 10),
    color: item.color,
  }));

  // Calculate Total for display
  const totalIncome = incomeData.reduce(
    (acc, item) => acc + parseInt(item.amount.replace(/,/g, ''), 10),
    0,
  );

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={styles.container}>
      <SimpleHeader title="Income Detail" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Income Breakdown</Text>

        <View style={styles.chartContainer}>
          <PieChart
            widthAndHeight={widthAndHeight}
            series={series}
            cover={{radius: 0.6, color: 'transparent'}} // Doughnut style
          />
          {/* Centered Total Text Overlaid */}
          <View style={styles.centeredTextContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatNumber(totalIncome)}</Text>
          </View>
        </View>

        {/* Detailed List with Icons */}
        <View style={styles.legendContainer}>
          {incomeData.map(item => (
            <View key={item.id} style={styles.card}>
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
            </View>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
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
  legendContainer: {
    marginTop: 10,
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

export default IncomeDetail;
