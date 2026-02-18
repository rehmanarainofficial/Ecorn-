import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import SimpleHeader from '../../../../components/SimpleHeader';
import PieChart from 'react-native-pie-chart';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#F3F4F6',
  BLACK: '#000000',
  BG_CREAM: '#F3F4F6',
  TEXT_DARK: '#333333',
  ORANGE: '#FF9500',
  GREEN: '#4CAF50',
  BLUE: '#2196F3',
  AMBER: '#FFC107',
};

const IncomeDetail = ({navigation}) => {
  const widthAndHeight = 250;

  // Data for Income Categories
  const incomeData = [
    {
      id: 1,
      title: 'Product Sales',
      amount: '123,000',
      color: COLORS.ORANGE,
      icon: 'cart-outline',
    },
    {
      id: 2,
      title: 'Service Revenue',
      amount: '321,000',
      color: COLORS.GREEN,
      icon: 'wrench-outline',
    },
    {
      id: 3,
      title: 'Investments',
      amount: '123,000',
      color: COLORS.BLUE,
      icon: 'chart-line',
    },
    {
      id: 4,
      title: 'Online Expenses',
      amount: '789,000',
      color: COLORS.AMBER,
      icon: 'web',
    },
    {
      id: 5,
      title: 'Other Income',
      amount: '537,000',
      color: '#4db6ac', // Teal variation if needed for 5th item
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
    <View style={[styles.container, {backgroundColor: COLORS.BG_CREAM}]}>
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
            <Text style={styles.totalAmount}>
              {formatNumber(totalIncome, 0)}
            </Text>
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
                <Text style={[styles.cardTitle, {flex: 1}]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text
                  style={styles.cardAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}>
                  {formatNumber(item.amount.replace(/,/g, ''), 0)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
    color: COLORS.TEXT_DARK,
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
    color: 'rgba(0,0,0,0.5)',
    fontSize: 14,
  },
  totalAmount: {
    color: COLORS.TEXT_DARK,
    fontSize: 20,
    fontWeight: 'bold',
  },
  legendContainer: {
    marginTop: 10,
    gap: 15,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
});

export default IncomeDetail;
