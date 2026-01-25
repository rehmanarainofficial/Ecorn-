import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import {useSelector} from 'react-redux';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatQuantity} from '../../../../utils/NumberUtils';

const GrnDeliveryNote = ({route}) => {
  const navigation = useNavigation();
  const {orderId, personId, locCode, location, name} = route.params || {};
  const currentUser = useSelector(state => state.Data.currentData);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        let formData = new FormData();
        formData.append('order_no', orderId);

        const res = await axios.post(
          `${BASEURL}pending_po_item.php`,
          formData,
          {
            headers: {'Content-Type': 'multipart/form-data'},
            responseType: 'text',
          },
        );

        let raw = res.data.trim();

        let jsonStr = raw.substring(raw.indexOf('{'));
        let parsed;
        try {
          parsed = JSON.parse(jsonStr);
          console.log('API Response:', parsed);
        } catch (e) {
          console.log('JSON parse error:', e, raw);
          ToastAndroid.show('Invalid API response!', ToastAndroid.LONG);
          return;
        }

        if (
          parsed?.status?.toString().toLowerCase() === 'true' &&
          Array.isArray(parsed.data)
        ) {
          const mapped = parsed.data.map((item, index) => ({
            id: String(index + 1),
            po_detail_item: item.po_detail_item,
            stk_code: item.item_code,
            description: item.description ?? item.text7 ?? '',
            quantity_ordered: parseInt(item.quantity_ordered ?? 0),
            pending_qty: parseInt(item.pending_qty ?? 0),
            deliveredQty: '',
            unit_price: parseFloat(item.unit_price ?? 0),
            error: '',
          }));

          setItems(mapped);
        } else {
          ToastAndroid.show('No pending items found!', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.log('Error fetching items:', error);
        ToastAndroid.show('Failed to load delivery items!', ToastAndroid.LONG);
      }
    };

    fetchItems();
  }, [orderId]);

  // Handle input change
  const handleDeliveredChange = (id, text, maxQty) => {
    let errorMsg = '';
    if (text && parseInt(text) > maxQty) {
      errorMsg = `Cannot exceed ${maxQty}`;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? {...item, deliveredQty: text, error: errorMsg} : item,
      ),
    );
  };

  const handleSubmit = async () => {
    const invalid = items.some(item => item.error);
    if (invalid) {
      ToastAndroid.show('Fix validation errors first!', ToastAndroid.LONG);
      return;
    }

    try {
      setLoading(true);
      const today = new Date();
      const orderDate = today.toISOString().slice(0, 10);

      let grandTotal = 0;
      const purchOrderDetails = items.map(itm => {
        const qty = parseFloat(itm.deliveredQty) || 0;
        const price = parseFloat(itm.unit_price) || 0;
        const lineTotal = qty * price;
        grandTotal += lineTotal;

        return {
          item_code: String(itm.stk_code ?? ''),
          description: String(itm.description ?? ''),
          quantity_ordered: String(qty),
          unit_price: String(price),
          po_detail_item: String(itm.po_detail_item ?? ''),
        };
      });

      let formData = new FormData();
      formData.append('order_no', String(orderId));
      formData.append('person_id', String(personId));
      formData.append('trans_type', '25');
      formData.append('ord_date', String(orderDate));
      formData.append('loc_code', String(locCode));
      formData.append('total', String(grandTotal.toFixed(2)));
      formData.append('user_id', String(currentUser?.user_id ?? '1'));
      formData.append('purch_order_details', JSON.stringify(purchOrderDetails));

      let res = await axios.post(
        `${BASEURL}post_service_purch_sale.php`,
        formData,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );

      console.log(res.data);

      ToastAndroid.show('Material Received Successfully!', ToastAndroid.LONG);
      navigation.navigate('GrnAgainst', {refresh: true});
    } catch (error) {
      console.log('Submit Error:', error);
      ToastAndroid.show('Failed to submit delivery note!', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SimpleHeader title="GRN Note" />
      <View style={styles.container}>
        {/* Location and Name Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Cost center:</Text>
            <Text style={styles.infoValue}>{location || 'N/A'}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Location Name:</Text>
            <Text style={styles.infoValue}>{name || 'N/A'}</Text>
          </View>
        </View>

        <Text style={styles.heading}>GRN Items</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, {flex: 3}]}>Description</Text>
          <Text style={[styles.headerText, {flex: 0.8}]}>Qty</Text>
          <Text style={[styles.headerText, {flex: 0.6}]}>Pen.</Text>
          <Text style={[styles.headerText, {flex: 0.6}]}>Rec.</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={{marginBottom: 8}}>
              <View style={styles.tableRow}>
                {/* Description */}
                <Text
                  style={[
                    styles.cell,
                    {flex: 3, minHeight: 40, textAlignVertical: 'center'},
                  ]}>
                  {item.description}
                </Text>

                <Text style={[styles.cell, styles.labelCell, {flex: 0.8}]}>
                  {formatQuantity(item.quantity_ordered)}
                </Text>

                <Text style={[styles.cell, styles.labelCell, {flex: 0.6}]}>
                  {formatQuantity(item.pending_qty)}
                </Text>

                {/* Delivered Qty */}
                <TextInput
                  style={[
                    styles.cell,
                    styles.inputCell,
                    {
                      flex: 0.6,
                      borderColor: item.error ? 'red' : '#ddd',
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor="#aaa"
                  value={item.deliveredQty}
                  keyboardType="numeric"
                  maxLength={5}
                  onChangeText={text =>
                    handleDeliveredChange(item.id, text, item.quantity_ordered)
                  }
                />
              </View>
              {item.error ? (
                <Text style={styles.errorText}>{item.error}</Text>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            items.length > 0 ? (
              <TouchableOpacity
                style={[styles.button, loading && {opacity: 0.7}]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Process</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{paddingBottom: 20}}
        />
      </View>
    </>
  );
};

export default GrnDeliveryNote;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  // Location and Name Row Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  heading: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cell: {
    textAlign: 'center',
    padding: 8,
    color: '#000',
    fontSize: 13,
  },
  inputCell: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  labelCell: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 11,
    marginLeft: 6,
    marginTop: 2,
  },
  button: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
