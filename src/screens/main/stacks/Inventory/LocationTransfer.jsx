import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatQuantity} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

export default function LocationTransfer({navigation}) {
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [locations, setLocations] = useState([]);

  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [qty, setQty] = useState('');
  const [memo, setMemo] = useState('');

  const [items, setItems] = useState([]); // table data
  const [loading, setLoading] = useState(false);

  // Fetch Locations
  useEffect(() => {
    axios
      .get(`${BASEURL}locations.php`)
      .then(res => {
        if (res.data.status === 'true') {
          const formatted = res.data.data.map(loc => ({
            label: loc.location_name,
            value: loc.loc_code,
          }));
          setLocations(formatted);
        }
      })
      .catch(() =>
        ToastAndroid.show('Failed to load locations', ToastAndroid.SHORT),
      );
  }, []);

  // Fetch Products
  useEffect(() => {
    axios
      .get(`${BASEURL}stock_master.php`)
      .then(res => {
        if (res.data.status === 'true') {
          const formatted = res.data.data.map(p => ({
            label: p.description,
            value: p.stock_id,
          }));
          setProducts(formatted.slice(0, 10));
          setAllProducts(formatted);
        }
      })
      .catch(() =>
        ToastAndroid.show('Failed to load products', ToastAndroid.SHORT),
      );
  }, []);

  // Add product row
  const handleAdd = () => {
    if (!product || !qty) return;

    const selectedProduct = allProducts.find(p => p.value === product);

    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        item_code: product,
        description: selectedProduct?.label || '',
        quantity_ordered: Number(qty),
      },
    ]);

    // reset fields
    setProduct(null);
    setQty('');
  };

  // Delete row
  const handleDelete = id => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Submit API
  const handleSubmit = async () => {
    if (!fromLocation || !toLocation || items.length === 0) {
      ToastAndroid.show(
        'Select locations and add items first',
        ToastAndroid.SHORT,
      );
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append('trans_type', '16'); // always 16
      form.append('ord_date', date.toISOString().split('T')[0]); // yyyy-mm-dd
      form.append('loc_code', fromLocation);
      form.append('to_loc_code', toLocation);
      form.append('purch_order_details', JSON.stringify(items));
      form.append('memo', memo);

      const res = await axios.post(
        `${BASEURL}post_service_purch_sale.php`,
        form,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );

      // ✅ Response parsing
      let parsed = res.data;
      if (typeof res.data === 'string') {
        try {
          const jsonStr = res.data.substring(res.data.lastIndexOf('{'));
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.log('❌ JSON parse error:', e);
        }
      }

      console.log('📦 Parsed Response:', parsed);

      if (
        parsed?.status === true ||
        parsed?.status === 'true' ||
        parsed?.status == 1
      ) {
        ToastAndroid.show('Transfer successful', ToastAndroid.LONG);

        // ✅ Reset all fields
        setItems([]);
        setMemo('');
        setFromLocation(null);
        setToLocation(null);
        setDate(new Date());
      } else {
        ToastAndroid.show('Server rejected transfer', ToastAndroid.LONG);
      }

      console.log('📦 Response:', res.data);

      if (
        res.data?.status === true ||
        res.data?.status === 'true' ||
        res.data?.status == 1
      ) {
        ToastAndroid.show('Transfer successful', ToastAndroid.LONG);
        setItems([]);
        setMemo('');
        setFromLocation(null);
        setToLocation(null);
        setDate(new Date());
      } else {
        ToastAndroid.show('Server rejected transfer', ToastAndroid.LONG);
      }
    } catch (err) {
      console.log('❌ Error:', err.response?.data || err.message);
      ToastAndroid.show('Submission failed', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Transfer</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        {/* From Location */}
        <Dropdown
          style={styles.dropdown}
          data={locations}
          search
          labelField="label"
          valueField="value"
          placeholder="From Location"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
          selectedTextStyle={{color: COLORS.WHITE}}
          itemTextStyle={{color: COLORS.BLACK}}
          value={fromLocation}
          onChange={item => setFromLocation(item.value)}
        />

        {/* Date + To Location */}
        <View style={{flexDirection: 'row', gap: 12}}>
          {/* Date Picker */}
          <TouchableOpacity
            style={[styles.dropdown, {flex: 1, justifyContent: 'center'}]}
            onPress={() => setShowDate(true)}>
            <Text style={{color: COLORS.WHITE}}>
              {date.toISOString().split('T')[0]}
            </Text>
          </TouchableOpacity>

          {/* To Location */}
          <Dropdown
            style={[styles.dropdown, {flex: 1}]}
            data={locations}
            search
            labelField="label"
            valueField="value"
            placeholder="To Location"
            placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
            selectedTextStyle={{color: COLORS.WHITE}}
            itemTextStyle={{color: COLORS.BLACK}}
            value={toLocation}
            onChange={item => setToLocation(item.value)}
          />
        </View>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selected) => {
              setShowDate(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, {flex: 7}]}>Product</Text>
          <Text style={[styles.tableHeaderText, {flex: 2}]}>Qty</Text>
          <Text style={[styles.tableHeaderText, {flex: 1}]}>Del</Text>
        </View>

        {/* Table Rows */}
        {items.map(row => (
          <View key={row.id} style={styles.tableRow}>
            <Text style={[styles.tableText, {flex: 7}]}>{row.description}</Text>
            <Text style={[styles.tableText, {flex: 2}]}>
              {formatQuantity(row.quantity_ordered)}
            </Text>
            <TouchableOpacity
              style={{flex: 1, alignItems: 'center'}}
              onPress={() => handleDelete(row.id)}>
              <Ionicons name="trash" size={22} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Row */}
        <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
          <Dropdown
            style={[styles.dropdown, {flex: 7}]}
            data={products}
            search
            searchPlaceholder="Search product..."
            labelField="label"
            valueField="value"
            placeholder="Product"
            placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
            selectedTextStyle={{color: COLORS.WHITE}}
            itemTextStyle={{color: COLORS.BLACK}}
            value={product}
            onChange={item => setProduct(item.value)}
            onChangeText={val => {
              if (val.length > 1) setProducts(allProducts);
            }}
          />
          <TextInput
            style={[styles.textInput, {flex: 2}]}
            placeholder="Qty"
            placeholderTextColor="rgba(255,255,255,0.6)"
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, {flex: 1}]}>
            <Ionicons name="add-circle" size={28} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        {/* Memo */}
        <TextInput
          style={[
            styles.textInput,
            {height: 100, textAlignVertical: 'top', marginTop: 10},
          ]}
          placeholder="Memo / Description"
          placeholderTextColor="rgba(255,255,255,0.6)"
          multiline
          value={memo}
          onChangeText={setMemo}
        />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={{color: COLORS.WHITE, fontSize: 18}}>
              Process Transfer
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </PlatformGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {color: '#fff', fontSize: 20, fontWeight: '700'},
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 7,
  },
  textInput: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: COLORS.WHITE,
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 6,
  },
  tableHeaderText: {
    color: COLORS.WHITE,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  tableText: {
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Secondary,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.Primary,
  },
  submitBtn: {
    height: 56,
    backgroundColor: COLORS.Secondary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
