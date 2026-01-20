import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';
import {BASEURL} from '../../../../utils/BaseUrl';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

export default function MechanicalProduce({navigation, route}) {
  const {sales_order} = route.params || {};

  const [allItem, setAllItem] = useState(null);
  const [allItemList, setAllItemList] = useState([]);
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [qty, setQty] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Redux user
  const user = useSelector(state => state.Data.currentData);

  const formatDate = d => d.toISOString().split('T')[0];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('sales_order', sales_order);

      const res = await fetch(`${BASEURL}stock_master_produce.php`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.status === 'true' && Array.isArray(json.data)) {
        const formatted = json.data.map(item => ({
          label: item.items,
          value: item.woid,
          prod_qty: item.prod_qty,
          stock_id: item.stock_id,
          loc_code: item.loc_code,
          order_det_id: item.ord_detail_id,
          reference: item.reference,
          order_no: item.order_no,
        }));
        setAllItemList(formatted);
      } else {
        Toast.show({type: 'error', text1: 'No items found'});
      }
    } catch (err) {
      console.log('Fetch Error:', err);
      Toast.show({type: 'error', text1: 'Failed to load items'});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 🟩 When item changes, auto-fill reference + qty
  const handleSelectItem = val => {
    setAllItem(val);
    setReference(val.reference || '');
    setQty(val.prod_qty || '');
  };

  // 🟩 Submit to API
  const handleProcess = async () => {
    if (!allItem || !qty) {
      Toast.show({type: 'error', text1: 'Please select item and quantity'});
      return;
    }

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('trans_type', 29);
      formData.append('ord_date', formatDate(date));
      formData.append('order_no', allItem.order_no);
      formData.append('woid', allItem.value);
      formData.append('prod_qty', qty);
      formData.append('user_id', user?.id || 12);
      formData.append('stock_id', allItem.stock_id);
      formData.append('loc_code', allItem.loc_code);
      formData.append('order_det_id', allItem.order_det_id);
      formData.append('memo', memo);

      const res = await fetch(`${BASEURL}post_service_purch_sale.php`, {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      console.log('Raw POST Response:', text);
      const match = text.match(/\{.*\}/s);
      const json = match ? JSON.parse(match[0]) : {status: false};

      if (json.status === 'true' || json.status === true) {
        Toast.show({type: 'success', text1: 'Processed Successfully!'});

        // 🟢 reset form
        setAllItem(null);
        setReference('');
        setQty('');
        setMemo('');
        setDate(new Date());

        setTimeout(() => {
          navigation.navigate('MechanicalJobCardsScreen');
        }, 800);
      } else {
        Toast.show({type: 'error', text1: 'Failed to process'});
      }
    } catch (err) {
      console.log('Submit Error:', err);
      Toast.show({type: 'error', text1: 'Something went wrong'});
    } finally {
      setPosting(false);
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
        <Text style={styles.headerTitle}>Mechanical Produce</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        {/* All Item Dropdown */}
        {loading ? (
          <ActivityIndicator color={COLORS.WHITE} style={{marginTop: 10}} />
        ) : (
          <Dropdown
            style={styles.dropdown}
            data={allItemList}
            labelField="label"
            valueField="value"
            placeholder="Select Item"
            placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
            selectedTextStyle={{color: COLORS.WHITE}}
            itemTextStyle={{color: COLORS.BLACK}}
            search
            searchPlaceholder="Search item..."
            value={allItem?.value}
            onChange={handleSelectItem}
          />
        )}

        {/* Reference (auto-filled) */}
        <TextInput
          style={[styles.textInput, {opacity: 0.8}]}
          placeholder="Reference"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={reference}
          editable={false}
        />

        {/* Date Picker */}
        <TouchableOpacity
          style={[styles.textInput, {justifyContent: 'center'}]}
          onPress={() => setShowDate(true)}>
          <Text style={{color: COLORS.WHITE}}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              setShowDate(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        {/* Quantity (editable) */}
        <TextInput
          style={styles.textInput}
          placeholder="Quantity"
          placeholderTextColor="rgba(255,255,255,0.6)"
          keyboardType="numeric"
          value={qty?.toString()}
          onChangeText={setQty}
        />

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
          disabled={posting}
          onPress={handleProcess}
          style={styles.submitBtn}>
          {posting ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={{color: COLORS.WHITE, fontSize: 18}}>Process</Text>
          )}
        </TouchableOpacity>
      </View>

      <Toast />
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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
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
