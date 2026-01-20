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
import SimpleHeader from '../../../../../components/SimpleHeader';
import PlatformGradient from '../../../../../components/PlatformGradient';
import {BASEURL} from '../../../../../utils/BaseUrl';
import {formatQuantity} from '../../../../../utils/NumberUtils';

const DeliveryNote = ({route}) => {
  const navigation = useNavigation();
  const {
    orderId,
    personId,
    locCode,
    price_list,
    ship_via,
    name,
    location,
    reference,
  } = route.params || {};

  const [driverName, setDriverName] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        let formData = new FormData();
        formData.append('order_no', orderId);

        const res = await axios.post(
          `${BASEURL}pending_so_item.php`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            responseType: 'text',
          },
        );

        let raw = res.data.trim();
        let jsonStr = raw.substring(raw.indexOf('{'));
        let parsed;
        try {
          parsed = JSON.parse(jsonStr);
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
            id: String(item.id ?? index + 1),
            stk_code: item.stk_code,
            description: item.text7 ?? '',
            quantity: parseInt(item.quantity) || 0,
            pro_qty: item.pro_qty ? parseInt(item.pro_qty) : 0,
            delivered_qty: parseInt(item.delivered_qty) || 0,
            out_qty: parseInt(item.delivered_qty) || 0,
            userDelivered: '',
            unit_price: item.unit_price,
            po_detail_item: item.po_detail_item ?? '',
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

  const updateItem = (id, field, value) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? {...item, [field]: value} : item)),
    );
  };

  const handleDeliveredChange = (id, text, maxQty) => {
    let errorMsg = '';
    if (text && parseInt(text) > maxQty) {
      errorMsg = `Cannot exceed ${maxQty}`;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? {...item, userDelivered: text, error: errorMsg} : item,
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
        const qty = parseFloat(itm.userDelivered) || 0;
        const price = parseFloat(itm.unit_price) || 0;
        const lineTotal = qty * price;
        grandTotal += lineTotal;

        return {
          item_code: String(itm.stk_code ?? ''),
          description: String(itm.description ?? ''),
          del_qty: String(qty),
          text7: String(itm.description ?? ''),
          unit_price: String(price),
          po_detail_item: String(itm.po_detail_item ?? ''),
        };
      });

      let formData = new FormData();
      formData.append('order_no', String(orderId));
      formData.append('person_id', String(personId));
      formData.append('trans_type', String(13));
      formData.append('ord_date', String(orderDate));
      formData.append('driver_name', String(driverName));
      formData.append('vehicle_no', String(vehicleName));
      formData.append('loc_code', String(locCode));
      formData.append('total', String(grandTotal.toFixed(2)));
      formData.append('price_list', String(price_list));
      formData.append('ship_via', String(ship_via));
      formData.append('purch_order_details', JSON.stringify(purchOrderDetails));

      console.log('Submitting form data:', formData);
      await axios.post(`${BASEURL}post_service_purch_sale.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      ToastAndroid.show('Delivery Note submitted!', ToastAndroid.LONG);
      navigation.goBack();
    } catch (error) {
      console.log('Submit Error:', error);
      ToastAndroid.show('Failed to submit delivery note!', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlatformGradient
      colors={['#1a1c22', '#5a5c6a', '#000000']}
      style={{flex: 1}}>
      <SimpleHeader title="Delivery Note" />
      <View style={styles.container}>
        {/* Location + Location Name - Second Row */}
        <View style={styles.row}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Customer Name:</Text>
            <Text style={styles.locationValue}>{name || 'N/A'}</Text>
            <Text style={[styles.locationLabel, {marginTop: 8}]}>
              Reference:
            </Text>
            <Text style={styles.locationValue}>{reference || 'N/A'}</Text>
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Cost center:</Text>
            <Text style={styles.locationValue}>{location || 'N/A'}</Text>
          </View>
        </View>

        {/* Driver + Vehicle Inputs - First Row */}
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Driver Name"
            placeholderTextColor="#aaa"
            value={driverName}
            onChangeText={setDriverName}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle No"
            placeholderTextColor="#aaa"
            value={vehicleName}
            onChangeText={setVehicleName}
          />
        </View>

        <Text style={styles.heading}>Delivery Items</Text>

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.card}>
              {/* Row 1: Description (editable full width) */}
              <TextInput
                style={styles.descInput}
                placeholder="Enter description"
                placeholderTextColor="#aaa"
                value={item.description}
                onChangeText={text => updateItem(item.id, 'description', text)}
                multiline
                textAlignVertical="top"
              />

              {/* Row 2: 4 Columns */}
              <View style={styles.dataRow}>
                <View style={styles.dataBox}>
                  <Text style={styles.label}>Ord.Qty</Text>
                  <Text style={styles.value}>
                    {formatQuantity(item.quantity)}
                  </Text>
                </View>
                <View style={styles.dataBox}>
                  <Text style={styles.label}>Pro.Qty</Text>
                  <Text style={styles.value}>
                    {formatQuantity(item.pro_qty ?? 0)}
                  </Text>
                </View>
                <View style={styles.dataBox}>
                  <Text style={styles.label}>Del.Qty</Text>
                  <Text style={styles.value}>
                    {formatQuantity(item.out_qty)}
                  </Text>
                </View>
                <View style={styles.dataBox}>
                  <Text style={styles.label}>Out.Qty</Text>
                  <TextInput
                    style={[
                      styles.valueInput,
                      {borderColor: item.error ? 'red' : '#ddd'},
                    ]}
                    placeholder="0"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={item.userDelivered}
                    onChangeText={text =>
                      handleDeliveredChange(item.id, text, item.quantity)
                    }
                  />
                </View>
              </View>

              {item.error ? (
                <Text style={styles.errorText}>{item.error}</Text>
              ) : null}
            </View>
          )}
          ListFooterComponent={
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
          }
        />
      </View>
    </PlatformGradient>
  );
};

export default DeliveryNote;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    padding: 12,
  },
  descInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataBox: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  value: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
  valueInput: {
    width: '85%',
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#1a1c22',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
