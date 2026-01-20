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
import TopTen from '../../../../components/TopTen';
import {useSelector} from 'react-redux';
import PlatformGradient from '../../../../components/PlatformGradient';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

// iOS ke liye different colors, Android ke liye original
const getCardColors = () => {
  if (Platform.OS === 'ios') {
    return {
      topColor: '#2d2f3a', // iOS ke liye lighter color
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
  const [dateMode, setDateMode] = useState('start'); // 'start' or 'end'

  console.log('accessData', accessData);
  console.log('AllData', AllData);

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const incomeData = [
    {
      id: '1',
      title: 'Total Income',
      amount: Math.abs(slider_data?.cur_m_income || 0),
    },
  ];

  const revData = [
    {
      id: 6,
      title: 'Short term loan',
      accessKey: 'cash',
      Amount: slider_data?.cur_m_cash,
      Prev_title: 'Previous Month',
      Prev_Amount: slider_data?.pre_m_cash,
      isUp:
        parseFloat(slider_data?.cur_m_cash || 0) >
        parseFloat(slider_data?.pre_m_cash || 0),
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
    const unsubscribe = navigation.addListener('focus', () => {
      getMoneyData();
    });
    return unsubscribe;
  }, [navigation]);

  const getMoneyData = async () => {
    setLoader(true);

    try {
      const params = new URLSearchParams();
      params.append('current_date', '2025-05-19');
      params.append('pre_month_date', '2025-04-19');

      const {data} = await axios.post(
        `${BASEURL}dashboard_view.php`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

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
    if (title === 'Payroll Expenses') targetScreen = 'PayrollExpenseDetail';
    else if (title === 'Administrative Expenses')
      targetScreen = 'AdminExpenseDetail';
    else if (title === 'Selling & Marketing')
      targetScreen = 'SellingExpenseDetail';

    const RowContent = (
      <View style={styles.row}>
        <Text style={styles.rowTitle}>{title}</Text>
        {item.qty !== undefined && (
          <Text style={[styles.cell, {flex: 1.5}]}>
            {formatNumber(item.qty)}
          </Text>
        )}
        <Text style={[styles.cell, {flex: item.qty !== undefined ? 2 : 1}]}>
          {formatNumber(parseFloat(item.total || item.amount))}
        </Text>
      </View>
    );

    if (targetScreen) {
      return (
        <TouchableOpacity onPress={() => navigation.navigate(targetScreen)}>
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
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
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
        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate('IncomeDetail')}>
          <Text style={styles.boxHeader}>Income</Text>
          <FlatList
            data={incomeData}
            keyExtractor={item => item.id}
            renderItem={renderRow}
            scrollEnabled={false}
          />
        </TouchableOpacity>

        {/* Expense Section */}
        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate('ExpenseDetail')}>
          <Text style={styles.boxHeader}>Expense</Text>
          <FlatList
            data={expenseData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderRow}
            scrollEnabled={false}
          />
        </TouchableOpacity>

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
                    onPress={() =>
                      navigation.navigate('MoreDetail', {
                        slider_data: AllData,
                        type: item.accessKey,
                      })
                    }
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

        {/* Bottom Sections */}
        <View style={{paddingHorizontal: 20}}>
          <View style={{gap: 10}}>
            {accessData?.[0]?.profit_loss_d === '1' && (
              <TopTen
                onPress={() => navigation.navigate('ProfitAndLossScreen')}
                title="Profit and Loss"
              />
            )}

            {accessData?.[0]?.what_about === '1' && (
              <TopTen
                onPress={() =>
                  navigation.navigate('Ledger', {name: 'Audit', item: null})
                }
                title="What About Today"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </PlatformGradient>
  );
};

export default Detail;

let styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  box: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  boxHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: COLORS.WHITE,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  rowTitle: {fontSize: 16, color: 'rgba(255,255,255,0.85)'},
  rowAmount: {fontSize: 16, fontWeight: 'bold', color: COLORS.WHITE},

  revenueSection: {
    marginTop: 20,
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginLeft: 15,
    marginBottom: 10,
  },

  // Manual Grid Layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    gap: 10,
  },
  cardWrapper: {
    width: '48%', // 2 cards per row with gap
    marginBottom: 10,
    minHeight: 120,
  },
  leftCard: {
    marginRight: '1%',
  },
  rightCard: {
    marginLeft: '1%',
  },

  // Simple Grid Layout
  simpleGrid: {
    paddingHorizontal: 15,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridItem: {
    width: '48%',
  },

  noCardsContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  noCardsText: {
    color: COLORS.WHITE,
    fontSize: 16,
    opacity: 0.7,
  },
  filterContainer: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  filterLabel: {
    color: COLORS.WHITE,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.WHITE,
    fontSize: 14,
  },
  toText: {
    color: COLORS.WHITE,
    marginHorizontal: 10,
  },
});
