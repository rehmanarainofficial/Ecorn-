import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import SimpleHeader from '../../../../components/SimpleHeader';
import NameBalanceContainer from '../../../../components/NameBalanceContainer';
import CustomerPayableCard from '../../../../components/CustomerPayableCard';
import ViewAll from '../../../../components/ViewAll';
import {GetPayable} from '../../../../global/ChartApisCall';
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
  CardBg: '#FFFFFF',
};

const PayableScreen = ({navigation}) => {
  const [dataState, setDataState] = useState(null);
  const [viewAllData, setViewAllData] = useState([]);
  const [circleData, setCircleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const colors = [
    '#3B82F6',
    '#EF4444',
    '#F59E0B',
    '#10B981',
    '#8B5CF6',
    '#F97316',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
    '#6366F1',
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiResponse = await GetPayable();

      if (apiResponse?.data_supp_bal) {
        const circleBar = apiResponse.data_supp_bal.map((item, index) => {
          const value = parseFloat(item.Balance) || 0;
          return {
            value: value < 0 ? 5 : Math.abs(value),
            color: colors[index % colors.length],
          };
        });
        setCircleData(circleBar);
      }

      // Store view all data separately
      if (apiResponse?.data_supp_bal_view_all) {
        setViewAllData(apiResponse.data_supp_bal_view_all);
      }

      setDataState(apiResponse);
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const listData = dataState?.data_supp_bal || [];

  // Calculate total payable balance for all suppliers
  const totalBalance = viewAllData.reduce((sum, item) => {
    return sum + (parseFloat(item?.Balance) || 0);
  }, 0);

  return (
    <View style={styles.mainContainer}>
      <SimpleHeader title="Payable Balance" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.Primary} />
          <Text style={styles.loaderText}>Loading Payable Data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}>
          <View style={styles.container}>
            {/* Summary Section */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Payable</Text>
                <Text style={styles.summaryAmount}>
                  {formatNumber(totalBalance)}
                </Text>
                <Text style={styles.summarySubtitle}>
                  To {viewAllData.length} suppliers
                </Text>
              </View>

              {/* Top Suppliers */}
              {listData.length > 0 && (
                <View style={styles.legendContainer}>
                  <Text style={styles.legendTitle}>Top Suppliers:</Text>
                  {listData.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          {backgroundColor: colors[index % colors.length]},
                        ]}
                      />
                      <Text style={styles.legendText} numberOfLines={1}>
                        {item?.supp_name || 'Unknown Supplier'}
                      </Text>
                      <Text style={styles.legendBalance}>
                        {formatNumber(item?.Balance)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* List Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>
                Top {Math.min(listData.length, 10)} Payable Balances
              </Text>
              {viewAllData.length > 0 && (
                <ViewAll
                  onPress={() =>
                    navigation.navigate('NormalViewAll', {
                      AllData: viewAllData,
                      dataname: 'Suppliers',
                    })
                  }
                />
              )}
            </View>

            {/* List Section */}
            {listData.length > 0 ? (
              <View style={styles.listContainer}>
                <FlatList
                  data={listData.slice(0, 10)}
                  contentContainerStyle={styles.listContent}
                  scrollEnabled={false}
                  keyExtractor={(item, index) =>
                    `payable-${index}-${item.supp_name || 'supplier'}`
                  }
                  renderItem={({item, index}) => {
                    const balance = parseFloat(item?.Balance) || 0;
                    const total = listData.reduce(
                      (sum, i) => sum + (parseFloat(i?.Balance) || 0),
                      0,
                    );
                    const perc =
                      total !== 0
                        ? ((Math.abs(balance) / Math.abs(total)) * 100).toFixed(
                            2,
                          )
                        : 0;

                    return (
                      <CustomerPayableCard
                        name={item?.supp_name || 'Unknown Supplier'}
                        balance={balance}
                        accentColor={colors[index % colors.length]}
                        type="Suppliers"
                        item={item}
                      />
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No payable data available
                      </Text>
                    </View>
                  }
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No payable data found</Text>
                <Text style={styles.noDataSubtext}>
                  There are no outstanding payables at the moment.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default PayableScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  container: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: COLORS.TextDark,
    fontSize: 16,
  },
  summaryContainer: {
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.Border,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryTitle: {
    color: COLORS.TextDark,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#3B82F6',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: COLORS.TextMuted,
    fontSize: 14,
  },
  legendContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendTitle: {
    color: COLORS.TextDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: COLORS.TextDark,
    fontSize: 14,
    flex: 1,
  },
  legendBalance: {
    color: COLORS.TextMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TextDark,
  },
  listContainer: {
    marginTop: 4,
  },
  listContent: {
    gap: 10,
  },
  card: {
    backgroundColor: '#1a1c22',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a1c22',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    color: COLORS.TextMuted,
    fontSize: 15,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  noDataText: {
    color: COLORS.TextDark,
    fontSize: 18,
    fontWeight: '600',
  },
  noDataSubtext: {
    color: COLORS.TextMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
