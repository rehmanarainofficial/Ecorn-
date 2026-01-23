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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SimpleHeader from '../../../../components/SimpleHeader';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  BG_CREAM: '#F3F4F6',
  WHITE: '#FFFFFF',
  TEXT_DARK: '#333333',
  GREY: '#9E9E9E',
  // Vibrancy Palette
  ORANGE: '#FF9500',
  GREEN: '#4CAF50',
  BLUE: '#2196F3',
  AMBER: '#FFC107',
  RED: '#F44336',
  PURPLE: '#9C27B0',
  TEAL: '#009688',
  INDIGO: '#3F51B5',
};

const CHART_COLORS = [
  COLORS.ORANGE,
  COLORS.GREEN,
  COLORS.BLUE,
  COLORS.AMBER,
  COLORS.RED,
  COLORS.PURPLE,
  COLORS.TEAL,
  COLORS.INDIGO,
];

const SellingExpenseDetail = ({route, navigation}) => {
  const {from_date, to_date, account_type, title, total} = route.params || {};

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartSeries, setChartSeries] = useState([
    {value: 1, color: COLORS.GREY},
  ]);
  const [currentTotal, setCurrentTotal] = useState(total);

  // Date Filter State
  const [startDate, setStartDate] = useState(from_date ? new Date(from_date) : new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(to_date ? new Date(to_date) : new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateMode, setDateMode] = useState('start');

  const formatDisplayDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForApi = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchData(startDate, endDate);
  }, []);

  const fetchData = async (fromDt = startDate, toDt = endDate) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('from_date', formatDateForApi(fromDt));
      formData.append('to_date', formatDateForApi(toDt));
      formData.append('account_type', account_type);

      console.log('Fetching Selling Data:', {from_date: formatDateForApi(fromDt), to_date: formatDateForApi(toDt), account_type});

      const res = await axios.post(
        `${BASEURL}parent_expense_detail.php`,
        formData,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );

      if (res.data?.status === 'true' && Array.isArray(res.data?.data)) {
        const apiData = res.data.data;
        setData(apiData);

        // Calculate total and Prepare Chart Data
        let calculatedTotal = 0;
        const series = [];

        apiData.forEach((item, index) => {
          const val = parseFloat(item.t_amount) || 0;
          calculatedTotal += Math.abs(val);
          if (val > 0) {
            series.push({
              value: val,
              color: CHART_COLORS[index % CHART_COLORS.length],
            });
          }
        });

        setCurrentTotal(calculatedTotal);
        if (series.length > 0) {
          setChartSeries(series);
        }
      }
    } catch (error) {
      console.error('Error fetching selling details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchData(startDate, endDate);
  };

  const renderItem = ({item, index}) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    return (
      <View style={styles.card}>
        <View style={[styles.colorIndicator, {backgroundColor: color}]} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {item.account_name?.replace(/&amp;/g, '&')}
          </Text>
          <Text style={styles.cardAmount}>
            Rs. {formatNumber(item.t_amount)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title={title || 'Selling & Marketing'} />

      {/* Date Filter Section */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter:</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDateMode('start');
              setDatePickerVisibility(true);
            }}>
            <Text style={styles.dateText}>{formatDisplayDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.toText}>to</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDateMode('end');
              setDatePickerVisibility(true);
            }}>
            <Text style={styles.dateText}>{formatDisplayDate(endDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter}>
            <Ionicons name="search" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
              setEndDate(new Date());
              fetchData(new Date(new Date().setDate(new Date().getDate() - 30)), new Date());
            }}>
            <Ionicons name="close-circle" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={date => {
          if (dateMode === 'start') {
            setStartDate(date);
          } else {
            setEndDate(date);
          }
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.ORANGE} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Chart Section */}
          <View style={styles.chartContainer}>
            <PieChart
              widthAndHeight={220}
              series={chartSeries}
              cover={{radius: 0.65, color: COLORS.BG_CREAM}}
            />
            {/* Center Text (Total) */}
            <View style={styles.centerTextContainer}>
              <Text style={styles.centerLabel}>Total</Text>
              <Text style={styles.centerValue}>{formatNumber(currentTotal)}</Text>
            </View>
          </View>

          {/* List Section */}
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No data available for the selected period.
                </Text>
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
  filterContainer: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  filterLabel: {
    color: COLORS.TEXT_DARK,
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    color: COLORS.TEXT_DARK,
    fontSize: 14,
  },
  toText: {
    marginHorizontal: 10,
    color: COLORS.TEXT_DARK,
  },
  applyBtn: {
    backgroundColor: '#1a1c22',
    width: 40,
    height: 36,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: '#dc3545',
    width: 40,
    height: 36,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
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

export default SellingExpenseDetail;
