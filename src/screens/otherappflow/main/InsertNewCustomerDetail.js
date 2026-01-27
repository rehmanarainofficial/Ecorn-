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
import React, {useEffect, useRef, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../utils/BaseUrl';
import SimpleHeader from '../../../components/SimpleHeader';

const InsertNewCustomerDetail = ({navigation, route}) => {
  const [CustomerName, setCustomerName] = useState('');
  const [TradeName, setTradeName] = useState('');
  const [ContactNo, setContactNo] = useState('');
  const [Address, setAddress] = useState('');
  const [NTN, setNTN] = useState('');
  const [CNIC, setCNIC] = useState('');
  const [Province, setProvince] = useState('');

  const [POCName, setPOCName] = useState('');
  const [POCContact, setPOCContact] = useState('');
  const [POCEmail, setPOCEmail] = useState('');

  // Dropdown states
  const [taxOptions, setTaxOptions] = useState([]);
  const [salesmanOptions, setSalesmanOptions] = useState([]);
  const [taxValue, setTaxValue] = useState(null);
  const [salesmanValue, setSalesmanValue] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const provinceOptions = [
    {label: 'Sindh', value: 8},
    {label: 'Punjab', value: 7},
    {label: 'Balochistan', value: 2},
    {label: 'Khyber Pakhtunkhwa', value: 6},
    {label: 'Gilgit-Baltistan', value: 9},
    {label: 'Azad Jammu and Kashmir', value: 5},
    {label: 'Capital Territory', value: 5},
  ];

  // Animated entrance values
  const animValues = useRef([]).current;
  const inputsCount = 13; // number of animated input containers (approx)
  if (animValues.length === 0) {
    for (let i = 0; i < inputsCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  useEffect(() => {
    // Staggered entrance animation
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.stagger(60, anims).start();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const taxRes = await axios.get(`${BASEURL}tax_groups.php`);
        if (
          taxRes.data &&
          (taxRes.data.status === 'true' || taxRes.data.status === true)
        ) {
          const formattedTax = taxRes.data.data.map(item => ({
            label: item.name,
            value: item.id,
          }));
          setTaxOptions(formattedTax);
        }

        const salesRes = await axios.get(`${BASEURL}salesman.php`);
        if (
          salesRes.data &&
          (salesRes.data.status === 'true' || salesRes.data.status === true)
        ) {
          const formattedSales = salesRes.data.data.map(item => ({
            label: item.salesman_name,
            value: item.salesman_code,
          }));
          setSalesmanOptions(formattedSales);
        }
      } catch (err) {
        console.log('Dropdown fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const validate = () => {
    if (!TradeName || TradeName.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Trade Name is required',
      });
      return false;
    }
    if (!taxValue) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Tax Group is required',
      });
      return false;
    }
    if (!salesmanValue) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Salesperson is required',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('customer_name', CustomerName);
      form.append('trade_name', TradeName);
      form.append('contact_no', ContactNo);
      form.append('address', Address);
      form.append('ntn', NTN);
      form.append('cnic', CNIC);
      form.append('tax_group_id', taxValue);
      form.append('salesman_code', salesmanValue);
      form.append('province', Province);
      form.append('poc_name', POCName);
      form.append('poc_contact', POCContact);
      form.append('poc_email', POCEmail);

      const res = await axios.post(`${BASEURL}debtors_master_post.php`, form, {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 20000,
      });

      if (res.data && res.data.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Customer added successfully',
        });

        // callback call karo
        if (route.params?.onSuccess) {
          route.params.onSuccess();
        }

        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Unexpected server response',
        });
      }
    } catch (err) {
      console.log('Submit error:', err?.response?.data ?? err.message ?? err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while submitting',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderInputAnimated = (
    index,
    placeholder,
    value,
    setValue,
    keyboardType,
    fieldName,
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
        placeholderTextColor="#999"
        value={value}
        onChangeText={txt => {
          setValue(txt);
        }}
        keyboardType={keyboardType || 'default'}
        selectionColor="#1a1c22"
        autoCapitalize="words"
      />
    </Animated.View>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
        }}>
        <ActivityIndicator size="large" color="#1a1c22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SimpleHeader title="Add Customer" />

      <ScrollView
        contentContainerStyle={{padding: 20, paddingBottom: 120, gap: 20}}>
        <Animated.View style={{gap: 18}}>
          <Text style={styles.sectionHeading}>Customer Information</Text>

          {renderInputAnimated(
            0,
            'Business Name',
            CustomerName,
            setCustomerName,
          )}
          {renderInputAnimated(1, 'Trade Name *', TradeName, setTradeName)}
          {renderInputAnimated(
            2,
            'Contact No',
            ContactNo,
            setContactNo,
            'phone-pad',
          )}
          {renderInputAnimated(3, 'Address', Address, setAddress)}
          {renderInputAnimated(4, 'NTN', NTN, setNTN)}
          {renderInputAnimated(5, 'CNIC', CNIC, setCNIC)}

          <Animated.View
            style={{
              transform: [{translateY: animValues[6].translateY}],
              opacity: animValues[6].opacity,
            }}>
            <Dropdown
              style={styles.dropdown}
              data={taxOptions}
              search
              labelField="label"
              valueField="value"
              placeholder="Select Tax Group *"
              placeholderStyle={{color: '#999'}}
              searchPlaceholder="Search..."
              value={taxValue}
              onChange={item => {
                setTaxValue(item.value);
              }}
              selectedTextProps={{numberOfLines: 1}}
              selectedTextStyle={{color: '#333'}}
              itemTextStyle={{color: '#000'}}
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{translateY: animValues[7].translateY}],
              opacity: animValues[7].opacity,
            }}>
            <Dropdown
              style={styles.dropdown}
              data={salesmanOptions}
              search
              labelField="label"
              valueField="value"
              placeholder="Select Salesperson *"
              placeholderStyle={{color: '#999'}}
              searchPlaceholder="Search..."
              value={salesmanValue}
              onChange={item => {
                setSalesmanValue(item.value);
              }}
              selectedTextStyle={{color: '#333'}}
              itemTextStyle={{color: '#000'}}
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{translateY: animValues[8].translateY}],
              opacity: animValues[8].opacity,
            }}>
            <Dropdown
              style={styles.dropdown}
              data={provinceOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Province"
              placeholderStyle={{color: '#999'}}
              value={Province}
              onChange={item => {
                setProvince(item.value);
              }}
              selectedTextStyle={{color: '#333'}}
              itemTextStyle={{color: '#000'}}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={{gap: 12}}>
          <Text style={styles.sectionHeading}>POC Detail</Text>
          {renderInputAnimated(9, 'Name', POCName, setPOCName)}
          {renderInputAnimated(
            10,
            'Contact No',
            POCContact,
            setPOCContact,
            'phone-pad',
          )}
          {renderInputAnimated(
            11,
            'Email',
            POCEmail,
            setPOCEmail,
            'email-address',
          )}
        </Animated.View>

        <Animated.View
          style={{
            transform: [{translateY: animValues[12].translateY}],
            opacity: animValues[12].opacity,
          }}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              submitting ? styles.submitBtnDisabled : {},
            ]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{color: '#fff', fontSize: 18, fontWeight: '600'}}>
                Submit
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default InsertNewCustomerDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  sectionHeading: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
    marginBottom: 6,
  },
  glassInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 56,
    justifyContent: 'center',
  },
  textInput: {
    height: 56,
    color: '#333',
    fontSize: 16,
  },
  dropdown: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#1a1c22',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
