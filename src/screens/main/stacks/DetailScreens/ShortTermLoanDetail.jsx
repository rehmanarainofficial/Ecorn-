import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import PieChart from 'react-native-pie-chart';
import SimpleHeader from '../../../../components/SimpleHeader';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  BG_CREAM: '#F3F4F6',
  WHITE: '#FFFFFF',
  TEXT_DARK: '#333333',
  GREY: '#9E9E9E',
  ORANGE: '#FF9500',
  GREEN: '#4CAF50',
  BLUE: '#2196F3',
};

const ShortTermLoanDetail = ({route, navigation}) => {
  const {title} = route.params || {};

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [chartSeries, setChartSeries] = useState([
    {value: 1, color: COLORS.GREY},
  ]);

  const colors = [
    '#FF9500',
    '#4CAF50',
    '#2196F3',
    '#FFC107',
    '#F44336',
    '#9C27B0',
    '#009688',
    '#3F51B5',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching Short Term Loan Data');

      const res = await axios.get(
        'http://erconindustriespvt.com/mobile_dash/short_term_loan_detail.php',
      );

      if (res.data?.status === 'true' && Array.isArray(res.data?.data)) {
        const apiData = res.data.data;
        setData(apiData);

        // Calculate total balance
        const total = apiData.reduce((sum, item) => {
          return sum + (parseFloat(item.t_amount) || 0);
        }, 0);
        setTotalBalance(total);

        // Prepare Chart Data
        const series = [];
        apiData.forEach((item, index) => {
          const val = Math.abs(parseFloat(item.t_amount)) || 0;
          if (val > 0) {
            series.push({
              value: val,
              color: colors[index % colors.length],
            });
          }
        });

        if (series.length > 0) {
          setChartSeries(series);
        }
      }
    } catch (error) {
      console.error('Error fetching short term loan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item, index}) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          navigation.navigate('Ledger', {
            name: 'ShortTermLoan',
            item: item,
          });
        }}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.account_name}</Text>
          <Text style={styles.cardAmount}>
            Rs. {formatNumber(item.t_amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title={title || 'Short Term Loan'} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.ORANGE} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Chart Section */}
          {data.length > 0 && (
            <View style={styles.chartContainer}>
              <PieChart
                widthAndHeight={220}
                series={chartSeries}
                cover={{radius: 0.65, color: COLORS.BG_CREAM}}
              />
              <View style={styles.centerTextContainer}>
                <Text style={styles.centerLabel}>Total</Text>
                <Text style={styles.centerValue}>{formatNumber(totalBalance)}</Text>
              </View>
            </View>
          )}

          {/* List Section */}
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data available for the selected period.</Text>
              </View>
            }
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_CREAM,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  centerValue: {
    fontSize: 18,
    color: COLORS.TEXT_DARK,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    flex: 1,
    fontWeight: '500',
  },
  cardAmount: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: 'bold',
  },
});

export default ShortTermLoanDetail;
