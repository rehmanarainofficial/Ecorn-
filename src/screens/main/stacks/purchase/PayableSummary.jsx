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
import {GetPayable} from '../../../../global/ChartApisCall';
import PlatformGradient from '../../../../components/PlatformGradient';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

const PayableScreen = ({navigation}) => {
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

      setDataState(apiResponse);
    } catch (error) {
      console.error('❌ [Payable DEBUG] API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const listData = dataState?.data_supp_bal || [];

  const totalBalance = listData.reduce((sum, item) => {
    return sum + (parseFloat(item?.Balance) || 0);
  }, 0);

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      <SimpleHeader title="Payable Balance" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.loaderText}>Loading Payable Data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}>
          <View style={styles.container}>

            {/* 🔹 Summary Section */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Payable</Text>
                <Text style={styles.summaryAmount}>
                  {totalBalance.toLocaleString()}
                </Text>
                <Text style={styles.summarySubtitle}>
                  To {listData.length} suppliers
                </Text>
              </View>

              {/* 🔹 Top Suppliers */}
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
                        {parseFloat(item?.Balance || 0).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 🔹 List Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>
                Top {Math.min(listData.length, 10)} Payable Balances
              </Text>
              {listData.length > 0 && (
                <ViewAll
                  onPress={() =>
                    navigation.navigate('NormalViewAll', {
                      AllData: listData,
                      dataname: 'Supplier',
                    })
                  }
                />
              )}
            </View>

            {/* 🔹 List Section */}
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
                        ? ((Math.abs(balance) / Math.abs(total)) * 100).toFixed(2)
                        : 0;

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
                          Name={item?.supp_name || 'Unknown Supplier'}
                          balance={balance}
                          perc={perc}
                        />
                      </View>
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
    </PlatformGradient>
  );
};

export default PayableScreen;

const styles = StyleSheet.create({
  scrollView: {flex: 1},
  scrollContainer: {flexGrow: 1},
  container: {padding: 20},
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {color: COLORS.WHITE, fontSize: 16},
  summaryContainer: {marginBottom: 20, gap: 15},
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
  legendColor: {width: 12, height: 12, borderRadius: 6},
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
  sectionTitle: {fontSize: 18, fontWeight: '700', color: COLORS.WHITE},
  listContainer: {marginTop: 10},
  listContent: {gap: 10},
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyContainer: {alignItems: 'center', padding: 20},
  emptyText: {color: COLORS.WHITE, fontSize: 16, opacity: 0.7},
  noDataContainer: {alignItems: 'center', padding: 40, gap: 10},
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
