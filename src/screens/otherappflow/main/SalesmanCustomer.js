import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import axios from 'axios';

import Ionicons from 'react-native-vector-icons/Ionicons';

import LottieView from 'lottie-react-native';

import PlatformGradient from '../../../components/PlatformGradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import {useSelector} from 'react-redux';
import {BASEURL} from '../../../utils/BaseUrl';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber} from '../../../utils/NumberUtils';

const SalesmanCustomer = ({navigation, route}) => {
  const {salesman_code} = route.params;

  console.log('salesman_code=========>', salesman_code);

  const [salesmanscustomer, setsalesmanscustomer] = useState([]);
  const [selectedType, setselectedType] = useState(0);
  const [page, setPage] = useState(1);
  const [loader, setLoader] = useState(true);
  const [loadermore, setLoadMore] = useState(false);

  const currentData = useSelector(state => state.Data.currentData);
  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      getAllOrders();
    });

    return nav;
  }, [navigation]);

  const getAllOrders = num => {
    console.log('page', page);
    setLoadMore(true);
    let data = new FormData();
    data.append('salesman_code', salesman_code);
    data.append('page', page);
    data.append('customer_status', num);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}salesman_wise_cust.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(response => {
        console.log('ssssssssssss', SON.stringify(response.data));
        setLoader(false);
        setsalesmanscustomer(prevData => [...prevData, ...response.data.data]);
        setPage(prevPage => prevPage + 1);
        setLoadMore(false);
      })
      .catch(error => {
        console.log(error);
        setLoader(false);
        setLoadMore(false);
      });
  };
  return (
    <View style={{flex: 1, backgroundColor: APPCOLORS.CLOSETOWHITE}}>
      <View style={{backgroundColor: APPCOLORS.BTN_COLOR}}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OfflineOrders')}
          style={{
            height: 50,
            width: '90%',
            alignSelf: 'center',
            backgroundColor: APPCOLORS.BLACK,
            marginTop: 10,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{color: APPCOLORS.WHITE, fontSize: 18, fontWeight: 'bold'}}>
            Check Offline Orders
          </Text>
        </TouchableOpacity>
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

          {/* <View
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
          </View> */}
        </View>
      </View>
      {loader == true ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <LottieView
            source={require('../../../assets/images/Loader.json')}
            style={{height: 250, width: 250, alignSelf: 'center'}}
            autoPlay
            loop
          />
        </View>
      ) : (
        <View style={{flex: 1}}>
          {loadermore == true ? (
            <View
              style={{position: 'absolute', zIndex: 100, alignSelf: 'center'}}>
              <ActivityIndicator
                size={'large'}
                color={'black'}
                style={{alignSelf: 'center'}}
              />
            </View>
          ) : null}

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
                  backgroundColor:
                    selectedType == 0 ? APPCOLORS.BTN_COLOR : null,
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
                  backgroundColor:
                    selectedType == 1 ? APPCOLORS.BTN_COLOR : null,
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
                  backgroundColor:
                    selectedType == 2 ? APPCOLORS.BTN_COLOR : null,
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
                  backgroundColor:
                    selectedType == 3 ? APPCOLORS.BTN_COLOR : null,
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
          </View>

          {salesmanscustomer?.length > 0 ? (
            <FlatList
              data={salesmanscustomer}
              onEndReached={() => {
                getAllOrders(selectedType);
              }}
              onEndReachedThreshold={0.5} // Trigger when 50% close to the end
              renderItem={({item, index}) => {
                console.log('first', item);
                return (
                  <View
                    key={index}
                    style={{
                      borderRadius: 20,
                      elevation: 10,
                      backgroundColor: APPCOLORS.CLOSETOWHITE,
                      marginTop: 10,
                      width: '90%',
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
                        <Text style={{color: APPCOLORS.BLACK, marginLeft: 10}}>
                          {item?.name}
                        </Text>
                      </View>

                      <View style={{flexDirection: 'row'}}>
                        <AntDesign
                          name={'phone'}
                          color={APPCOLORS.BLACK}
                          size={20}
                        />
                        <Text style={{color: APPCOLORS.BLACK, marginLeft: 10}}>
                          {item?.debtor_ref}
                        </Text>
                      </View>
                    </View>

                    <View
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
                      <Text style={{color: APPCOLORS.BLACK}} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>

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
                            customer: true,
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
                          navigation.navigate('PaymentScreen', {data: item})
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
            <View
              style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
              <Text
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: APPCOLORS.BLACK,
                  fontSize: 20,
                }}>
                No Customer Found
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('InsertNewCustomerDetail', {
            allCustomer: salesmanscustomer,
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
            Add new customer
          </Text>
        </PlatformGradient>
      </TouchableOpacity>
    </View>
  );
};

export default SalesmanCustomer;
