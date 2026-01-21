import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../components/SimpleHeader';
import axios from 'axios';
import {formatDateString} from '../utils/DateUtils';
import {formatNumber} from '../utils/NumberUtils';
import {BASEURL} from '../utils/BaseUrl';

const ViewTransactions = ({navigation, route}) => {
  const {trans_no, type} = route.params || {};

  const [loading, setLoading] = useState(true);
  const [headerData, setHeaderData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTransactionData();
  }, []);

  const fetchTransactionData = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('trans_no', trans_no);
      formData.append('type', type);

      const res = await axios.post(`${BASEURL}view_data.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API Response:', res.data);

      if (res.data?.status_header?.toString().toLowerCase() === 'true') {
        setHeaderData(res.data.data_header || []);
      }

      if (res.data?.status_detail?.toString().toLowerCase() === 'true') {
        setDetailData(res.data.data_detail || []);
      }
    } catch (error) {
      console.log('Error fetching transaction data:', error);
      ToastAndroid.show(
        'Failed to load transaction details!',
        ToastAndroid.LONG,
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAmountDisplay = amount => {
    return formatNumber(amount);
  };

  const formatDateDisplay = dateString => {
    return formatDateString(dateString);
  };

  const renderHeaderItem = () => {
    if (headerData.length === 0) return null;

    const item = headerData[0]; // Pehla record use karte hain
    return (
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerField}>
            <Text style={styles.label}>Reference:</Text>
            <Text style={styles.value}>{item.reference || 'N/A'}</Text>
          </View>
          <View style={styles.headerField}>
            <Text style={styles.label}>Cost center:</Text>
            <Text style={styles.value}>{item.location_name || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerField}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {formatDateDisplay(item.trans_date)}
            </Text>
          </View>
          <View style={styles.headerField}>
            <Text style={styles.label}>Salesman:</Text>
            <Text style={styles.value}>{item.salesman || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerField}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{item.name || 'N/A'}</Text>
          </View>
        </View>

      </View>
    );
  };

  // Terms & Conditions Button (shown after table)
  const renderTermsButton = () => {
    if (headerData.length === 0 || !headerData[0].term_cond) return null;
    
    return (
      <TouchableOpacity
        style={styles.termsButton}
        onPress={() => {
          setSelectedTerms(headerData[0].term_cond);
          setModalVisible(true);
        }}>
        <Icon name="file-document-outline" size={20} color="#FFF" />
        <Text style={styles.termsButtonText}>View Terms & Conditions</Text>
      </TouchableOpacity>
    );
  };

  const renderDetailItem = ({item, index}) => (
    <View style={styles.detailCard}>
      <View style={styles.detailRow}>
        <View style={{flex: 3, justifyContent: 'center'}}>
          {item.long_description ? (
            <Text style={styles.longDescription}>{item.long_description}</Text>
          ) : (
            <Text style={styles.detailText}>{item.description || 'N/A'}</Text>
          )}
        </View>
        <Text style={[styles.detailText, {flex: 1, textAlign: 'center'}]}>
          {item.quantity || '0'}
        </Text>
        <Text style={[styles.detailText, {flex: 2, textAlign: 'right'}]}>
          Rs. {formatAmountDisplay(item.unit_price)}
        </Text>
      </View>
    </View>
  );

  // Terms & Conditions Modal
  const renderTermsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.termsContainer}>
            <Text style={styles.termsText}>{selectedTerms}</Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <>
        <SimpleHeader title="Transaction Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1c22" />
        </View>
      </>
    );
  }

  return (
    <>
      <SimpleHeader title="Transaction Details" />

      <ScrollView style={styles.container}>
        {/* Header Information */}
        {renderHeaderItem()}

        {/* Items List Header */}
        <View style={styles.detailHeader}>
          <Text style={[styles.headerText, {flex: 3}]}>Description</Text>
          <Text style={[styles.headerText, {flex: 1}]}>Qty</Text>
          <Text style={[styles.headerText, {flex: 2}]}>Unit Price</Text>
        </View>

        {/* Items List */}
        {detailData.length > 0 ? (
          <FlatList
            data={detailData}
            keyExtractor={item =>
              item.id?.toString() || Math.random().toString()
            }
            renderItem={renderDetailItem}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noItems}>
            <Icon name="file-alert" size={40} color="#5a5c6a" />
            <Text style={styles.noItemsText}>No items found</Text>
          </View>
        )}

        {/* Footer: Totals */}
        {headerData.length > 0 && (
          <View style={[styles.headerCard, {marginTop: 10, marginBottom: 0}]}>
            <View
              style={[
                styles.summaryRow,
                {borderTopWidth: 0, marginTop: 0, paddingTop: 0},
              ]}>
              <View style={styles.summaryItem}>
                <Text style={styles.label}>Total Amount:</Text>
                <Text style={styles.totalAmount}>
                  Rs. {formatAmountDisplay(headerData[0].total)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Terms & Conditions Button - After Totals */}
        {renderTermsButton()}
      </ScrollView>

      {/* Terms & Conditions Modal */}
      {renderTermsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#FFF',
    margin: 12,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  headerField: {
    flex: 1,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 18,
    color: '#1a1c22',
    fontWeight: 'bold',
    marginTop: 5,
  },
  discount: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
    marginTop: 5,
  },
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1c22',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  termsButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1c22',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 8,
  },
  headerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  longDescription: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 0,
    lineHeight: 22,
  },
  noItems: {
    alignItems: 'center',
    padding: 30,
  },
  noItemsText: {
    color: '#5a5c6a',
    marginTop: 10,
    fontSize: 16,
  },
  commentsCard: {
    backgroundColor: '#FFF',
    margin: 12,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1c22',
    marginBottom: 8,
  },
  commentsText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1c22',
  },
  termsContainer: {
    padding: 15,
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: '#1a1c22',
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  modalCloseText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ViewTransactions;
