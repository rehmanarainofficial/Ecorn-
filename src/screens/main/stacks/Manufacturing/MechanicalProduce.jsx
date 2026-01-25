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
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';

export default function MechanicalProduce({navigation, route}) {
  const {sales_order} = route.params || {};
  console.log(sales_order);

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
    <View style={styles.container}>
      <SimpleHeader title="Mechanical Produce" />

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 120}}>
        {/* All Item Dropdown */}
        {loading ? (
          <ActivityIndicator color="#1a1c22" style={{marginTop: 10}} />
        ) : (
          <Dropdown
            style={styles.dropdown}
            data={allItemList}
            labelField="label"
            valueField="value"
            placeholder="Select Item"
            placeholderStyle={{color: '#999'}}
            selectedTextStyle={{color: '#333'}}
            itemTextStyle={{color: '#000'}}
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
          placeholderTextColor="#999"
          value={reference}
          editable={false}
        />

        {/* Date Picker */}
        <TouchableOpacity
          style={[styles.textInput, {justifyContent: 'center'}]}
          onPress={() => setShowDate(true)}>
          <Text style={{color: '#333'}}>{formatDate(date)}</Text>
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
          placeholderTextColor="#999"
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
          placeholderTextColor="#999"
          multiline
          value={memo}
          onChangeText={setMemo}
        />

        {/* Process Button - Moved inside ScrollView */}
        <TouchableOpacity
          disabled={posting}
          onPress={handleProcess}
          style={[styles.submitBtn, {marginTop: 5}]}>
          {posting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{color: '#fff', fontSize: 18, fontWeight: '600'}}>
              Process
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  textInput: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
  },
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#1a1c22',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
});
