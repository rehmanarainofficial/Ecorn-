import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import PlatformGradient from '../../../../components/PlatformGradient';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

const UploadSuppliers = ({navigation, route}) => {
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
  const [taxValue, setTaxValue] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Animated entrance values
  const animValues = useRef([]).current;
  const inputsCount = 13;
  if (animValues.length === 0) {
    for (let i = 0; i < inputsCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  useEffect(() => {
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
      } catch (err) {
        console.log('Dropdown fetch error:', err);
        Alert.alert('Error', 'Unable to fetch dropdown data');
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
      form.append('province', Province);
      form.append('poc_name', POCName);
      form.append('poc_contact', POCContact);
      form.append('poc_email', POCEmail);

      const res = await axios.post(`${BASEURL}supplier_post.php`, form, {
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
        placeholderTextColor={'rgba(255,255,255,0.6)'}
        value={value}
        onChangeText={txt => {
          setValue(txt);
        }}
        keyboardType={keyboardType || 'default'}
        selectionColor={COLORS.WHITE}
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
          backgroundColor: COLORS.BLACK,
        }}>
        <ActivityIndicator size="large" color={COLORS.Primary} />
      </View>
    );
  }

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={{flex: 1}}>
      {/* Header with slight glass/morph feel */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={'chevron-back'} color={COLORS.WHITE} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Suppliers</Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 20, gap: 20}}>
        <Animated.View style={{gap: 18}}>
          <Text style={styles.sectionHeading}>Supplier Information</Text>

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
              placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
              selectedTextStyle={{color: COLORS.WHITE}}
              itemTextStyle={{color: COLORS.BLACK}}
              searchPlaceholder="Search..."
              value={taxValue}
              onChange={item => {
                setTaxValue(item.value);
              }}
              selectedTextProps={{numberOfLines: 1}}
            />
          </Animated.View>

          {/* <Animated.View
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
              placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
              searchPlaceholder="Search..."
              value={salesmanValue}
              onChange={item => {
                setSalesmanValue(item.value);
              }}
            />
          </Animated.View> */}

          <Animated.View
            style={{
              transform: [{translateY: animValues[8].translateY}],
              opacity: animValues[8].opacity,
            }}>
            <Dropdown
              style={styles.dropdown}
              data={[
                {label: 'Sindh', value: 8},
                {label: 'Punjab', value: 7},
                {label: 'Balochistan', value: 2},
                {label: 'Khyber Pakhtunkhwa', value: 6},
                {label: 'Gilgit-Baltistan', value: 9},
                {label: 'Azad Jammu and Kashmir', value: 5},
                {label: 'Capital Territory', value: 5},
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select Province"
              placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
              selectedTextStyle={{color: COLORS.WHITE}}
              itemTextStyle={{color: COLORS.BLACK}}
              search
              searchPlaceholder="Search province..."
              value={Province}
              onChange={item => setProvince(item.value)}
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
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={{color: COLORS.WHITE, fontSize: 18}}>Submit</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </PlatformGradient>
  );
};

export default UploadSuppliers;

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    height: 84,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 22,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    textAlign: 'center',
    flex: 1,
  },
  sectionHeading: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },

  glassInput: {
    backgroundColor: 'rgba(255,255,255,0.03)', // same as dropdown
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    height: 56,
    justifyContent: 'center',
  },

  textInput: {
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  dropdown: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
  },
  submitBtn: {
    height: 56,
    backgroundColor: '#1a1c22',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    // neumorphic raised
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
