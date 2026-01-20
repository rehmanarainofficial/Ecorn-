import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import axios from 'axios';

import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {BASEURL} from '../../../utils/BaseUrl';
import {formatNumber} from '../../../utils/NumberUtils';
const NewOrders = ({navigation}) => {
  const CurrentUser = useSelector(state => state.Data.currentData);

  const [todaysOrder, setTodaysOrder] = useState();

  const [loader, setLoader] = useState(false);
  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      getTodaysOrder();
    });

    return nav;
  }, []);

  console.log('CurrentUser?.id', CurrentUser?.id);

  const getTodaysOrder = () => {
    setLoader(true);
    let data = new FormData();
    data.append('user_id', CurrentUser?.id);

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
        console.log(JSON.stringify(response.data));
        setTodaysOrder(response.data.data);
        setLoader(false);
      })
      .catch(error => {
        console.log(error);
        setLoader(false);
      });
  };

  const deleteOrder = item => {
    let datas = new FormData();
    datas.append('CustName', item?.br_name);
    datas.append('trans_type', '30');
    datas.append('person_id', '');
    datas.append('ord_date', item.ord_date);
    datas.append('payments', '');
    datas.append('order_no', item.order_no);
    datas.append('order_status', '1');
    datas.append('location', 'DEF');
    datas.append('dimension', '0');
    datas.append('price_list', '');
    datas.append('comments', '');
    datas.append('tax_included', '');
    datas.append('total', item?.order_total);
    datas.append('total_disc', '');
    datas.append('freight_cost', '');

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
        getTodaysOrder();
      })
      .catch(async error => {
        console.log(error);
      });
  };

  //   const editOrder = item => {
  //     let datas = new FormData();
  //     datas.append('CustName', item?.br_name);
  //     datas.append('trans_type', '30');
  //     datas.append('person_id', '');
  //     datas.append('ord_date', item.ord_date);
  //     datas.append('payments', '');
  //     datas.append('order_no', item.order_no);
  //     datas.append('order_status', '1');
  //     datas.append('location', 'DEF');
  //     datas.append('dimension', '0');
  //     datas.append('price_list', '');
  //     datas.append('comments', '');
  //     datas.append('tax_included', '');
  //     datas.append('total', item?.order_total);
  //     datas.append('total_disc', '');
  //     datas.append('freight_cost', '');

  //     let config = {
  //       method: 'post',
  //       maxBodyLength: Infinity,
  //       url: `${BASEURL}mobile/post_service_purch_sale.php`,
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //       data: datas,
  //     };

  //     axios
  //       .request(config)
  //       .then(async response => {
  //         console.log(JSON.stringify(response.data));
  //         getTodaysOrder();
  //       })
  //       .catch(async error => {
  //         console.log(error);
  //       });
  //   };

  const confirmDelete = item => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => deleteOrder(item),
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <View style={{padding: 20}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={'arrow-back'} size={25} color={'black'} />
        </TouchableOpacity>
        <Text
          style={{
            fontWeight: 'bold',
            color: APPCOLORS.BLACK,
            fontSize: 18,
            marginLeft: 10,
          }}>
          Orders
        </Text>
      </View>
      {loader == true ? (
        <View
          style={{
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator size={'large'} color={APPCOLORS.BLACK} />
        </View>
      ) : (
        <FlatList
          data={todaysOrder}
          renderItem={({item}) => {
            console.log('item', item);

            return (
              <View
                style={{
                  marginTop: 20,
                  backgroundColor: APPCOLORS.WHITE,
                  padding: 10,
                  borderRadius: 10,
                }}>
                <View
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    zIndex: 100,
                    justifyContent: 'space-between',

                    height: '100%',
                  }}>
                  {/* <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    style={{alignItems: 'center', justifyContent: 'center'}}>
                    <AntDesign name={'edit'} color={'lightblue'} size={25} />
                    <Text>Edit</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    style={{alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialCommunityIcons
                      name={'delete'}
                      color={'red'}
                      size={25}
                    />
                    <Text>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('TodayOrderDetails', {item: item})
                    }
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: APPCOLORS.SKY_BLUE,
                      padding: 10,
                      borderRadius: 200,
                    }}>
                    <Text style={{color: APPCOLORS.WHITE, fontWeight: 'bold'}}>
                      View Detail
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{fontSize: 16, color: APPCOLORS.BLACK}}>
                  {' '}
                  <Text style={{color: APPCOLORS.BLACK, fontWeight: 'bold'}}>
                    Order No :
                  </Text>{' '}
                  {item.order_no}
                </Text>
                <Text style={{fontSize: 16, color: APPCOLORS.BLACK}}>
                  {' '}
                  <Text style={{color: APPCOLORS.BLACK, fontWeight: 'bold'}}>
                    Name :
                  </Text>{' '}
                  {item.br_name}
                </Text>
                <Text style={{fontSize: 16, color: APPCOLORS.BLACK}}>
                  {' '}
                  <Text style={{color: APPCOLORS.BLACK, fontWeight: 'bold'}}>
                    Ref No :
                  </Text>{' '}
                  {item.branch_ref}
                </Text>
                <Text style={{fontSize: 16, color: APPCOLORS.BLACK}}>
                  {' '}
                  <Text style={{color: APPCOLORS.BLACK, fontWeight: 'bold'}}>
                    Order Date :
                  </Text>{' '}
                  {item.ord_date}
                </Text>
                <Text style={{fontSize: 16, color: APPCOLORS.BLACK}}>
                  {' '}
                  <Text style={{color: APPCOLORS.BLACK, fontWeight: 'bold'}}>
                    Total Amount :
                  </Text>{' '}
                  {formatNumber(item.total)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default NewOrders;
