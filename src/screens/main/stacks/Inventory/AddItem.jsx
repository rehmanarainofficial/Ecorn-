import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import PlatformGradient from '../../../../components/PlatformGradient';
import axios from 'axios';
import Toast from 'react-native-toast-message'; // ✅ Toast library
import { BASEURL } from '../../../../utils/BaseUrl';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

export default function AddItem({navigation}) {
  // States for dropdowns
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  const [taxType, setTaxType] = useState(null);
  const [taxTypes, setTaxTypes] = useState([]);

  const [itemType, setItemType] = useState(null);

  const [loading, setLoading] = useState(false);

  const itemTypes = [
    {label: 'Manufactured', value: 'M'},
    {label: 'Purchase', value: 'B'},
    {label: 'Service', value: 'S'},
  ];

  const [unit, setUnit] = useState(null);
  const [units, setUnits] = useState([]);

  const [saleType, setSaleType] = useState(null);
  const [saleTypes, setSaleTypes] = useState([]);

  const [make, setMake] = useState(null);
  const [makes, setMakes] = useState([]);

  const [mainGroup, setMainGroup] = useState(null);
  const [mainGroups, setMainGroups] = useState([]);

  // Inputs
  const [stockId, setStockId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Animation setup
  const animValues = useRef([]).current;
  const fieldCount = 10;
  if (animValues.length === 0) {
    for (let i = 0; i < fieldCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  // Animate fields
  useEffect(() => {
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 400,
          delay: idx * 80,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 400,
          delay: idx * 80,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(80, anims).start();
  }, []);

  // Fetch dropdown data
  useEffect(() => {
    fetchData(
      `${BASEURL}stock_category.php`,
      setCategories,
      'category_id',
      'description',
    );
    fetchData(
      `${BASEURL}item_tax_types.php`,
      setTaxTypes,
      'id',
      'name',
    );
    fetchData(
      `${BASEURL}item_units.php`,
      setUnits,
      'abbr',
      'name',
    );
    fetchData(
      `${BASEURL}sales_type.php`,
      setSaleTypes,
      'id',
      'sales_type',
    );
    fetchData(
      `${BASEURL}combo1.php`,
      setMakes,
      'combo_code',
      'description',
    );
    fetchData(
      `${BASEURL}combo2.php`,
      setMainGroups,
      'combo_code',
      'description',
    );
  }, []);

  const fetchData = async (url, setState, valueField, labelField) => {
    try {
      const {data} = await axios.get(url);
      if (data?.status === 'true' && Array.isArray(data.data)) {
        const mapped = data.data.map(item => ({
          label: item[labelField],
          value: item[valueField],
        }));
        setState(mapped);
      }
    } catch (error) {
      console.error('Error fetching:', url, error);
    }
  };

  // Submit Function
  const handleSubmit = async () => {
    if (
      !category ||
      !stockId ||
      !name ||
      !taxType ||
      !itemType ||
      !unit ||
      !saleType ||
      !make ||
      !mainGroup ||
      !price
    ) {
      Toast.show({type: 'error', text1: 'Please fill all fields'});
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('category_id', category);
    formData.append('stock_id', stockId);
    formData.append('description', name);
    formData.append('tax_type_id', taxType);
    formData.append('units', unit);
    formData.append('mb_flag', itemType);
    formData.append('sales_type', saleType);
    formData.append('price', price);
    formData.append('combo1', make);
    formData.append('combo2', mainGroup);

    try {
      const res = await axios.post(
        `${BASEURL}stock_master_post.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('Raw Response:', res.data);

      // --- yahan parse kero
      let parsedData = {};
      if (typeof res.data === 'string') {
        // SQL query + JSON ka mixture -> sirf JSON part extract
        const jsonMatch = res.data.match(/\{.*\}$/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } else {
        parsedData = res.data;
      }

      console.log('Parsed:', parsedData);

      if (parsedData?.status === true) {
        Toast.show({type: 'success', text1: 'Item added successfully!'});

        // reset fields
        setCategory(null);
        setStockId('');
        setName('');
        setTaxType(null);
        setItemType(null);
        setUnit(null);
        setSaleType(null);
        setMake(null);
        setMainGroup(null);
        setPrice('');

        navigation.navigate('ViewItem');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: JSON.stringify(parsedData),
        });
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Toast.show({type: 'error', text1: 'Error submitting item'});
    } finally {
      setLoading(false); // <-- stop loading in all cases
    }
  };

  // Reusable Dropdown
  const renderDropdown = (
    index,
    placeholder,
    value,
    setValue,
    options,
    searchable = true,
  ) => (
    <Animated.View
      style={[
        styles.glassInput,
        {
          transform: [{translateY: animValues[index].translateY}],
          opacity: animValues[index].opacity,
        },
      ]}>
      <Dropdown
        style={styles.dropdown}
        data={options}
        search={searchable}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
        selectedTextStyle={{color: COLORS.WHITE}}
        itemTextStyle={{color: COLORS.BLACK}}
        searchPlaceholder="Search..."
        value={value}
        onChange={item => setValue(item.value)}
      />
    </Animated.View>
  );

  // Reusable Input
  const renderInput = (
    index,
    placeholder,
    value,
    setValue,
    keyboardType = 'default',
  ) => (
    <Animated.View
      style={[
        styles.glassInput,
        {
          transform: [{translateY: animValues[index].translateY}],
          opacity: animValues[index].opacity,
        },
      ]}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={'rgba(255,255,255,0.6)'}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
      />
    </Animated.View>
  );

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
        <View style={{width: 28}} /> {/* spacer */}
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
        {renderDropdown(
          0,
          'Select Category',
          category,
          setCategory,
          categories,
        )}
        {renderInput(1, 'Stock ID', stockId, setStockId, 'default')}
        {renderInput(2, 'Name', name, setName)}
        {renderDropdown(
          3,
          'Select Item Tax Type',
          taxType,
          setTaxType,
          taxTypes,
          false,
        )}
        {renderDropdown(4, 'Item Type', itemType, setItemType, itemTypes)}
        {renderDropdown(5, 'Units of Measure', unit, setUnit, units)}
        {renderDropdown(6, 'Sale Type', saleType, setSaleType, saleTypes)}
        {renderDropdown(7, 'Make', make, setMake, makes)}
        {renderDropdown(8, 'Main Group', mainGroup, setMainGroup, mainGroups)}
        {renderInput(9, 'Price', price, setPrice, 'numeric')}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={{color: COLORS.WHITE, fontSize: 18}}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Toast Container */}
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
  glassInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    color: '#fff',
    fontSize: 16,
  },
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  submitBtn: {
    height: 56,
    backgroundColor: COLORS.Primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
