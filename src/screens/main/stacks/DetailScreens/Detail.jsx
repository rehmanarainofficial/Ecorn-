import {
  View,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useEffect, useState} from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import SimpleHeader from '../../../../components/SimpleHeader';
import RevenueCards from '../../../../components/RevenueCards';
import {responsiveHeight, responsiveWidth} from '../../../../utils/Responsive';
import {BASEURL} from '../../../../utils/BaseUrl';
import axios from 'axios';
import {useSelector} from 'react-redux';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
  AccentBlue: '#3B82F6',
};

const getCardColors = () => {
  return {
    topColor: COLORS.Primary,
    bottomColor: COLORS.Secondary,
  };
};

const Detail = ({navigation}) => {
  const accessData = useSelector(state => state?.Data?.accessData);

  const [slider_data, setslider_data] = useState();
  const [AllData, setAllData] = useState();
  const [expenseData, setExpenseData] = useState([]);
  const [loader, setLoader] = useState(false);
  // Date Filter State
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateMode, setDateMode] = useState('start');

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const incomeData = AllData?.data_income_det || [];

  const revData = [
    {
      id: 6,
      title: 'Short term loan',
      accessKey: 'cash',
      Amount: slider_data?.short_term_loan,
      Prev_title: 'Previous Month',
      Prev_Amount: slider_data?.pre_short_term_loan,
      isUp:
        parseFloat(slider_data?.short_term_loan || 0) >
        parseFloat(slider_data?.pre_short_term_loan || 0),
    },
    {
      id: 7,
      title: 'Bank',
      accessKey: 'bank',
      Amount: slider_data?.cur_m_bank,
      Prev_title: 'Previous Month',
      Prev_Amount: slider_data?.pre_m_bank,
      isUp:
        parseFloat(slider_data?.cur_m_bank || 0) >
        parseFloat(slider_data?.pre_m_bank || 0),
    },
  ];

  useEffect(() => {
    getMoneyData();
  }, []);

  const formatDateForApi = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMoneyData = async () => {
    setLoader(true);

    try {
      const formData = new FormData();
      formData.append('from_date', formatDateForApi(startDate));
      formData.append('to_date', formatDateForApi(endDate));

      const {data} = await axios.post(
        `${BASEURL}dashboard_view.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      console.log('data', data);
      setslider_data(data?.slider_data);
      setAllData(data);
      setExpenseData(data?.data_exp_det || []);
      setLoader(false);
    } catch (error) {
      console.error('API Error:', error);
      setLoader(false);
    }
  };

  const renderRow = ({item}) => {
    const title = (item.name || item.title)?.replace(/&amp;/g, '&');

    // Check if this row is one of the specific clickable ones
    let targetScreen = null;
    let isIncome = false;

    // Expense items
    // Income items logic
    if (item.account_type === '402' || title === 'Other Revenue') {
      targetScreen = 'OtherRevenueDetail';
      isIncome = true;
    } else if (item.account_type === '403' || title === 'Sales Revenue') {
      targetScreen = 'SalesRevenueDetail';
      isIncome = true;
    } else {
      // Expense items - Handle ALL expenses
      if (title === 'Payroll Expenses') {
        targetScreen = 'PayrollExpenseDetail';
      } else if (title === 'Selling & Marketing') {
        targetScreen = 'SellingExpenseDetail';
      } else {
        // Default catch-all for Administrative and other expenses
        targetScreen = 'AdminExpenseDetail';
      }
    }

    // Apply Math.abs() to income amounts to show positive values
    const amount = parseFloat(item.total || item.amount);
    const displayAmount = isIncome ? Math.abs(amount) : amount;

    const RowContent = (
      <View style={styles.row}>
        <Text style={styles.rowTitle}>{title}</Text>
        {item.qty !== undefined && (
          <Text style={[styles.cell, {flex: 1.5}]}>
            {formatNumber(item.qty)}
          </Text>
        )}
        <Text style={[styles.cell, {flex: item.qty !== undefined ? 2 : 1}]}>
          {formatNumber(displayAmount)}
        </Text>
      </View>
    );

    if (targetScreen) {
      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(targetScreen, {
              from_date: formatDateForApi(startDate),
              to_date: formatDateForApi(endDate),
              account_type: item.account_type,
              title: title,
              total: Math.abs(amount),
            })
          }>
          {RowContent}
        </TouchableOpacity>
      );
    }

    return RowContent;
  };

  // Filtered data - show all but identify restricted ones
  const filteredData = Array.isArray(accessData)
    ? revData
        .map(item => {
          // Rule: 0 is ENABLED, 1 is DISABLED
          const isDisabled = accessData?.[0]?.[item.accessKey] === '1';
          const hasAmount = parseFloat(item.Amount || 0) !== 0;
          return {
            ...item,
            isDisabled,
            hasAmount,
          };
        })
        .filter(item => item.hasAmount) // Still hide if amount is 0/missing
    : [];

  // Platform-specific colors for cards
  const cardColors = getCardColors();

  return (
    <View style={styles.container}>
      <SimpleHeader title="Dashboard" />

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
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDateMode('end');
              setDatePickerVisibility(true);
            }}>
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={getMoneyData}>
            <Ionicons name="search" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setStartDate(
                new Date(new Date().setDate(new Date().getDate() - 30)),
              );
              setEndDate(new Date());
              getMoneyData();
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

      {loader ? (
        <View
          style={{
            height: responsiveHeight(100),
            width: responsiveWidth(100),
            position: 'absolute',
            zIndex: 10,
            backgroundColor: COLORS.BLACK,
            opacity: 0.5,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator size={'large'} color={COLORS.WHITE} />
        </View>
      ) : null}

      {/* MAIN SCROLLVIEW ADDED */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}>
        {/* Income Section */}
        {/* Income Section */}
        <View style={styles.box}>
          <Text style={styles.boxHeader}>Income</Text>
          <FlatList
            data={incomeData}
            keyExtractor={(item, index) =>
              `income-${item.account_type || index}`
            }
            renderItem={renderRow}
            scrollEnabled={false}
          />
        </View>

        {/* Expense Section */}
        {/* Expense Section */}
        <View style={styles.box}>
          <Text style={styles.boxHeader}>Expense</Text>
          <FlatList
            data={expenseData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderRow}
            scrollEnabled={false}
          />
        </View>

        {/* Revenue Section - ACTUAL DATA */}
        {filteredData.length > 0 ? (
          <View style={styles.revenueSection}>
            <Text style={styles.sectionTitle}>Financial Overview</Text>

            {/* Alternative: Simple 2-column layout */}
            <View style={styles.gridContainer}>
              {filteredData.map((item, index) => (
                <View key={index} style={styles.cardWrapper}>
                  <RevenueCards
                    title={item.title}
                    amount={item.Amount || 0}
                    prev_title={item.Prev_title}
                    prev_amount={item.Prev_Amount || 0}
                    gradientTopColor={cardColors.topColor}
                    gradientBottomColor={cardColors.bottomColor}
                    IsUp={item.isUp}
                    onPress={
                      item.isDisabled
                        ? undefined
                        : () => {
                            if (item.title === 'Short term loan') {
                              navigation.navigate('ShortTermLoanDetail', {
                                title: item.title,
                              });
                            } else {
                              navigation.navigate('MoreDetail', {
                                slider_data: AllData,
                                type: item.accessKey,
                              });
                            }
                          }
                    }
                    disabled={item.isDisabled}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noCardsContainer}>
            <Text style={styles.noCardsText}>No financial cards available</Text>
          </View>
        )}

        {/* Security Rule Button */}
        <TouchableOpacity
          style={styles.securityBtn}
          onPress={() => navigation.navigate('SecurityRule')}>
          <Text style={styles.securityBtnText}>Security Rule</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Detail;

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  box: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boxHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowTitle: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  cell: {
    fontSize: 15,
    color: '#1E293B',
    textAlign: 'right',
    fontWeight: '600',
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  revenueSection: {
    marginTop: 20,
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 15,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    gap: 10,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 10,
    minHeight: 120,
  },
  noCardsContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noCardsText: {
    color: '#64748B',
    fontSize: 15,
  },
  filterContainer: {
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 5,
    backgroundColor: COLORS.WHITE,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterLabel: {
    color: '#1E293B',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },
  applyBtn: {
    backgroundColor: '#1a1c22',
    width: 40,
    height: 40,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: '#dc3545',
    width: 40,
    height: 40,
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityBtn: {
    backgroundColor: '#1a1c22',
    marginHorizontal: 15,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
