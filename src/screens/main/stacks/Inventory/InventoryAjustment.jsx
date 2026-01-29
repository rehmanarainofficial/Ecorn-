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
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatNumber, formatQuantity} from '../../../../utils/NumberUtils';
import SimpleHeader from '../../../../components/SimpleHeader';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  BG: '#f3f4f6',
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  BORDER: '#e5e7eb',
};

const adjustmentOptions = [
  {label: 'Positive', value: 0},
  {label: 'Negative', value: 1},
];

export default function InventoryAjustment({navigation}) {
  const [location, setLocation] = useState(null);
  const [locations, setLocations] = useState([]);

  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState(0);

  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchProducts, setSearchProducts] = useState([]);

  const [qty, setQty] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [total, setTotal] = useState('0');
  const [memo, setMemo] = useState('');

  const [items, setItems] = useState([]);
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
          setSearchProducts(formatted);
        }
      })
      .catch(() =>
        ToastAndroid.show('Failed to load products', ToastAndroid.SHORT),
      );
  }, []);

  // Auto calculate total
  useEffect(() => {
    const q = parseFloat(qty) || 0;
    const u = parseFloat(unitCost) || 0;
    setTotal((q * u).toString());
  }, [qty, unitCost]);

  const handleAdd = () => {
    if (!product || !qty || !unitCost) return;

    const selectedProduct = searchProducts.find(p => p.value === product);

    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        productId: product,
        productName: selectedProduct?.label || '',
        qty,
        unitCost,
        total,
      },
    ]);

    setProduct(null);
    setQty('');
    setUnitCost('');
    setTotal('0');
  };

  const handleSubmit = async () => {
    if (!location || items.length === 0) {
      ToastAndroid.show(
        'Select location and add items first',
        ToastAndroid.SHORT,
      );
      return;
    }

    setLoading(true);

    try {
      // ✅ FormData banao
      const form = new FormData();
      form.append('trans_type', String(17));
      form.append('ord_date', date.toISOString().split('T')[0]);
      form.append('loc_code', String(location));

      // ✅ Items ko JSON banake bhejna hoga
      const details = items.map(itm => ({
        item_code: String(itm.productId),
        description: memo || itm.productName,
        quantity_ordered: Number(itm.qty),
        unit_price: Number(itm.unitCost),
        adjustment_type: Number(adjustmentType),
      }));

      form.append('purch_order_details', JSON.stringify(details));

      const res = await axios.post(
        `${BASEURL}post_service_purch_sale.php`,
        form,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );

      let parsed = res.data;
      if (typeof res.data === 'string') {
        try {
          const jsonStr = res.data.substring(res.data.lastIndexOf('{'));
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.log('JSON parse error:', e);
        }
      }

      console.log('📦 Parsed Response:', parsed);

      if (
        parsed?.status === true ||
        parsed?.status === 'true' ||
        parsed?.status == 1
      ) {
        ToastAndroid.show(
          'Adjustment submitted successfully',
          ToastAndroid.LONG,
        );

        // ✅ Reset all fields
        setItems([]);
        setMemo('');
        setLocation(null);
        setDate(new Date());
        setAdjustmentType(0);
        setProduct(null);
        setQty('');
        setUnitCost('');
        setTotal('0');
      } else {
        ToastAndroid.show(`Server rejected adjustment`, ToastAndroid.LONG);
      }
    } catch (err) {
      console.log('❌ Error:', err.response?.data || err.message);
      ToastAndroid.show('Submission failed', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, {flex: 1}]}>
      {/* Header */}
   <SimpleHeader title="Inventory Adjustment" />

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        <Text style={styles.sectionTitle}>Item Adjustments</Text>

        {/* Location */}
        <Dropdown
          style={styles.dropdown}
          data={locations}
          search
          labelField="label"
          valueField="value"
          placeholder="Select Location"
          value={location}
          onChange={item => setLocation(item.value)}
          placeholderStyle={{color: COLORS.TEXT_SECONDARY}}
          selectedTextStyle={{color: COLORS.TEXT_PRIMARY}}
          itemTextStyle={{color: COLORS.TEXT_PRIMARY}}
        />

        {/* Date + Adjustment Type */}
        <View style={{flexDirection: 'row', gap: 12}}>
          <TouchableOpacity
            style={[styles.dropdown, {flex: 1, justifyContent: 'center'}]}
            onPress={() => setShowDate(true)}>
            <Text style={{color: COLORS.TEXT_PRIMARY}}>
              {date.toISOString().split('T')[0]}
            </Text>
          </TouchableOpacity>

          <Dropdown
            style={[styles.dropdown, {flex: 1}]}
            data={adjustmentOptions}
            labelField="label"
            valueField="value"
            value={adjustmentType}
            onChange={item => setAdjustmentType(item.value)}
            placeholder="Adjust Type"
            placeholderStyle={{color: COLORS.TEXT_SECONDARY}}
            selectedTextStyle={{color: COLORS.TEXT_PRIMARY}}
            itemTextStyle={{color: COLORS.TEXT_PRIMARY}}
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

        {/* Adjustment Detail */}
        <Text style={styles.sectionTitle}>Adjustment Detail</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Product</Text>
          <Text style={styles.tableHeaderText}>Qty</Text>
          <Text style={styles.tableHeaderText}>Unit Cost</Text>
          <Text style={styles.tableHeaderText}>Total</Text>
        </View>

        {/* Table Rows */}
        {items.map(row => (
          <View key={row.id} style={styles.tableRow}>
            <Text style={styles.tableText}>{row.productName}</Text>
            <Text style={styles.tableText}>{formatQuantity(row.qty)}</Text>
            <Text style={styles.tableText}>{formatNumber(row.unitCost)}</Text>
            <Text style={styles.tableText}>{formatNumber(row.total)}</Text>
          </View>
        ))}

        {/* Add Row */}
        <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
          <Dropdown
            style={[styles.dropdown, {flex: 3}]}
            data={products}
            search
            searchPlaceholder="Search product..."
            labelField="label"
            valueField="value"
            value={product}
            onChange={item => setProduct(item.value)}
            onChangeText={val => {
              if (val.length > 1) setProducts(searchProducts);
            }}
            placeholder="Product"
            placeholderStyle={{color: COLORS.TEXT_SECONDARY}}
            selectedTextStyle={{color: COLORS.TEXT_PRIMARY}}
            itemTextStyle={{color: COLORS.TEXT_PRIMARY}}
          />
          <TextInput
            style={[styles.textInput, {flex: 1}]}
            placeholder="Qty"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
          />
        </View>

        <View style={{flexDirection: 'row', gap: 12}}>
          <TextInput
            style={[styles.textInput, {flex: 1}]}
            placeholder="Unit Cost"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            keyboardType="numeric"
            value={unitCost}
            onChangeText={setUnitCost}
          />
          <View style={[styles.textInput, {flex: 1, justifyContent: 'center'}]}>
            <Text style={{color: COLORS.TEXT_PRIMARY}}>{formatNumber(total)}</Text>
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, {flex: 0.3}]}>
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
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          multiline
          value={memo}
          onChangeText={setMemo}
        />

        {/* Process Adjustment Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={{color: COLORS.WHITE, fontSize: 18}}>
              Process Adjustment
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: COLORS.BG,
  },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: '700'},
  sectionTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
    marginBlock: 10,
  },
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 7,
  },
  textInput: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BORDER,
    padding: 8,
    borderRadius: 6,
  },
  tableHeaderText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.BORDER,
  },
  tableText: {flex: 1, color: COLORS.TEXT_PRIMARY, textAlign: 'center'},
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  submitBtn: {
    height: 56,
    backgroundColor: COLORS.Primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
