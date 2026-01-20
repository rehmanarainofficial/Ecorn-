import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PlatformGradient from '../../../components/PlatformGradient';
import {useDispatch, useSelector} from 'react-redux';
// import {setAllProducts, setLoader} from '../../redux/AuthSlice';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASEURL} from '../../../utils/BaseUrl';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber} from '../../../utils/NumberUtils';
const Home = ({navigation, route}) => {
  const currentData = useSelector(state => state.Data.currentData);

  const {type} = route.params;

  console.log('type', type);

  const [RecoverTotal, setRecoverTotal] = useState();
  const [OderTotel, setTodaysOrder] = useState();

  const [recoveryLoader, setRecoverLoader] = useState(false);
  const [TodayOrderLoader, setTodayOrderLoader] = useState(false);

  const [dailyTarget, setDailyTarget] = useState(0);
  const [TargetIncentive, setTargetIncentive] = useState([]);

  // if(currentData.role_id !== 16){
  //   navigation.navigate("AsmDimension")
  // }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getProducts();
      getRecovery();
      getTodaysOrder();
      getIncentive();
    });

    return unsubscribe;
  }, [navigation]);

  const dispatch = useDispatch();

  const getProducts = () => {
    // dispatch(setLoader(true));

    let data = new FormData();

    data.append('loc_code', `'${currentData.loc_code}'`);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}stock_master.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(async response => {
        // dispatch(setLoader(false));
        // dispatch(setAllProducts(response.data.data));
        await AsyncStorage.setItem(
          'AllProducts',
          JSON.stringify(response.data.data),
        );
      })
      .catch(error => {
        // dispatch(setLoader(false));
        console.log(error);
      });
  };

  const getRecovery = () => {
    setRecoverLoader(true);
    let data = new FormData();
    data.append('user_id', currentData?.id);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}today_recovery_data.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(response => {
        setRecoverTotal(response?.data?.data[0]?.recovery_total);
        setRecoverLoader(false);
      })
      .catch(error => {
        console.log(error);
        // setLoader(false);
        setRecoverLoader(false);
      });
  };

  const getTodaysOrder = () => {
    // setLoader(true)
    setTodayOrderLoader(true);
    let data = new FormData();
    data.append('user_id', currentData?.id);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}today_orders_data.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(response => {
        // console.log("...............",JSON.stringify(response.data.data));
        if (response.data?.data?.length > 0) {
          setTodaysOrder(response.data.data[0].order_total);
        } else {
          setTodaysOrder(0);
        }
        // setLoader(false)
        setTodayOrderLoader(false);
      })
      .catch(error => {
        console.log(error);
        setTodayOrderLoader(false);
        // setLoader(false);
      });
  };

  const getIncentive = () => {
    let data = new FormData();
    data.append('salesman', currentData.salesman);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}salesman_commision.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(response => {
        setDailyTarget(response.data.data[0].daily_target);
        setTargetIncentive(response.data.data);
      })
      .catch(error => {
        console.log(error);
      });
  };

  const formattedTarget = formatNumber(dailyTarget);

  return (
    <View style={{flex: 1, backgroundColor: '#C0DAEA'}}>
      <View
        style={{
          backgroundColor: APPCOLORS.BTN_COLOR,
          height: 80,
          borderBottomEndRadius: 20,
          borderBottomStartRadius: 20,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: 'row',
          paddingHorizontal: 20,
        }}>
        <View />
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={{color: APPCOLORS.WHITE, fontSize: 20}}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <MaterialIcons name={'person'} color={APPCOLORS.WHITE} size={30} />
        </TouchableOpacity>
      </View>

      {currentData.role_id == 17 ? (
        <TouchableOpacity onPress={() => navigation.navigate('SalesmanList')}>
          <PlatformGradient
            colors={['#9BC8E2', APPCOLORS.BTN_COLOR]}
            style={{
              width: '90%',
              height: 50,
              backgroundColor: APPCOLORS.BTN_COLOR,
              marginTop: 10,
              alignSelf: 'center',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: APPCOLORS.WHITE,
                fontSize: 20,
                fontWeight: 'bold',
              }}>
              Salesman List
            </Text>
          </PlatformGradient>
        </TouchableOpacity>
      ) : null}

      <View style={{justifyContent: 'space-around', flex: 1}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewOrders')}
            style={{height: 300, width: '43%'}}>
            <PlatformGradient
              colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
              style={{
                height: 270,
                width: '100%',
                borderRadius: 10,
                backgroundColor: APPCOLORS.SKY_BLUE,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                source={require('../../../assets/images/newOrder.png')}
                style={{height: 100, width: 100, resizeMode: 'contain'}}
              />
              <Text
                style={{color: APPCOLORS.WHITE, marginTop: 20, fontSize: 20}}>
                {type == 'supplier' ? 'Total Po' : 'Total Order'}
              </Text>

              <Text
                style={{color: APPCOLORS.WHITE, marginTop: 20, fontSize: 20}}>
                Total Amount
              </Text>

              {TodayOrderLoader == true ? (
                <ActivityIndicator size={'small'} color={'white'} />
              ) : (
                <Text style={{color: APPCOLORS.WHITE, fontSize: 20}}>
                  Rs {!OderTotel ? '0' : formatNumber(OderTotel)}
                </Text>
              )}
            </PlatformGradient>
          </TouchableOpacity>
          {/* {
                    console.log("order", JSON.parse((OderTotel)).toFixed(2))
                } */}

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                type == 'supplier' ? 'SupplierHome' : 'AddNewCustomer',
                {type: type},
              )
            }
            style={{height: 300, width: '43%'}}>
            <PlatformGradient
              colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
              style={{
                height: 270,
                width: '100%',
                borderRadius: 10,
                backgroundColor: APPCOLORS.SKY_BLUE,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                source={require('../../../assets/images/TotalOrder.png')}
                style={{height: 100, width: 100, resizeMode: 'contain'}}
              />
              <Text
                style={{color: APPCOLORS.WHITE, marginTop: 20, fontSize: 20}}>
                {type == 'supplier' ? 'New Po' : 'New Order'}
              </Text>
            </PlatformGradient>
          </TouchableOpacity>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('RecoveryOrder')}
            style={{height: 300, width: '43%'}}>
            <PlatformGradient
              colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
              style={{
                height: 270,
                width: '100%',
                borderRadius: 10,
                backgroundColor: APPCOLORS.SKY_BLUE,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                source={require('../../../assets/images/Recover.png')}
                style={{height: 100, width: 100, resizeMode: 'contain'}}
              />
              <Text
                style={{color: APPCOLORS.WHITE, marginTop: 20, fontSize: 20}}>
                {type == 'supplier' ? 'GRN' : 'Quotation'}
              </Text>

              <Text
                style={{color: APPCOLORS.WHITE, marginTop: 20, fontSize: 20}}>
                Total Amount
              </Text>
              {recoveryLoader == true ? (
                <ActivityIndicator size={'small'} color={'white'} />
              ) : (
                <Text style={{color: APPCOLORS.WHITE, fontSize: 20}}>
                  Rs {!RecoverTotal ? '0' : formatNumber(RecoverTotal)}
                </Text>
              )}
            </PlatformGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Incentive', {
                TargetIncentive: TargetIncentive,
              })
            }
            style={{height: 300, width: '43%'}}>
            <PlatformGradient
              colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
              style={{
                height: 270,
                width: '100%',
                borderRadius: 10,
                backgroundColor: APPCOLORS.SKY_BLUE,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                source={require('../../../assets/images/Pending.png')}
                style={{height: 100, width: 100, resizeMode: 'contain'}}
              />
              <Text
                style={{
                  color: APPCOLORS.WHITE,
                  marginTop: 20,
                  fontSize: 20,
                  textAlign: 'center',
                }}>
                {type == 'supplier'
                  ? 'Supplier Inquiry'
                  : 'Customer Transction'}
              </Text>
              <Text
                style={{color: APPCOLORS.WHITE, marginTop: 20, fontSize: 20}}>
                Rs {formattedTarget}
              </Text>
            </PlatformGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Home;
