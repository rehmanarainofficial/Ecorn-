import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SimpleHeader from '../../../../components/SimpleHeader';
import PieChart from 'react-native-pie-chart';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatNumber} from '../../../../utils/NumberUtils';
import {BASEURL} from '../../../../utils/BaseUrl';

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

const ExpenseDetail = ({navigation, route}) => {
  const {from_date, to_date} = route?.params || {};
  const widthAndHeight = 250;

  // Date Filter State
  const [startDate, setStartDate] = useState(
    from_date
      ? new Date(from_date)
      : new Date(new Date().setDate(new Date().getDate() - 30)),
  );
  const [endDate, setEndDate] = useState(
    to_date ? new Date(to_date) : new Date(),
  );
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateMode, setDateMode] = useState('start');
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);

  const EXPENSE_ICONS = {
    'Payroll Expense': {icon: 'account-group', color: COLORS.GREEN},
    'Admin Expense': {icon: 'shield-account', color: COLORS.BLUE},
    'Selling & Marketing': {icon: 'bullhorn', color: COLORS.ORANGE},
  };

  const CHART_COLORS = [COLORS.GREEN, COLORS.BLUE, COLORS.ORANGE, COLORS.AMBER];

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
    fetchExpenseData(startDate, endDate);
  }, []);

  const fetchExpenseData = async (fromDt = startDate, toDt = endDate) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('from_date', formatDateForApi(fromDt));
      formData.append('to_date', formatDateForApi(toDt));

      const res = await axios.post(`${BASEURL}dashboard_view.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      if (res.data?.data_exp_det && Array.isArray(res.data.data_exp_det)) {
        const apiData = res.data.data_exp_det;

        // Map API data to expense format
        const mappedExpenses = apiData.map((item, index) => {
          const title = item.name?.replace(/&amp;/g, '&') || item.title;
          const iconData = EXPENSE_ICONS[title] || {
            icon: 'cash',
            color: CHART_COLORS[index % CHART_COLORS.length],
          };
          return {
            id: index + 1,
            title: title,
            amount: Math.abs(parseFloat(item.amount) || 0),
            color: iconData.color,
            icon: iconData.icon,
            account_type: item.account_type,
          };
        });

        setExpenseData(mappedExpenses);

        // Calculate total
        const total = mappedExpenses.reduce(
          (acc, item) => acc + item.amount,
          0,
        );
        setTotalExpense(total);
      }
    } catch (error) {
      console.error('Error fetching expense data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchExpenseData(startDate, endDate);
  };

  // Prepare series for PieChart
  const series = expenseData.map(item => ({
    value: item.amount > 0 ? item.amount : 1,
    color: item.color,
  }));

  return (
    <View style={[styles.container, {backgroundColor: COLORS.BG_CREAM}]}>
      <SimpleHeader title="Expense Detail" />

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
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setStartDate(
                new Date(new Date().setDate(new Date().getDate() - 30)),
              );
              setEndDate(new Date());
              fetchExpenseData(
                new Date(new Date().setDate(new Date().getDate() - 30)),
                new Date(),
              );
            }}>
            <Ionicons name="close-circle" size={18} color="#fff" />
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.ORANGE} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Graphical Representation (Mixup) */}
          <Text style={styles.sectionTitle}>Expense Overview</Text>
          {expenseData.length > 0 && series.length > 0 && (
            <View style={styles.chartContainer}>
              <PieChart
                widthAndHeight={widthAndHeight}
                series={series}
                cover={{radius: 0.6, color: COLORS.BG_CREAM}}
              />
              {/* Centered Total Text Overlaid */}
              <View style={styles.centeredTextContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {formatNumber(totalExpense, 0)}
                </Text>
              </View>
            </View>
          )}

          {/* Detailed List with Icons */}
          <View style={styles.listContainer}>
            {expenseData.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => {
                  if (item.title === 'Payroll Expense')
                    navigation.navigate('PayrollExpenseDetail', {
                      from_date: formatDateForApi(startDate),
                      to_date: formatDateForApi(endDate),
                    });
                  else if (item.title === 'Admin Expense')
                    navigation.navigate('AdminExpenseDetail', {
                      from_date: formatDateForApi(startDate),
                      to_date: formatDateForApi(endDate),
                    });
                  else if (item.title === 'Selling & Marketing')
                    navigation.navigate('SellingExpenseDetail', {
                      from_date: formatDateForApi(startDate),
                      to_date: formatDateForApi(endDate),
                    });
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
                  <Text style={[styles.cardTitle, {flex: 1}]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text
                    style={styles.cardAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}>
                    {formatNumber(item.amount, 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
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
    color: 'rgba(0,0,0,0.5)',
    fontSize: 14,
  },
  totalAmount: {
    color: COLORS.TEXT_DARK,
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
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

export default ExpenseDetail;
