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
import {BASEURL} from '../../../../../utils/BaseUrl';
import {formatQuantity} from '../../../../../utils/NumberUtils';
import {formatDateString} from '../../../../../utils/DateUtils';
import {useSelector} from 'react-redux';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
};

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
    date,
  } = route.params || {};
  const currentUser = useSelector(state => state.Data.currentData);

  const [driverName, setDriverName] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lossMaterial, setLossMaterial] = useState('');

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
        console.log('res.data', res.data);

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
            memo: item.memo ?? '',
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
      formData.append('memo', String(lossMaterial));
      formData.append('purch_order_details', JSON.stringify(purchOrderDetails));
      formData.append('user_id', String(currentUser.id));
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
    <View style={styles.mainContainer}>
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
            <Text style={[styles.locationLabel, {marginTop: 8}]}>
              Del Date:
            </Text>
            <Text style={styles.locationValue}>
              {date ? formatDateString(date) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Driver + Vehicle Inputs - First Row */}
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Driver Name"
            placeholderTextColor={COLORS.TextMuted}
            value={driverName}
            onChangeText={setDriverName}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle No"
            placeholderTextColor={COLORS.TextMuted}
            value={vehicleName}
            onChangeText={setVehicleName}
          />
        </View>

        <Text style={styles.heading}>Delivery Items</Text>

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={{paddingBottom: 80}}
          renderItem={({item}) => (
            <View style={styles.card}>
              {/* Row 1: Description (editable full width) */}
              <TextInput
                style={styles.descInput}
                placeholder="Enter description"
                placeholderTextColor={COLORS.TextMuted}
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
                  <Text style={styles.label}>Pen.Qty</Text>
                  <Text style={styles.value}>
                    {formatQuantity(item.out_qty)}
                  </Text>
                </View>
                <View style={styles.dataBox}>
                  <Text style={styles.label}>Curr.Delv</Text>
                  <TextInput
                    style={[
                      styles.valueInput,
                      {borderColor: item.error ? '#EF4444' : COLORS.Border},
                    ]}
                    placeholder="0"
                    placeholderTextColor={COLORS.TextMuted}
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

              {/* Memo Section */}
              {item.memo ? (
                <View style={styles.memoContainer}>
                  <Text style={styles.memoLabel}>Memo:</Text>
                  <Text style={styles.memoText}>{item.memo}</Text>
                </View>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            <View style={{marginTop: 10, marginBottom: 20}}>
              <Text style={styles.heading}>Loss Material / Memo</Text>
              <TextInput
                style={[
                  styles.input,
                  {minHeight: 80, textAlignVertical: 'top'},
                ]}
                placeholder="Enter loss material or other information..."
                placeholderTextColor={COLORS.TextMuted}
                value={lossMaterial}
                onChangeText={setLossMaterial}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  loading && {opacity: 0.7},
                  {marginTop: 20, marginBottom: 0},
                ]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.buttonText}>Process</Text>
                )}
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </View>
  );
};

export default DeliveryNote;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    color: COLORS.TextDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    fontSize: 14,
  },
  locationContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TextMuted,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TextDark,
  },
  heading: {
    color: COLORS.TextDark,
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 12,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.Border,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: 10,
    color: COLORS.TextDark,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 50,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  dataBox: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    fontSize: 11,
    color: COLORS.TextMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: COLORS.TextDark,
    fontWeight: '700',
  },
  valueInput: {
    width: '90%',
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    color: COLORS.TextDark,
    fontSize: 14,
    backgroundColor: COLORS.WHITE,
    paddingVertical: 8,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 5,
  },
  memoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.Border,
  },
  memoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TextMuted,
    marginBottom: 4,
  },
  memoText: {
    fontSize: 14,
    color: COLORS.TextDark,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.Primary,
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
});
