import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {BASEURL} from '../../../../utils/BaseUrl';
import {downloadFile} from '../../../../components/DownloadFile'; // ✅ Import downloadFile component

export default function SaleOrder({navigation}) {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false); // ✅ Added downloading state

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [showPicker, setShowPicker] = useState({visible: false, type: null});
  const route = useRoute();

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchData();
        navigation.setParams({refresh: false});
      }
    }, [route.params?.refresh]),
  );

  // ✅ Optimized data fetching with caching
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASEURL}dash_upload_sale.php`,
        {timeout: 10000}, // ✅ 10 second timeout
      );

      let result = res.data?.data_cust_age || [];
      setAllData(result);

      if (result.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // ✅ Optimized sorting - no need to parse dates for all items if we just need last 30
      // Sort by date string directly (assuming format is YYYY-MM-DD)
      const sorted = result.sort((a, b) => {
        const dateA = a.tran_date?.split(' ')[0] || '';
        const dateB = b.tran_date?.split(' ')[0] || '';
        return dateB.localeCompare(dateA); // Descending order
      });

      // Take only last 30 records
      const last30 = sorted.slice(0, 30);
      setData(last30);
    } catch (error) {
      console.log('Error fetching data:', error);
    }
    setLoading(false);
  };

  // ✅ Download handler - Same as Voucher and PurchaseOrder screens
  const handleDownload = async (trans_no, type) => {
    if (downloading) return;

    setDownloading(true);
    try {
      await downloadFile(trans_no, type);
    } catch (error) {
      console.log('Download handler error:', error);
    }
    setDownloading(false);
  };

  const normalizeDate = date => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  };

  // ✅ Optimized filter function
  const applyFilter = () => {
    if (!fromDate && !toDate) {
      const sorted = allData.sort((a, b) => {
        const dateA = a.tran_date?.split(' ')[0] || '';
        const dateB = b.tran_date?.split(' ')[0] || '';
        return dateB.localeCompare(dateA);
      });
      setData(sorted.slice(0, 30));
      return;
    }

    const fromStr = fromDate ? normalizeDate(fromDate) : null;
    const toStr = toDate ? normalizeDate(toDate) : null;

    let filtered = allData.filter(item => {
      const apiDate = item.tran_date?.split(' ')[0];

      let afterFrom = true;
      let beforeTo = true;

      if (fromStr) afterFrom = apiDate >= fromStr;
      if (toStr) beforeTo = apiDate <= toStr;

      return afterFrom && beforeTo;
    });

    // Sort filtered results
    const sorted = filtered.sort((a, b) => {
      const dateA = a.tran_date?.split(' ')[0] || '';
      const dateB = b.tran_date?.split(' ')[0] || '';
      return dateB.localeCompare(dateA);
    });

    setData(sorted.slice(0, 30));
  };

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    const sorted = allData.sort((a, b) => {
      const dateA = a.tran_date?.split(' ')[0] || '';
      const dateB = b.tran_date?.split(' ')[0] || '';
      return dateB.localeCompare(dateA);
    });
    setData(sorted.slice(0, 30));
  };

  // ✅ Memoized formatAmount function
  const formatAmount = React.useCallback(value => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  }, []);

  // ✅ Memoized renderItem for better performance
  const renderItem = React.useCallback(
    ({item}) => (
      <View style={styles.row}>
        <Text style={[styles.cell, {flex: 1}]}>
          {item.reference?.slice(0, 6) + '..' || 'N/A'}
        </Text>
        <Text style={[styles.cell, {flex: 1.5}]}>{item.tran_date}</Text>
        <Text style={[styles.cell, {flex: 1.5}]}>
          {formatAmount(item.amount)}
        </Text>
        <View
          style={[
            styles.cell,
            {
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-around',
            },
          ]}>
          {/* Upload Icon */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UploadScreen', {
                transactionType: item.type,
                transactionNo: item.trans_no,
                fromScreen: 'SaleOrder',
              })
            }>
            <Icon name="paperclip" size={20} color="#00ff99" />
          </TouchableOpacity>

          {/* View PDF Icon */}
          <TouchableOpacity
            disabled={!item.upload_status}
            onPress={() =>
              navigation.navigate('PDFViewerScreen', {
                type: item.type,
                trans_no: item.trans_no,
              })
            }>
            <Icon
              name="eye"
              size={20}
              color={item.upload_status ? '#00aced' : 'gray'}
            />
          </TouchableOpacity>

          {/* Download Icon - Using same handler as Voucher screen */}
          <TouchableOpacity
            disabled={!item.upload_status || downloading}
            onPress={() => handleDownload(item.trans_no, item.type)}>
            {downloading ? (
              <ActivityIndicator size="small" color="#ffcc00" />
            ) : (
              <Icon
                name="download"
                size={20}
                color={item.upload_status ? '#ffcc00' : 'gray'}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    ),
    [downloading, formatAmount, navigation],
  );

  const keyExtractor = React.useCallback(
    (item, index) => `${item.trans_no}_${index}`,
    [],
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Sale Order" />

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, styles.primaryButton]}
          onPress={() => setShowPicker({visible: true, type: 'from'})}>
          <Icon name="calendar" size={18} color="#fff" />
          <Text style={styles.buttonText}>
            {fromDate ? fromDate.toLocaleDateString('en-GB') : 'From Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, styles.primaryButton]}
          onPress={() => setShowPicker({visible: true, type: 'to'})}>
          <Icon name="calendar" size={18} color="#fff" />
          <Text style={styles.buttonText}>
            {toDate ? toDate.toLocaleDateString('en-GB') : 'To Date'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          onPress={applyFilter}
          style={{flex: 1, marginRight: 6}}>
          <PlatformGradient
            colors={['#28a745', '#218838']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientButton}>
            <Icon name="filter-check" size={18} color="#fff" />
            <Text style={styles.buttonText}>Apply</Text>
          </PlatformGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearFilter}
          style={{flex: 1, marginLeft: 6}}>
          <PlatformGradient
            colors={['#dc3545', '#a71d2a']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientButton}>
            <Icon name="close-circle" size={18} color="#fff" />
            <Text style={styles.buttonText}>Clear</Text>
          </PlatformGradient>
        </TouchableOpacity>
      </View>

      {showPicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowPicker({visible: false, type: null});
            if (date) {
              if (showPicker.type === 'from') setFromDate(date);
              if (showPicker.type === 'to') setToDate(date);
            }
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={APPCOLORS.Secondary}
          style={{marginTop: 20}}
        />
      ) : data.length === 0 ? (
        <Text style={{color: '#fff', textAlign: 'center', marginTop: 20}}>
          No Data Found
        </Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          stickyHeaderIndices={[0]}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerText, {flex: 1}]}>
                Ref
              </Text>
              <Text style={[styles.cell, styles.headerText, {flex: 1.5}]}>
                Date
              </Text>
              <Text style={[styles.cell, styles.headerText, {flex: 1.5}]}>
                Amount
              </Text>
              <Text style={[styles.cell, styles.headerText, {flex: 1}]}>
                Action
              </Text>
            </View>
          }
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 50}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: APPCOLORS.Primary},
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APPCOLORS.Secondary,
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: APPCOLORS.Secondary,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerRow: {
    backgroundColor: APPCOLORS.BLACK,
  },
  cell: {
    color: '#fff',
    fontSize: 14,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: APPCOLORS.Secondary,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    marginHorizontal: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: {width: 1, height: 2},
  },
});
