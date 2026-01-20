import {
  View,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import SimpleHeader from '../../../../components/SimpleHeader';
import RevenueCards from '../../../../components/RevenueCards';
import {responsiveHeight, responsiveWidth} from '../../../../utils/Responsive';
import {BASEURL} from '../../../../utils/BaseUrl';
import axios from 'axios';
import TopTen from '../../../../components/TopTen';
import {useSelector} from 'react-redux';
import PlatformGradient from '../../../../components/PlatformGradient';

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
      title: 'Cash',
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
    {
      id: 8,
      title: 'Receivable',
      accessKey: 'receivable',
      Amount: slider_data?.cur_m_receivable,
      Prev_title: 'Previous Month',
      Prev_Amount: slider_data?.pre_m_receivable,
      isUp:
        parseFloat(slider_data?.cur_m_receivable || 0) >
        parseFloat(slider_data?.pre_m_receivable || 0),
    },
    {
      id: 9,
      title: 'Payable',
      accessKey: 'payable',
      Amount: slider_data?.cur_m_payable,
      Prev_title: 'Previous Month',
      Prev_Amount: slider_data?.pre_m_payable,
      isUp:
        parseFloat(slider_data?.cur_m_payable || 0) >
        parseFloat(slider_data?.pre_m_payable || 0),
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
      console.error('❌ [DEBUG] API Error:', error);
      setLoader(false);
    }
  };

  const renderRow = ({item}) => (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>
        {(item.name || item.title)?.replace(/&amp;/g, '&')}
      </Text>
      <Text style={styles.rowAmount}>
        {parseFloat(item.total || item.amount).toLocaleString()}
      </Text>
    </View>
  );

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
        <View style={styles.box}>
          <Text style={styles.boxHeader}>Income</Text>
          <FlatList
            data={incomeData}
            keyExtractor={item => item.id}
            renderItem={renderRow}
            scrollEnabled={false}
          />
        </View>

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
            {filteredData.length === 4 && (
              <View style={styles.simpleGrid}>
                {/* Row 1 */}
                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <RevenueCards
                      title={filteredData[0]?.title}
                      amount={filteredData[0]?.Amount || 0}
                      prev_title={filteredData[0]?.Prev_title}
                      prev_amount={filteredData[0]?.Prev_Amount || 0}
                      gradientTopColor={cardColors.topColor}
                      gradientBottomColor={cardColors.bottomColor}
                      IsUp={filteredData[0]?.isUp}
                      onPress={() =>
                        navigation.navigate('MoreDetail', {
                          slider_data: AllData,
                          type: filteredData[0]?.accessKey,
                        })
                      }
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <RevenueCards
                      title={filteredData[1]?.title}
                      amount={filteredData[1]?.Amount || 0}
                      prev_title={filteredData[1]?.Prev_title}
                      prev_amount={filteredData[1]?.Prev_Amount || 0}
                      gradientTopColor={cardColors.topColor}
                      gradientBottomColor={cardColors.bottomColor}
                      IsUp={filteredData[1]?.isUp}
                      onPress={() =>
                        navigation.navigate('MoreDetail', {
                          slider_data: AllData,
                          type: filteredData[1]?.accessKey,
                        })
                      }
                    />
                  </View>
                </View>

                {/* Row 2 */}
                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <RevenueCards
                      title={filteredData[2]?.title}
                      amount={filteredData[2]?.Amount || 0}
                      prev_title={filteredData[2]?.Prev_title}
                      prev_amount={filteredData[2]?.Prev_Amount || 0}
                      gradientTopColor={cardColors.topColor}
                      gradientBottomColor={cardColors.bottomColor}
                      IsUp={filteredData[2]?.isUp}
                      onPress={() =>
                        navigation.navigate('MoreDetail', {
                          slider_data: AllData,
                          type: filteredData[2]?.accessKey,
                        })
                      }
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <RevenueCards
                      title={filteredData[3]?.title}
                      amount={filteredData[3]?.Amount || 0}
                      prev_title={filteredData[3]?.Prev_title}
                      prev_amount={filteredData[3]?.Prev_Amount || 0}
                      gradientTopColor={cardColors.topColor}
                      gradientBottomColor={cardColors.bottomColor}
                      IsUp={filteredData[3]?.isUp}
                      onPress={() =>
                        navigation.navigate('MoreDetail', {
                          slider_data: AllData,
                          type: filteredData[3]?.accessKey,
                        })
                      }
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noCardsContainer}>
            <Text style={styles.noCardsText}>No financial cards available</Text>
          </View>
        )}

        {/* Bottom Sections */}
        <View style={{padding: 20}}>
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
});
