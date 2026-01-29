import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import Toast from 'react-native-toast-message';

import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatNumber, formatQuantity} from '../../../../utils/NumberUtils';
import SimpleHeader from '../../../../components/SimpleHeader';
import axios from 'axios';

const StockMovements = ({navigation}) => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const [fromDate, setFromDate] = useState(
    moment().subtract(1, 'month').format('YYYY-MM-DD'),
  );
  const [toDate, setToDate] = useState(moment().format('YYYY-MM-DD'));

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [movementData, setMovementData] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  // ------------------------------
  // TOAST MESSAGES
  // ------------------------------
  const showToast = (type, text1, text2 = '') => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'bottom',
      visibilityTime: 3000,
    });
  };

  // ------------------------------
  // FETCH LOCATIONS (GET)
  // ------------------------------
  const fetchLocations = async () => {
    try {
      setLocationLoading(true);
      const res = await fetch(`${BASEURL}locations.php`);
      const json = await res.json();

      if (json.status === 'true') {
        setLocations(json.data);
        setFilteredLocations(json.data);
      } else {
        showToast('error', 'Failed to load locations');
      }
    } catch (e) {
      console.log('Location error:', e);
      showToast('error', 'Error loading locations');
    } finally {
      setLocationLoading(false);
    }
  };

  // ------------------------------
  // FETCH STOCKS (GET)
  // ------------------------------
  const fetchStocks = async () => {
    try {
      setStockLoading(true);
      const res = await fetch(`${BASEURL}stock_master.php`);
      const json = await res.json();

      if (json.status === 'true') {
        setStocks(json.data);
        setFilteredStocks(json.data);
      } else {
        showToast('error', 'Failed to load stocks');
      }
    } catch (e) {
      console.log('Stock master error:', e);
      showToast('error', 'Error loading stocks');
    } finally {
      setStockLoading(false);
    }
  };

  // ------------------------------
  // SEARCH STOCKS
  // ------------------------------
  const searchStocks = query => {
    setStockSearchQuery(query);
    if (query.trim() === '') {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(
        stock =>
          stock.description?.toLowerCase().includes(query.toLowerCase()) ||
          stock.stock_id?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredStocks(filtered);
    }
  };

  // ------------------------------
  // SEARCH LOCATIONS
  // ------------------------------
  const searchLocations = query => {
    setLocationSearchQuery(query);
    if (query.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(
        location =>
          location.location_name?.toLowerCase().includes(query.toLowerCase()) ||
          location.loc_code?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredLocations(filtered);
    }
  };

  // ------------------------------
  // FETCH STOCK MOVEMENT (POST)
  // ------------------------------
  const fetchStockMovement = async () => {
    try {
      if (!selectedStock) {
        showToast('error', 'Please select a stock first');
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('stock_id', selectedStock);
      formData.append('from_date', fromDate);
      formData.append('to_date', toDate);
      formData.append('StockLocation', selectedLocation);

      const res = await axios.post(`${BASEURL}stock_movements.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      const json = res.data;

      if (json.status === 'true') {
        setMovementData(json.data || []);
        const opening = json.opening !== null ? parseFloat(json.opening) : 0;
        setOpeningBalance(opening);

        let closing = opening;
        if (json.data && json.data.length > 0) {
          const lastTransaction = json.data[json.data.length - 1];
          closing = parseFloat(lastTransaction.balance) || opening;
        }
        if (json.status === 'true') {
          setMovementData(json.data || []);
          const opening = json.opening !== null ? parseFloat(json.opening) : 0;
          setOpeningBalance(opening);

          let closing = opening;
          if (json.data && json.data.length > 0) {
            const lastTransaction = json.data[json.data.length - 1];
            closing = parseFloat(lastTransaction.balance) || opening;
          }
          setClosingBalance(closing);

          if (json.data.length === 0) {
            showToast('info', 'No movements found', 'Try different filters');
          } else {
            showToast('success', `${json.data.length} movements found`);
          }
        } else {
          setMovementData([]);
          setOpeningBalance(0);
          setClosingBalance(0);
          showToast(
            'info',
            'No data found',
            json.message || 'Try different dates',
          );
        }
      } else {
        setMovementData([]);
        setOpeningBalance(0);
        setClosingBalance(0);
        showToast('error', 'Server error', 'Please check API endpoint');
      }
    } catch (e) {
      console.log('Fetch error:', e);
      showToast('error', 'Network error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchStocks();
  }, []);

  // ------------------------------
  // RESET FILTERS
  // ------------------------------
  const handleReset = () => {
    setSelectedLocation('');
    setSelectedStock('');
    setFromDate(moment().subtract(1, 'month').format('YYYY-MM-DD'));
    setToDate(moment().format('YYYY-MM-DD'));
    setMovementData([]);
    setOpeningBalance(0);
    setClosingBalance(0);
    setStockSearchQuery('');
    setLocationSearchQuery('');
    setFilteredStocks(stocks);
    setFilteredLocations(locations);
    showToast('info', 'Filters reset');
  };

  // ------------------------------
  // FORMAT NUMBER WITH COMMAS
  // ------------------------------

  // ------------------------------
  // RENDER EACH TRANSACTION CARD
  // ------------------------------
  const renderCard = ({item: transaction, index}) => {
    const qty = parseFloat(transaction.qty || 0);
    const isPositive = qty > 0;

    const balance = parseFloat(transaction.balance) || 0;

    return (
      <View style={styles.card}>
        <Text style={styles.dateText}>
          {moment(transaction.tran_date).format('DD MMM YYYY')}
        </Text>

        <View style={styles.row}>
          <View style={{flex: 1}}>
            <Text style={styles.refText}>{transaction.reference}</Text>
            <Text style={styles.nameText}>{transaction.name}</Text>
            <Text style={styles.locationText}>{transaction.location}</Text>
          </View>

          <View style={styles.amountSection}>
            <Text
              style={[styles.qtyText, {color: isPositive ? 'green' : 'red'}]}>
              {isPositive ? '+' : ''}
              {formatQuantity(qty)}
            </Text>
            <Text style={styles.balanceText}>
              Balance: {formatNumber(balance)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <StatusBar backgroundColor={APPCOLORS.Primary} barStyle="light-content" />

      {/* ---------------- HEADER ---------------- */}
     <SimpleHeader title="Stock Movements" />

      {/* ---------------- FILTER SECTION ---------------- */}
      <View style={styles.filterBox}>
        {/* ROW 1 - STOCK DROPDOWN */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowStockModal(true)}
            disabled={stockLoading}>
            {stockLoading ? (
              <ActivityIndicator size="small" color={APPCOLORS.Primary} />
            ) : (
              <>
                <Text
                  style={
                    selectedStock ? styles.dropdownText : styles.placeholderText
                  }>
                  {selectedStock
                    ? stocks.find(x => x.stock_id === selectedStock)
                        ?.description || 'Select Stock'
                    : 'Select Stock'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ROW 2 - LOCATION DROPDOWN */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowLocationModal(true)}
            disabled={locationLoading}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={APPCOLORS.Primary} />
            ) : (
              <>
                <Text
                  style={
                    selectedLocation
                      ? styles.dropdownText
                      : styles.placeholderText
                  }>
                  {selectedLocation
                    ? locations.find(x => x.loc_code === selectedLocation)
                        ?.location_name
                    : 'All Locations'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ROW 3 - DATE PICKERS & APPLY BUTTON & CLEAR BUTTON */}
        <View style={styles.filterRow}>
          {/* From Date */}
          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setShowFromPicker(true)}>
            <Text style={styles.dateTextFilter}>{fromDate}</Text>
          </TouchableOpacity>

          {/* To Date */}
          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setShowToPicker(true)}>
            <Text style={styles.dateTextFilter}>{toDate}</Text>
          </TouchableOpacity>

          {/* Apply Button */}
          <TouchableOpacity
            style={[styles.applyBtn, {opacity: selectedStock ? 1 : 0.6}]}
            onPress={fetchStockMovement}
            disabled={loading || !selectedStock}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="search" size={20} color="white" />
            )}
          </TouchableOpacity>

          {/* Clear Button */}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleReset}>
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* BALANCE ROW */}
        {(movementData.length > 0 ||
          openingBalance !== 0 ||
          closingBalance !== 0) && (
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Opening Balance</Text>
              <Text style={styles.balanceValue}>
                {formatNumber(openingBalance)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Closing Balance</Text>
              <Text style={styles.balanceValue}>
                {formatNumber(closingBalance)}
              </Text>
            </View>
          </View>
        )}

        {/* STOCK MODAL WITH SEARCH */}
        <Modal
          visible={showStockModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowStockModal(false);
            setStockSearchQuery('');
            setFilteredStocks(stocks);
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Stock</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowStockModal(false);
                    setStockSearchQuery('');
                    setFilteredStocks(stocks);
                  }}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by stock ID or description..."
                  value={stockSearchQuery}
                  onChangeText={searchStocks}
                  autoFocus={true}
                />
                {stockSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => searchStocks('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.resultCount}>
                {filteredStocks.length} of {stocks.length} stocks found
              </Text>

              {stockLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={APPCOLORS.Primary} />
                  <Text style={styles.loadingText}>Loading stocks...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredStocks}
                  keyExtractor={(item, index) => `${item.stock_id}-${index}`}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        selectedStock === item.stock_id && styles.selectedItem,
                      ]}
                      onPress={() => {
                        setSelectedStock(item.stock_id);
                        setShowStockModal(false);
                        setStockSearchQuery('');
                        setFilteredStocks(stocks);
                      }}>
                      <View style={styles.stockItem}>
                        <Text style={styles.stockId}>{item.stock_id}</Text>
                        <Text style={styles.modalItemText}>
                          {item.description}
                        </Text>
                      </View>
                      {selectedStock === item.stock_id && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={APPCOLORS.Primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  initialNumToRender={20}
                  maxToRenderPerBatch={20}
                  windowSize={10}
                  removeClippedSubviews={true}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* LOCATION MODAL WITH SEARCH */}
        <Modal
          visible={showLocationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowLocationModal(false);
            setLocationSearchQuery('');
            setFilteredLocations(locations);
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowLocationModal(false);
                    setLocationSearchQuery('');
                    setFilteredLocations(locations);
                  }}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by location name or code..."
                  value={locationSearchQuery}
                  onChangeText={searchLocations}
                  autoFocus={true}
                />
                {locationSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => searchLocations('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.resultCount}>
                {filteredLocations.length} of {locations.length} locations found
              </Text>

              {locationLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={APPCOLORS.Primary} />
                  <Text style={styles.loadingText}>Loading locations...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredLocations}
                  keyExtractor={(item, index) => index.toString()}
                  ListHeaderComponent={
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        selectedLocation === '' && styles.selectedItem,
                      ]}
                      onPress={() => {
                        setSelectedLocation('');
                        setShowLocationModal(false);
                        setLocationSearchQuery('');
                        setFilteredLocations(locations);
                      }}>
                      <Text style={styles.modalItemText}>All Locations</Text>
                      {selectedLocation === '' && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={APPCOLORS.Primary}
                        />
                      )}
                    </TouchableOpacity>
                  }
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        selectedLocation === item.loc_code &&
                          styles.selectedItem,
                      ]}
                      onPress={() => {
                        setSelectedLocation(item.loc_code);
                        setShowLocationModal(false);
                        setLocationSearchQuery('');
                        setFilteredLocations(locations);
                      }}>
                      <View style={styles.locationItem}>
                        <Text style={styles.locationCode}>{item.loc_code}</Text>
                        <Text style={styles.modalItemText}>
                          {item.location_name}
                        </Text>
                      </View>
                      {selectedLocation === item.loc_code && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={APPCOLORS.Primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* DATE PICKERS */}
        {showFromPicker && (
          <DateTimePicker
            value={new Date(fromDate)}
            mode="date"
            onChange={(e, d) => {
              setShowFromPicker(false);
              if (d) setFromDate(moment(d).format('YYYY-MM-DD'));
            }}
          />
        )}

        {showToPicker && (
          <DateTimePicker
            value={new Date(toDate)}
            mode="date"
            onChange={(e, d) => {
              setShowToPicker(false);
              if (d) setToDate(moment(d).format('YYYY-MM-DD'));
            }}
          />
        )}
      </View>

      {/* ---------------- TRANSACTIONS LIST ---------------- */}
      {loading ? (
        <View style={styles.mainLoading}>
          <ActivityIndicator size="large" color={APPCOLORS.Primary} />
          <Text style={styles.loadingText}>Loading stock movements...</Text>
        </View>
      ) : (
        <FlatList
          data={movementData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderCard}
          contentContainerStyle={{padding: 12}}
          ListEmptyComponent={
            <View style={styles.noDataContainer}>
              <MaterialIcons name="inventory-2" size={60} color="#ccc" />
              <Text style={styles.noData}>
                {selectedStock
                  ? 'No movement found for selected filters'
                  : 'Please select a stock to view movements'}
              </Text>
            </View>
          }
        />
      )}

      {/* Toast Component */}
      <Toast />
    </View>
  );
};

export default StockMovements;

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: APPCOLORS.Primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  filterBox: {
    backgroundColor: '#F3F4F6',
    margin: 12,
    padding: 14,
    borderRadius: 14,
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  dropdown: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },

  dateBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    elevation: 3,
    minHeight: 50,
    justifyContent: 'center',
  },
  dateTextFilter: {
    fontSize: 14,
    color: '#000',
  },

  applyBtn: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  clearBtn: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: APPCOLORS.Primary,
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 16,
    color: APPCOLORS.Primary,
    fontWeight: 'bold',
    marginTop: 4,
  },

  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noData: {
    textAlign: 'center',
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },

  mainLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  modalLoading: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },

  // ---------- CARD ----------
  card: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: APPCOLORS.Primary,
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 8,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  nameText: {
    color: '#444',
    marginVertical: 3,
    fontSize: 14,
  },
  locationText: {
    fontSize: 13,
    color: '#777',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 12,
    color: '#777',
  },

  // ---------- MODAL STYLES ----------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    width: '95%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f9f9f9',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  stockItem: {
    flex: 1,
  },
  stockId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  locationItem: {
    flex: 1,
  },
  locationCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: 'bold',
  },
});
