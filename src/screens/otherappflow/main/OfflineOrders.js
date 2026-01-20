import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';
import axios from 'axios';
import {BASEURL} from '../../../utils/BaseUrl';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber, formatQuantity} from '../../../utils/NumberUtils';

const OfflineOrders = ({navigation}) => {
  const [Search, setSearch] = useState('');
  const [fetchAllOffline, setFetchOffLine] = useState([]);
  const [loading, setloading] = useState(false);
  const CurrentUser = useSelector(state => state.Data.currentData);
  const dispatch = useDispatch();

  useEffect(() => {
    getSavedData();
  }, []);

  const getSavedData = async () => {
    setloading(true);
    const res = await AsyncStorage.getItem('setUserOr');

    const parsed = JSON.parse(res);
    setFetchOffLine(parsed);
    setloading(false);
  };

  const confirm_Order = () => {
    const date = Date.now();
    const formattedDate = moment(date).format('YYYY-MM-DD');

    fetchAllOffline.forEach(data => {
      console.log('data', data.purch_order_details);

      // return

      let datas = new FormData();
      datas.append('CustName', data?.CustName);
      datas.append('trans_type', '30');
      datas.append('person_id', data?.person_id);
      datas.append('ord_date', data.ord_date);
      datas.append('payments', data.paymentType);
      datas.append('location', 'DEF');
      datas.append('dimension', '0');
      datas.append('price_list', '');
      datas.append('comments', '');
      datas.append('tax_included', '');
      datas.append('total', data?.total);
      datas.append('total_disc', '');
      datas.append('ship_via', data.ship_via);
      datas.append('freight_cost', '');
      datas.append('purch_order_details', data.purch_order_details);
      datas.append('loc_code', data?.loc_code);
      datas.append('dim_id', data?.dim_id);
      datas.append('salesman', data?.salesman);
      datas.append('user_id', data?.user_id);

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${BASEURL}post_service_purch_sale.php`,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: datas,
      };

      axios
        .request(config)
        .then(async response => {
          console.log(JSON.stringify(response.data));
          // dispatch(setLoader(false));
          // dispatch(setCartData([]));
          console.log('successfulyy uploaded');
          await AsyncStorage.removeItem(`${data?.debtor_no}`);
          await AsyncStorage.removeItem(`${data?.debtor_no}_GrandTotal`);
          await AsyncStorage.removeItem(`setUserOr`);
          getSavedData();
        })
        .catch(async error => {
          console.log(error);

          // dispatch(setLoader(false));
        });
    });
  };
  return (
    <View>
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

        <TouchableOpacity
          onPress={() => confirm_Order()}
          style={{
            height: 40,
            width: '85%',
            backgroundColor: APPCOLORS.TEXTFIELDCOLOR,
            borderRadius: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
          }}>
          <Text
            style={{color: APPCOLORS.BLACK, fontWeight: 'bold', fontSize: 18}}>
            Confirm Order
          </Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size={'large'} color={'black'} />}
      <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 120}}>
        <FlatList
          data={fetchAllOffline}
          renderItem={({item}) => {
            console.log('item', item);
            return (
              <View style={{padding: 20}}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: APPCOLORS.BLACK,
                  }}>
                  {item?.CustName}
                </Text>
                {
                  <FlatList
                    data={JSON.parse(item.purch_order_details)}
                    renderItem={({item}) => {
                      // console.log('first', item);
                      return (
                        <View
                          style={{
                            backgroundColor: APPCOLORS.CLOSETOWHITE,
                            marginTop: 20,
                            borderRadius: 10,
                            padding: 10,
                          }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginTop: 30,
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>
                              Product name
                            </Text>
                            <Text
                              style={{color: APPCOLORS.BLACK, fontSize: 15}}>
                              {item?.description}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginTop: 10,
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>
                              Quantity
                            </Text>

                            <Text
                              style={{color: APPCOLORS.BLACK, fontSize: 15}}>
                              {formatQuantity(item?.quantity_ordered)}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginTop: 10,
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>
                              Per_Unit Price
                            </Text>
                            <Text
                              style={{color: APPCOLORS.BLACK, fontSize: 15}}>
                              Rs {formatNumber(item?.unit_price)}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginTop: 10,
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>
                              Product Discount
                            </Text>
                            <Text
                              style={{color: APPCOLORS.BLACK, fontSize: 15}}>
                              Rs {formatNumber(item?.ProductDiscount)}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginTop: 10,
                            }}>
                            <Text
                              style={{
                                color: APPCOLORS.BLACK,
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>
                              Grand Total
                            </Text>

                            <Text
                              style={{color: APPCOLORS.BLACK, fontSize: 15}}>
                              Rs {formatNumber(item.GrandTotal)}
                            </Text>
                          </View>
                        </View>
                      );
                    }}
                  />
                }
              </View>
            );
          }}
        />
      </ScrollView>
    </View>
  );
};

export default OfflineOrders;
