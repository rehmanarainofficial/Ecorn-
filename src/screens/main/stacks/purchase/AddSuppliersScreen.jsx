import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../../components/PlatformGradient';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import {useSelector} from 'react-redux';
import {BASEURL} from '../../../../utils/BaseUrl';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {responsiveWidth} from '../../../../utils/Responsive';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const AddSuppliersScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const CurrentUser = useSelector(state => state.Data.currentData);
  const [AllOrders, setAllOrders] = useState([]);
  const [Loader, setLoader] = useState(true);
  const [Search, setSearch] = useState('');

  useEffect(() => {
    getAllOrders();
  }, []);

  const getAllOrders = async () => {
    try {
      setLoader(true);
      let datas = new FormData();
      datas.append('dim_id', CurrentUser?.dim_id);
      datas.append('area_code', CurrentUser?.area_code);
      datas.append('role_id', CurrentUser?.role_id);

      const response = await axios.post(`${BASEURL}suppliers.php`, datas, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      if (response?.data?.data) {
        setAllOrders(response.data.data);
      }
    } catch (error) {
    } finally {
      setLoader(false);
    }
  };

  const filteredOrders = AllOrders?.filter(val =>
    (val?.name || '').toLowerCase().includes(Search.toLowerCase()),
  );

  return (
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 15,
          paddingTop: Platform.OS === 'ios' ? insets.top + 25 : insets.top + 30,
          backgroundColor: APPCOLORS.BLACK,
        }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            height: 40,
            width: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#E0E5EC',
            shadowColor: '#000',
            shadowOffset: {width: 2, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}>
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>

        <PlatformGradient
          colors={['#000000', '#434343']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            height: 40,
            borderRadius: 10,
            paddingHorizontal: 12,
            marginHorizontal: 10,
            shadowColor: '#000',
            shadowOffset: {width: 2, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}>
          <Ionicons
            name="search"
            size={18}
            color="#fff"
            style={{marginRight: 8}}
          />
          <TextInput
            placeholder="Search Supplier"
            placeholderTextColor="#aaa"
            style={{flex: 1, fontSize: 14, color: '#fff', padding: 0}}
            onChangeText={txt => setSearch(txt)}
            value={Search}
          />
        </PlatformGradient>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('UploadSuppliers', {
              allCustomer: AllOrders,
              onSuccess: getAllOrders,
            })
          }
          style={{
            height: 40,
            width: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: APPCOLORS.Secondary,
            elevation: 3,
          }}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Loader */}
      {Loader ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <LottieView
            source={require('../../../../assets/images/Loader.json')}
            style={{height: 250, width: 250}}
            autoPlay
            loop
          />
        </View>
      ) : (
        <View style={{flex: 1, alignItems: 'center'}}>
          {filteredOrders?.length > 0 ? (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item, index) => `supplier-${index}`}
              contentContainerStyle={{paddingBottom: 80}}
              renderItem={({item}) => (
                <View
                  style={{
                    borderRadius: 15,
                    marginVertical: 8,
                    padding: 15,
                    width: responsiveWidth(90),
                    alignSelf: 'center',
                    backgroundColor: '#dee2e6',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>1. Business Name</Text>
                    <Text style={styles.value}>{item?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>2. Address</Text>
                    <Text style={styles.value}>{item?.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>3. NTN</Text>
                    <Text style={styles.value}>{item?.ntn_id || 'N/A'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>4. POC Name</Text>
                    <Text style={styles.value}>{item?.poc_name || 'N/A'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>5. Contact No</Text>
                    <Text style={styles.value}>
                      {item?.contact_no || 'N/A'}
                    </Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={{color: '#333', fontSize: 18}}>No Supplier Found</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default AddSuppliersScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#000000',
    fontWeight: 'bold',
  },
  value: {
    color: '#000000',
    maxWidth: '60%',
  },
});
