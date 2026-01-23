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
import ViewAll from '../../../../components/ViewAll';
import PieChart from 'react-native-pie-chart';
import {
  GetReceivable,
  GetBankBalance,
  GetPayable,
} from '../../../../global/ChartApisCall';
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

const MoreDetail = ({navigation, route}) => {
  const {type} = route.params;

  const [dataState, setDataState] = useState(null);
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
      if (!dataState) {
        fetchData();
      }
    });
    return unsubscribe;
  }, [navigation, dataState]);

  const fetchData = async () => {
    setLoading(true);

    let apiResponse = null;
    let circleBar = null;

    try {
      switch (type) {
        case 'bank':
          apiResponse = await GetBankBalance();
          if (apiResponse?.data_bank_bal) {
            circleBar = apiResponse.data_bank_bal.map((item, index) => {
              const value = parseFloat(item.bank_balance) || 0;
              return {
                value: value < 0 ? 5 : Math.abs(value),
                color: colors[index % colors.length],
              };
            });
          }
          break;

        case 'payable':
          apiResponse = await GetPayable();
          if (apiResponse?.data_supp_bal) {
            circleBar = apiResponse.data_supp_bal.map((item, index) => {
              const value = parseFloat(item.Balance) || 0;
              return {
                value: value < 0 ? 5 : Math.abs(value),
                color: colors[index % colors.length],
              };
            });
          }
          break;

        case 'receivable':
          apiResponse = await GetReceivable();
          if (apiResponse?.data_cust_bal) {
            circleBar = apiResponse.data_cust_bal.map((item, index) => {
              const value = parseFloat(item.Balance) || 0;
              return {
                value: value < 0 ? 5 : Math.abs(value),
                color: colors[index % colors.length],
              };
            });
          }
          break;

        case 'cash':
          apiResponse = await GetBankBalance();
          if (apiResponse?.data_bank_bal) {
            circleBar = apiResponse.data_bank_bal.map((item, index) => {
              const value = parseFloat(item.bank_balance) || 0;
              return {
                value: value < 0 ? 5 : Math.abs(value),
                color: colors[index % colors.length],
              };
            });
          }
          break;

        default:
          break;
      }

      setDataState(apiResponse);
      setCircleData(circleBar);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'bank':
        return 'Bank Balance';
      case 'payable':
        return 'Payable Balance';
      case 'receivable':
        return 'Receivable Balance';
      case 'cash':
        return 'Cash Balance';
      default:
        return 'Details';
    }
  };

  const getListData = () => {
    switch (type) {
      case 'bank':
        return dataState?.data_bank_bal || [];
      case 'payable':
        return dataState?.data_supp_bal || [];
      case 'receivable':
        return dataState?.data_cust_bal || [];
      case 'cash':
        return dataState?.data_bank_bal || [];
      default:
        return [];
    }
  };

  const getListAllData = () => {
    switch (type) {
      case 'bank':
        return dataState?.data_bank_bal_view_all || [];
      case 'payable':
        return dataState?.data_supp_bal_view_all || [];
      case 'receivable':
        return dataState?.data_view_cust_bal || [];
      case 'cash':
        return dataState?.data_bank_bal_view_all || [];
      default:
        return [];
    }
  };

  const listData = getListData();
  const listAllData = getListAllData();

  // Calculate total balance
  const totalBalance = listData.reduce((sum, item) => {
    const balance =
      type === 'bank' || type === 'cash'
        ? parseFloat(item?.bank_balance) || 0
        : parseFloat(item?.Balance) || 0;
    return sum + balance;
  }, 0);

  return (
    <View style={styles.mainContainer}>
      <SimpleHeader title={getTitle()} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.Primary} />
          <Text style={styles.loaderText}>Loading {getTitle()}...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}>
          <View style={styles.container}>
            {/* Chart Section */}
            {circleData && circleData.length > 0 && (
              <View style={styles.chartCard}>
                <View style={styles.chartContainer}>
                  <PieChart
                    widthAndHeight={200}
                    series={circleData}
                    cover={{radius: 0.65, color: COLORS.WHITE}}
                  />
                  <View style={styles.centerTextContainer}>
                    <Text style={styles.centerValue}>
                      {formatNumber(totalBalance)}
                    </Text>
                    <Text style={styles.centerLabel}>Total</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{getTitle()}</Text>
                <Text style={styles.summaryAmount}>
                  {formatNumber(totalBalance)}
                </Text>
                <Text style={styles.summarySubtitle}>
                  Total from {listData.length} accounts
                </Text>
              </View>

              {/* Color Legend */}
              {circleData && circleData.length > 0 && (
                <View style={styles.legendContainer}>
                  <Text style={styles.legendTitle}>Top Accounts:</Text>
                  {listData.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          {backgroundColor: colors[index % colors.length]},
                        ]}
                      />
                      <Text style={styles.legendText} numberOfLines={1}>
                        {item.bank_name || item.supp_name || item.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* List Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>{`Top ${Math.min(
                listData.length,
                10,
              )} ${getTitle()}`}</Text>
              {listAllData.length > 0 && (
                <ViewAll
                  onPress={() => {
                    navigation.navigate('NormalViewAll', {
                      AllData: listAllData,
                      dataname:
                        type === 'bank'
                          ? 'Bank'
                          : type === 'cash'
                          ? 'Bank'
                          : type === 'payable'
                          ? 'Payable'
                          : type === 'receivable'
                          ? 'Customer'
                          : 'Supplier',
                    });
                  }}
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
                    `${type}-${index}-${
                      item.bank_name || item.supp_name || item.name || 'item'
                    }`
                  }
                  renderItem={({item, index}) => {
                    const balance =
                      type === 'bank' || type === 'cash'
                        ? parseFloat(item?.bank_balance) || 0
                        : type === 'payable'
                        ? parseFloat(item?.Balance) || 0
                        : type === 'receivable'
                        ? parseFloat(item?.Balance) || 0
                        : 0;

                    const total = listData.reduce(
                      (sum, i) =>
                        sum +
                        (type === 'bank' || type === 'cash'
                          ? parseFloat(i?.bank_balance) || 0
                          : type === 'payable'
                          ? parseFloat(i?.Balance) || 0
                          : type === 'receivable'
                          ? parseFloat(i?.Balance) || 0
                          : 0),
                      0,
                    );

                    const perc =
                      total !== 0
                        ? ((Math.abs(balance) / Math.abs(total)) * 100).toFixed(
                            2,
                          )
                        : 0;

                    // Determine the type for NameBalanceContainer
                    let containerType = '';
                    switch (type) {
                      case 'bank':
                      case 'cash':
                        containerType = 'Banks';
                        break;
                      case 'payable':
                        containerType = 'Suppliers';
                        break;
                      case 'receivable':
                        containerType = 'Customer';
                        break;
                      default:
                        containerType = '';
                    }

                    return (
                      <View
                        style={[
                          styles.card,
                          {
                            borderLeftColor: colors[index % colors.length],
                            borderLeftWidth: 4,
                          },
                        ]}>
                        <NameBalanceContainer
                          Name={
                            type === 'bank' || type === 'cash'
                              ? item?.bank_name || 'Unknown Bank'
                              : type === 'payable'
                              ? item?.supp_name || 'Unknown Supplier'
                              : type === 'receivable'
                              ? item?.name || 'Unknown Customer'
                              : 'Unknown'
                          }
                          balance={balance}
                          type={containerType}
                          item={item}
                          perc={perc}
                        />
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No data available</Text>
                    </View>
                  }
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No {getTitle()} data found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default MoreDetail;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  chartCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.Border,
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 13,
    color: COLORS.TextMuted,
    fontWeight: '600',
  },
  centerValue: {
    fontSize: 16,
    color: COLORS.TextDark,
    fontWeight: 'bold',
  },
  summaryContainer: {
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.Border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    color: COLORS.TextDark,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#3B82F6',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: COLORS.TextMuted,
    fontSize: 14,
  },
  legendContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    color: COLORS.TextDark,
    fontSize: 14,
    flex: 1,
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
    backgroundColor: COLORS.WHITE,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  emptyText: {
    color: COLORS.TextMuted,
    fontSize: 15,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  noDataText: {
    color: COLORS.TextMuted,
    fontSize: 15,
  },
});
