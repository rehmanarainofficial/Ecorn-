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
import PlatformGradient from '../../../../components/PlatformGradient';
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
};

const MoreDetail = ({navigation, route}) => {
  const {type} = route.params;

  const [dataState, setDataState] = useState(null);
  const [circleData, setCircleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const colors = [
    '#00E0FF',
    '#FF6B6B',
    '#FFD93D',
    '#6BCB77',
    '#4D96FF',
    '#FFB347',
    '#9D4EDD',
    '#38BDF8',
    '#FF007F',
    '#FFAA00',
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
          console.log('❌ [MoreDetail DEBUG] Unknown type:', type);
          break;
      }

      setDataState(apiResponse);
      setCircleData(circleBar);
      setLoading(false);
    } catch (error) {
      console.error('❌ [MoreDetail DEBUG] API Error:', error);
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
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      <SimpleHeader title={getTitle()} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.loaderText}>Loading {getTitle()}...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}>
          <View style={styles.container}>
            {/* Summary Section - PieChart ki jagah */}
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
                      <Text style={styles.legendText}>
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
                  // In MoreDetail.jsx - Update the FlatList renderItem section
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
                          type={containerType} // Pass the type here
                          item={item} // Pass the complete item object
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
    </PlatformGradient>
  );
};

export default MoreDetail;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: COLORS.WHITE,
    fontSize: 16,
  },
  summaryContainer: {
    marginBottom: 20,
    gap: 15,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  summaryTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#00E0FF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  legendContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  legendTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  listContainer: {
    marginTop: 10,
  },
  listContent: {
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: COLORS.WHITE,
    fontSize: 16,
    opacity: 0.7,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    color: COLORS.WHITE,
    fontSize: 16,
    opacity: 0.7,
  },
});
