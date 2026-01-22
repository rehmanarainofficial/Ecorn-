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
};

const getCardColors = () => {
  if (Platform.OS === 'ios') {
    return {
      topColor: '#2d2f3a',
      bottomColor: '#3d3f4a',
    };
  }
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
      console.log("data", data);
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

  // Filtered data - ab actual data use karenge
  const filteredData = Array.isArray(accessData)
    ? revData.filter(item => {
        const hasAccess = accessData?.[0]?.[item.accessKey] === '1';
        const hasAmount = parseFloat(item.Amount || 0) !== 0;
        return hasAccess && hasAmount;
      })
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
          <Text style={styles.toText}>to</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDateMode('end');
              setDatePickerVisibility(true);
            }}>
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={getMoneyData}>
            <Text style={styles.applyBtnText}>Apply</Text>
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
                    onPress={() => {
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
                    }}
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

        {/* Bottom Sections
        <View style={{paddingHorizontal: 20}}>
          <View style={{gap: 10}}>
            {accessData?.[0]?.profit_loss_d === '1' && (
              <TopTen
                onPress={() => navigation.navigate('ProfitAndLossScreen')}
                title="Profit and Loss"
                backgroundColor="#1a1c22"
              />
            )}

            {accessData?.[0]?.what_about === '1' && (
              <TopTen
                onPress={() =>
                  navigation.navigate('Ledger', {name: 'Audit', item: null})
                }
                title="What About Today"
                backgroundColor="#1a1c22"
              />
            )}
          </View>
        </View> */}
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
    paddingBottom: 20,
  },
  box: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  boxHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: COLORS.BLACK,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  rowTitle: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  cell: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'right',
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  revenueSection: {
    marginTop: 20,
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.BLACK,
    marginLeft: 15,
    marginBottom: 10,
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
  },
  noCardsText: {
    color: COLORS.BLACK,
    fontSize: 16,
    opacity: 0.7,
  },
  filterContainer: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  filterLabel: {
    color: COLORS.BLACK,
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
    color: COLORS.BLACK,
    fontSize: 14,
  },
  toText: {
    marginHorizontal: 10,
    color: COLORS.BLACK,
  },
  applyBtn: {
    backgroundColor: COLORS.Primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
