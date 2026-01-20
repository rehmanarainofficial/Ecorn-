import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../components/PlatformGradient';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import {useSelector} from 'react-redux';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASEURL} from '../../../utils/BaseUrl';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {responsiveWidth} from '../../../utils/Responsive';

const AddNewCustomer = ({navigation}) => {
  const CurrentUser = useSelector(state => state.Data.currentData);
  const day = moment().format('dddd');

  const [AllOrders, setAllOrders] = useState([]);
  const [Loader, setLoader] = useState(true);
  const [Search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loadermore, setLoadMore] = useState(false);

  useEffect(() => {
    getAllOrders();
  }, []);

  const filteredOrders = AllOrders?.filter(val =>
    val?.debtor_ref?.toLowerCase()?.includes(Search.toLowerCase()),
  ).slice(0, 50);

  const getAllOrders = async () => {
    setLoader(true);
    let datas = new FormData();
    datas.append('dim_id', CurrentUser?.dim_id);
    datas.append('area_code', CurrentUser?.area_code);
    datas.append('role_id', CurrentUser?.role_id);
    datas.append('week_day', day);
    datas.append('customer_status', 0);
    datas.append('page', page);

    try {
      const res = await axios.post(`${BASEURL}debtors_master.php`, datas, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      const newData = [...res.data.data]
      const uniqueOrders = newData.filter(
        (order, index, self) =>
          index === self.findIndex(o => o.debtor_ref === order.debtor_ref),
      );

      setAllOrders(uniqueOrders.slice(0, 50));
      await AsyncStorage.setItem('GetAllCustomers', JSON.stringify(res.data.data));
    } catch (err) {
      const offlineData = await AsyncStorage.getItem('GetAllCustomers');
      if (offlineData) setAllOrders(JSON.parse(offlineData));
    } finally {
      setLoader(false);
    }
  };

  const loaderMoreData = async () => {
    setLoadMore(true);
    let datas = new FormData();
    datas.append('dim_id', CurrentUser?.dim_id);
    datas.append('area_code', CurrentUser?.area_code);
    datas.append('role_id', CurrentUser?.role_id);
    datas.append('week_day', day);
    datas.append('customer_status', 0);
    datas.append('page', page);

    try {
      const res = await axios.post(`${BASEURL}debtors_master.php`, datas, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      const newData = [...res.data.data].reverse();
      const allOrders = [...AllOrders, ...newData];
      const uniqueOrders = allOrders.filter(
        (order, index, self) =>
          index === self.findIndex(o => o.debtor_ref === order.debtor_ref),
      );

      setAllOrders(uniqueOrders.slice(0, 50));
      setPage(prev => prev + 1);
      await AsyncStorage.setItem('GetAllCustomers', JSON.stringify(res.data.data));
    } catch (err) {
      console.log(err);
    } finally {
      setLoadMore(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: APPCOLORS.BLACK}}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 15,
          backgroundColor: APPCOLORS.BLACK,
        }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            height: 45,
            width: 45,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: '#E0E5EC',
            shadowColor: '#000',
            shadowOffset: {width: 5, height: 5},
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 6,
            borderWidth: 1,
            borderColor: '#f9f9f9',
          }}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <PlatformGradient
          colors={['#000000', '#434343']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '75%',
            height: 45,
            borderRadius: 15,
            paddingHorizontal: 12,
            shadowColor: '#000',
            shadowOffset: {width: 3, height: 3},
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}>
          <Ionicons name="search" size={20} color="#fff" style={{marginRight: 8}} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#aaa"
            style={{flex: 1, fontSize: 16, color: '#fff'}}
            onChangeText={txt => setSearch(txt)}
            value={Search}
          />
        </PlatformGradient>
      </View>

      {/* Loader */}
      {Loader ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <LottieView
            source={require('../../../assets/images/Loader.json')}
            style={{height: 250, width: 250}}
            autoPlay
            loop
          />
        </View>
      ) : (
        <View style={{flex: 1, alignItems: 'center'}}>
          {loadermore && (
            <ActivityIndicator
              size="large"
              color="white"
              style={{position: 'absolute', top: 10}}
            />
          )}
          {filteredOrders?.length > 0 ? (
            <FlatList
              data={filteredOrders}
              onEndReached={loaderMoreData}
              onEndReachedThreshold={1}
              renderItem={({item}) => (
                <PlatformGradient
                  colors={[APPCOLORS.Primary, APPCOLORS.Secondary, APPCOLORS.BLACK]}
                  style={{
                    borderRadius: 15,
                    marginVertical: 8,
                    padding: 15,
                    width: responsiveWidth(90),
                    alignSelf: 'center',
                  }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>1. Business Name</Text>
                    <Text style={styles.value}>{item?.name}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>2. Address</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {item?.address || 'N/A'}
                    </Text>
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
                    <Text style={styles.value}>{item?.contact_no || 'N/A'}</Text>
                  </View>
                </PlatformGradient>
              )}
            />
          ) : (
            <Text style={{color: APPCOLORS.WHITE, fontSize: 20}}>
              No Record Found
            </Text>
          )}
        </View>
      )}

      {/* Add Customer Button */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('InsertNewCustomerDetail', {
            allCustomer: AllOrders,
            onSuccess: () => getAllOrders(),
          })
        }
        style={{
          height: 50,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <PlatformGradient
          colors={[APPCOLORS.BLACK, APPCOLORS.Secondary, APPCOLORS.BLACK]}
          style={{
            height: 50,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{color: APPCOLORS.WHITE, fontSize: 20, fontWeight: 'bold'}}>
            Add new customer
          </Text>
        </PlatformGradient>
      </TouchableOpacity>
    </View>
  );
};

export default AddNewCustomer;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: APPCOLORS.WHITE,
    fontWeight: 'bold',
  },
  value: {
    color: APPCOLORS.WHITE,
    maxWidth: '60%',
  },
});
