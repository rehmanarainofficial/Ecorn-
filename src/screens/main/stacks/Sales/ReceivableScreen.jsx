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
import {GetReceivable} from '../../../../global/ChartApisCall';
import PlatformGradient from '../../../../components/PlatformGradient';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

const ReceivableScreen = ({navigation}) => {
  const [dataState, setDataState] = useState(null);
  const [circleData, setCircleData] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🔍 [Receivable DEBUG] Screen loaded');

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
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    console.log('🔄 [Receivable DEBUG] Fetching receivable data...');
    setLoading(true);

    try {
      const apiResponse = await GetReceivable();
      console.log('✅ [Receivable DEBUG] API Response:', apiResponse);

      if (apiResponse?.data_cust_bal) {
        const circleBar = apiResponse.data_cust_bal.map((item, index) => {
          const value = parseFloat(item.Balance) || 0;
          return {
            value: value < 0 ? 5 : Math.abs(value),
            color: colors[index % colors.length],
          };
        });
        console.log('📊 [Receivable DEBUG] Circle Data:', circleBar);
        setCircleData(circleBar);
      }

      setDataState(apiResponse);
      setLoading(false);
    } catch (error) {
      console.error('❌ [Receivable DEBUG] API Error:', error);
      setLoading(false);
    }
  };

  const getListData = () => {
    const data = dataState?.data_cust_bal || [];
    console.log('📋 [Receivable DEBUG] List Data:', data);
    return data;
  };

  const listData = getListData();

  // Calculate total receivable balance
  const totalBalance = listData.reduce((sum, item) => {
    return sum + (parseFloat(item?.Balance) || 0);
  }, 0);

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      <SimpleHeader title="Receivable Balance" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.loaderText}>Loading Receivable Data...</Text>
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
                <Text style={styles.summaryTitle}>Total Receivable</Text>
                <Text style={styles.summaryAmount}>
                  {formatNumber(totalBalance)}
                </Text>
                <Text style={styles.summarySubtitle}>
                  From {listData.length} customers
                </Text>
              </View>

              {/* Top Customers Legend */}
              {listData.length > 0 && (
                <View style={styles.legendContainer}>
                  <Text style={styles.legendTitle}>Top Customers:</Text>
                  {listData.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          {backgroundColor: colors[index % colors.length]},
                        ]}
                      />
                      <Text style={styles.legendText} numberOfLines={1}>
                        {item?.name || 'Unknown Customer'}
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
                Top {Math.min(listData.length, 10)} Receivable Balances
              </Text>
              {listData.length > 0 && (
                <ViewAll
                  onPress={() => {
                    console.log('🔄 [Receivable DEBUG] View All Pressed');
                    navigation.navigate('NormalViewAll', {
                      AllData: listData,
                      dataname: 'Customer',
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
                    `receivable-${index}-${item.name || 'customer'}`
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

                    console.log(`📊 [Receivable DEBUG] Customer ${index}:`, {
                      name: item.name,
                      balance,
                      perc,
                    });

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
                          Name={item?.name || 'Unknown Customer'}
                          balance={balance}
                          perc={perc}
                          type="Customer"
                          item={item}
                        />
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No receivable data available
                      </Text>
                    </View>
                  }
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No receivable data found</Text>
                <Text style={styles.noDataSubtext}>
                  There are no outstanding receivables at the moment.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </PlatformGradient>
  );
};

export default ReceivableScreen;

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
    gap: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    flex: 1,
  },
  legendBalance: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
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
    gap: 10,
  },
  noDataText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  noDataSubtext: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
