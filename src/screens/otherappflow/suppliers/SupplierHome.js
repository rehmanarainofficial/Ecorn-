import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../components/PlatformGradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {addEventListener} from '@react-native-community/netinfo';
import {useSelector} from 'react-redux';
import moment from 'moment';
import {BASEURL} from '../../../utils/BaseUrl';
import Toast from 'react-native-toast-message';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber} from '../../../utils/NumberUtils';
import {responsiveWidth} from '../../../utils/Responsive';
const SupplierHome = ({navigation, route}) => {
  const CurrentUser = useSelector(state => state.Data.currentData);
  const day = moment().format('dddd');
  const [page, setPage] = useState(0);
  const [loadermore, setLoadMore] = useState(false);

  const {type} = route.params;
  const [offlineSyncLoader, setOfflineSyncLoader] = useState(false);

  const arr = [
    {id: 1},
    {id: 2},
    {id: 3},
    {id: 4},
    {id: 5},
    {id: 6},
    {id: 7},
    {id: 8},
    {id: 1},
  ];

  const [AllOrders, setAllOrders] = useState([]);

  const [Loader, setLoader] = useState(true);
  const [Search, setSearch] = useState('');
  const [selectedType, setselectedType] = useState(0);

  // Subscribe
  useEffect(() => {
    const unsubscribe = addEventListener(async state => {
      console.log('Connection type', state.type);

      console.log('Is connected?', state.isConnected);

      if (state.isConnected === false) {
        const getAllProducts = await AsyncStorage.getItem('GetAllCustomers');
        console.log('getAllProducts', getAllProducts);

        setAllOrders(JSON.parse(getAllProducts));
      } else {
        console.log('Connection type', state.isConnected);
      }
    });
    // Unsubscribe
    unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getAllOrders();
    });
    return unsubscribe;
  }, [navigation]);

  // Filter orders based on search input
  const filteredOrders = AllOrders?.filter(val => {
    const itemNameLowerCase = val?.supp_name?.toLowerCase();
    if (Search === '') {
      return val;
    } else if (itemNameLowerCase?.includes(Search.toLowerCase())) {
      return val;
    }
  });

  const getAllOrders = async (num = 0) => {
    setLoader(true);
    setAllOrders([]);
    setPage(0);
    let datas = new FormData();
    datas.append('dim_id', CurrentUser?.dim_id);
    datas.append('area_code', CurrentUser?.area_code);
    datas.append('role_id', CurrentUser?.role_id);
    datas.append('week_day', day);
    datas.append('customer_status', num);
    datas.append('page', page);

    let configs = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}suppliers.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: datas,
    };

    axios
      .request(configs)
      .then(async response => {
        // setAllOrders(response?.data?.data);
        console.log('first', response.data.data);
        setAllOrders(response.data.data);

        await AsyncStorage.setItem(
          'GetAllCustomers',
          JSON.stringify(response?.data?.data),
        );
        setLoader(false);
        setLoadMore(false);
        setPage(prevPage => prevPage + 1);
        console.log('response: ' + response.data.data);
        return;
        // setAllOrders(prevData => [...prevData, ...response.data.data]);
      })
      .catch(async error => {
        console.log(error);

        setLoadMore(false);
        const getAllProducts = await AsyncStorage.getItem('GetAllCustomers');
        setAllOrders(JSON.parse(getAllProducts));
      });
  };

  //   const loaderMoreData = async (num = 0) => {
  //     setLoadMore(true);
  //     let datas = new FormData();
  //     datas.append('dim_id', CurrentUser?.dim_id);
  //     datas.append('area_code', CurrentUser?.area_code);
  //     datas.append('role_id', CurrentUser?.role_id);
  //     datas.append('week_day', day);
  //     datas.append('customer_status', num);
  //     datas.append('page', page);

  //     console.log("datasdatasdatasdatasdatasdatas",datas)
  //     let configs = {
  //       method: 'post',
  //       maxBodyLength: Infinity,
  //       url: `${BASEURL}debtors_master.php`,
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //       data: datas,
  //     };

  //     axios
  //       .request(configs)
  //       .then(async response => {
  //         // setAllOrders(response?.data?.data);
  //         // setAllOrders(prevData => [...prevData, ...response.data.data]);
  //         setAllOrders(prevData => {
  //           const allOrders = [...prevData, ...response.data.data];
  //           const uniqueOrders = allOrders.filter(
  //             (order, index, self) => index === self.findIndex(o => o.debtor_ref === order.debtor_ref)
  //           );
  //           return uniqueOrders;
  //         });

  //         setLoadMore(false);
  //         setPage(prevPage => prevPage + 1);
  //         console.log('response: ' + response.data.data);

  //         await AsyncStorage.setItem(
  //           'GetAllCustomers',
  //           JSON.stringify(response?.data?.data),
  //         );
  //       })
  //       .catch(async error => {
  //         console.log(error);
  //         setLoader(false);
  //         setLoadMore(false);

  //         const getAllProducts = await AsyncStorage.getItem('GetAllCustomers');
  //         setAllOrders(JSON.parse(getAllProducts));
  //       });
  //   };

  const processStoredVisits = async () => {
    setOfflineSyncLoader(true);
    try {
      const storedData = await AsyncStorage.getItem('offlineVisits');
      if (storedData == null) {
        Toast.show({
          type: 'success',
          text1: 'No offline submit found!',
        });
        setOfflineSyncLoader(false);
        return;
      }

      let offlineVisits = storedData ? JSON.parse(storedData) : [];

      for (let visit of offlineVisits) {
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: `${BASEURL}debtors_feedback_post.php`,
          headers: {
            'content-type': 'multipart/form-data',
          },
          data: visit,
        };

        try {
          const response = await axios.request(config);
          console.log('Offline visit submitted:', response.data);
        } catch (error) {
          console.log('Error submitting offline visit:', error);
          return; // Stop further execution if there's an error
        }
      }

      // If all visits are submitted successfully, clear the stored data
      await AsyncStorage.removeItem('offlineVisits');
      Toast.show({
        type: 'success',
        text1: 'All offline visits submitted successfully!',
      });
      setOfflineSyncLoader(false);
    } catch (error) {
      setOfflineSyncLoader(false);
      console.error('Error processing stored visits:', error);
    }
  };

  const openGoogleMaps = addr => {
    const url = `https://www.google.com/maps/search/?api=1&query=${addr}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  return (
    <View style={{flex: 1, backgroundColor: APPCOLORS.CLOSETOWHITE}}>
      <View style={{backgroundColor: APPCOLORS.BTN_COLOR}}>
        {/* <View
          style={{
            flexDirection: 'row',
            width: '90%',
            alignSelf: 'center',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('OfflineOrders')}
            style={{
              width: '48%',
              alignSelf: 'center',
              backgroundColor: APPCOLORS.BLACK,
              marginTop: 10,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
            }}>
            <Text
              style={{
                color: APPCOLORS.WHITE,
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              Offline Order
            </Text>
          </TouchableOpacity>
          {offlineSyncLoader == true ? (
            <View
              style={{
                width: '48%',
                alignSelf: 'center',
                backgroundColor: APPCOLORS.BLACK,
                marginTop: 10,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
              }}>
                <ActivityIndicator size={'small'} color={"white"}/>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => processStoredVisits()}
              style={{
                width: '48%',
                alignSelf: 'center',
                backgroundColor: APPCOLORS.BLACK,
                marginTop: 10,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
              }}>
              <Text
                style={{
                  color: APPCOLORS.WHITE,
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                Offline Visit
              </Text>
            </TouchableOpacity>
          )}
        </View> */}

        <View
          style={{
            backgroundColor: APPCOLORS.BTN_COLOR,
            height: 90,
            borderBottomEndRadius: 20,
            borderBottomLeftRadius: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            paddingHorizontal: 20,
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name={'chevron-back'} color={APPCOLORS.WHITE} size={30} />
          </TouchableOpacity>

          <View
            style={{
              height: 40,
              width: '85%',
              backgroundColor: APPCOLORS.TEXTFIELDCOLOR,
              borderRadius: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 10,
            }}>
            <TextInput
              placeholder="Search"
              style={{width: '80%'}}
              onChangeText={txt => {
                setSearch(txt);
              }}
              value={Search}
            />

            <TouchableOpacity>
              <AntDesign name={'search1'} color={APPCOLORS.BLACK} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* 
      <View
        style={{
          marginTop: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '90%',
          alignSelf: 'center',
        }}>
        <TouchableOpacity
          onPress={() => {
            getAllOrders(0), setselectedType(0);
          }}
          style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              height: 15,
              width: 15,
              borderWidth: 1,
              borderRadius: 3,
              backgroundColor: selectedType == 0 ? APPCOLORS.BTN_COLOR : null,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              marginLeft: 5,
              fontWeight: 'bold',
              color: 'black',
            }}>
            ALL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            getAllOrders(1), setselectedType(1);
          }}
          style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              height: 15,
              width: 15,
              borderWidth: 1,
              borderRadius: 3,
              backgroundColor: selectedType == 1 ? APPCOLORS.BTN_COLOR : null,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              marginLeft: 5,
              fontWeight: 'bold',
              color: 'black',
            }}>
            Productive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            getAllOrders(2), setselectedType(2);
          }}
          style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              height: 15,
              width: 15,
              borderWidth: 1,
              borderRadius: 3,
              backgroundColor: selectedType == 2 ? APPCOLORS.BTN_COLOR : null,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              marginLeft: 5,
              fontWeight: 'bold',
              color: 'black',
            }}>
            Non Productive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            getAllOrders(3), setselectedType(3);
          }}
          style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              height: 15,
              width: 15,
              borderWidth: 1,
              borderRadius: 3,
              backgroundColor: selectedType == 3 ? APPCOLORS.BTN_COLOR : null,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              marginLeft: 5,
              fontWeight: 'bold',
              color: 'black',
            }}>
            New
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* {console.log('filteredOrders.............', filteredOrders.length)} */}
      {Loader == true ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <LottieView
            source={require('../../../assets/images/Loader.json')}
            style={{height: 250, width: 250, alignSelf: 'center'}}
            autoPlay
            loop
          />
        </View>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          {/* {loadermore == true ? (
            <View
              style={{
                position: 'absolute',
                zIndex: 100,
                alignSelf: 'center',
                backgroundColor: 'black',
                borderRadius: 2000,
              }}>
              <ActivityIndicator
                size={'large'}
                color={'white'}
                style={{alignSelf: 'center'}}
              />
            </View>
          ) : null} */}

          <>
            {filteredOrders?.length > 0 ? (
              <FlatList
                data={filteredOrders}
                // onEndReached={() => {
                // //   loaderMoreData(selectedType);
                // }}
                // onEndReachedThreshold={1} // Trigger when 50% close to the end
                renderItem={({item, index}) => {
                  console.log('item', item.supp_name);

                  //   return
                  return (
                    <View
                      key={index}
                      style={{
                        borderRadius: 20,
                        elevation: 10,
                        backgroundColor: APPCOLORS.CLOSETOWHITE,
                        marginTop: 10,
                        width: responsiveWidth(90),
                        alignSelf: 'center',
                        padding: 10,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <View style={{flexDirection: 'row'}}>
                          <Octicons
                            name={'person'}
                            color={APPCOLORS.BLACK}
                            size={20}
                          />
                          <Text
                            style={{color: APPCOLORS.BLACK, marginLeft: 10}}>
                            {item?.supp_name}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(`tel:${item?.supp_ref}`)
                          }
                          style={{flexDirection: 'row'}}>
                          <AntDesign
                            name={'phone'}
                            color={APPCOLORS.BLACK}
                            size={20}
                          />
                          <Text
                            style={{color: APPCOLORS.BLACK, marginLeft: 10}}>
                            {item?.supp_ref}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => openGoogleMaps(item.address)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 10,
                        }}>
                        <EvilIcons
                          name={'location'}
                          color={APPCOLORS.BLACK}
                          size={22}
                        />
                        <Text
                          style={{color: APPCOLORS.BLACK}}
                          numberOfLines={1}>
                          {item.address}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={{
                          flexDirection: 'row',
                          width: '100%',
                          justifyContent: 'space-between',
                          marginTop: 20,
                        }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('AddItems', {
                              data: item,
                              userType: type,
                            })
                          }
                          style={{width: '47%'}}>
                          <PlatformGradient
                            colors={[
                              '#9BC8E2',
                              APPCOLORS.BTN_COLOR,
                              APPCOLORS.BTN_COLOR,
                            ]}
                            style={{
                              height: 40,
                              borderRadius: 100,
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 10,
                              width: '100%',
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.WHITE,
                                fontSize: 12,
                                fontWeight: 'bold',
                              }}>
                              Take Order
                            </Text>
                          </PlatformGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('AddItems', {
                              data: item,
                              type: 11,
                            })
                          }
                          style={{width: '47%'}}>
                          <PlatformGradient
                            colors={[
                              '#9BC8E2',
                              APPCOLORS.BTN_COLOR,
                              APPCOLORS.BTN_COLOR,
                            ]}
                            style={{
                              height: 40,
                              borderRadius: 100,
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 10,
                              width: '100%',
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.WHITE,
                                fontSize: 12,
                                fontWeight: 'bold',
                              }}>
                              Return
                            </Text>
                          </PlatformGradient>
                        </TouchableOpacity>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 10,
                        }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('PaymentScreen', {
                              data: item,
                              userType: type,
                            })
                          }>
                          <PlatformGradient
                            colors={[
                              '#9BC8E2',
                              APPCOLORS.BTN_COLOR,
                              APPCOLORS.BTN_COLOR,
                            ]}
                            style={{
                              height: 40,
                              borderRadius: 100,
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 10,
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.WHITE,
                                fontSize: 12,
                                fontWeight: 'bold',
                              }}>
                              Payment
                            </Text>
                          </PlatformGradient>
                        </TouchableOpacity>

                        <View
                          style={{
                            flexDirection: 'row',
                            width: '80%',
                            justifyContent: 'space-around',
                          }}>
                          <View>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontWeight: 'bold',
                              }}>
                              Last Order
                            </Text>
                            <Text>{item?.last_order_date}</Text>
                          </View>

                          <View>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontWeight: 'bold',
                              }}>
                              Total Order
                            </Text>
                            <Text>{formatNumber(item.last_order_total)}</Text>
                          </View>

                          <View>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontWeight: 'bold',
                              }}>
                              Total Pay
                            </Text>
                            <Text>Rs {formatNumber(item.current_balance)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <Text style={{color: APPCOLORS.BLACK, fontSize: 20}}>
                No Record Found
              </Text>
            )}
          </>
        </View>
      )}

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('InsertNewCustomerDetail', {
            allCustomer: AllOrders,
          })
        }
        style={{
          backgroundColor: 'red',
          height: 50,
          width: '100%',
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <PlatformGradient
          colors={['#9BC8E2', APPCOLORS.BTN_COLOR, APPCOLORS.BTN_COLOR]}
          style={{
            height: 50,
            width: '100%',
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 10,
          }}>
          <Text
            style={{color: APPCOLORS.WHITE, fontSize: 20, fontWeight: 'bold'}}>
            Add new Supplier
          </Text>
        </PlatformGradient>
      </TouchableOpacity>
    </View>
  );
};

export default SupplierHome;
