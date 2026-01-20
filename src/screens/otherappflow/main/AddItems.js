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

import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../components/PlatformGradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import axios from 'axios';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {
  setCartData,
  setLoader,
  setGrandCartTotalPrice,
  setAllProducts,
} from '../../../redux/AuthSlice';
import {addEventListener} from '@react-native-community/netinfo';
import {fetch} from '@react-native-community/netinfo';
import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';
import {BASEURL} from '../../../utils/BaseUrl';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber, formatQuantity} from '../../../utils/NumberUtils';
import {responsiveWidth} from '../../../utils/Responsive';

const AddItems = ({navigation, route}) => {
  const {data, type, customer, userType} = route.params;

  const [internetConnected, setInternetConnected] = useState(false);

  fetch().then(state => {
    console.log('Connection type', state.type);
    console.log('Is connected?', state.isConnected);
    setInternetConnected(state.isConnected);
  });

  // Subscribe
  useEffect(() => {
    const unsubscribe = addEventListener(async state => {
      console.log('Connection type', state.type);

      if (internetConnected == false) {
        const getallproducts = await AsyncStorage.getItem('AllProducts');
        dispatch(setAllProducts(JSON.parse(getallproducts)));
      }
    });
    // Unsubscribe
    unsubscribe();
  }, []);

  const isLoader = useSelector(state => state.Data.Loading);
  const cart = useSelector(state => state.Data.cartData);
  const CurrentUser = useSelector(state => state.Data.currentData);
  const GrandCartTotalPrice = useSelector(
    state => state.Data.GrandCartTotalPrice,
  );
  const AllProducts = useSelector(state => state.Data.AllProduct);

  console.log('GrandCartTotalPrice.............cart', cart);
  // Sum all GrandTotal values
  let totalSum = cart?.reduce((sum, product) => {
    return sum + parseFloat(product.GrandTotal);
  }, 0);

  console.log('totalSum', totalSum);

  const [allProducts, setProducts] = useState();

  const [ProductModal, setProductModal] = useState(false);

  const [Search, setSearch] = useState('');

  const [selectProduct, setSelectProduct] = useState();

  const [total, setTotal] = useState(1);

  const [itemCode, setItemCode] = useState();

  const [ProductPrice, setProductPrice] = useState('0');

  const [ProductDiscount, setProductDiscount] = useState('0');

  const [paymentType, setpaymentType] = useState('32');
  const [OrderLoader, setOrderLoader] = useState(false);
  const dispatch = useDispatch();

  console.log('selectProduct', selectProduct);

  const subtraction = mode => {
    if (mode == 'plus') {
      setTotal(total + 1);
    } else {
      if (total == 1) {
      } else {
        setTotal(total - 1);
      }
    }
  };

  const AddItemss = async () => {
    console.log('first', paymentType);

    if (type !== 11) {
      if (paymentType == '') {
        Toast.show({
          type: 'error',
          text1: 'Please select your payment type',
        });
        return; // Stop if payment type is not selected
      }
    }

    setOrderLoader(true);

    const date = Date.now();
    const formattedDate = moment(date).format('YYYY-MM-DD');

    const getSavedData = await AsyncStorage.getItem('setUserOr');
    let orderPostArray = [];

    if (getSavedData) {
      orderPostArray = JSON.parse(getSavedData);
    }

    const existingOrderIndex = orderPostArray.findIndex(
      order => order.person_id === data?.debtor_no,
    );

    const newOrderDetails = JSON.stringify(cart);

    if (existingOrderIndex !== -1) {
      const existingOrder = orderPostArray[existingOrderIndex];

      if (existingOrder.purch_order_details !== newOrderDetails) {
        existingOrder.purch_order_details = newOrderDetails;
        existingOrder.total = totalSum;
        existingOrder.ord_date = formattedDate;
        console.log('Order updated with new cart details.');
      } else {
        console.log('Cart is the same, no update needed.');
      }
    } else {
      const newOrder = {
        CustName: data?.name,
        person_id: data?.debtor_no,
        ord_date: formattedDate,
        total: totalSum,
        ProductDiscount: ProductDiscount,
        purch_order_details: newOrderDetails,
        loc_code: CurrentUser?.loc_code,
        dim_id: CurrentUser?.dim_id,
        salesman: CurrentUser?.salesman,
        user_id: CurrentUser?.id,
        paymentType: '1',
        ship_via: CurrentUser?.ship_via,
      };

      orderPostArray.push(newOrder);
      console.log('New order added.');
    }

    // Check if the app is connected to the internet
    NetInfo.fetch().then(async state => {
      if (!state.isConnected) {
        // Save locally if offline
        await AsyncStorage.setItem('setUserOr', JSON.stringify(orderPostArray));
        Toast.show({
          type: 'success',
          text1: 'Order saved in offline mode',
        });
        dispatch(setLoader(false));
        dispatch(setCartData([]));
        setSelectProduct();
        setProductDiscount('0');
        setProductPrice('0');
        dispatch(setGrandCartTotalPrice('0'));
        setOrderLoader(false);
      } else {
        // Proceed with API call if online
        if (cart?.length > 0) {
          let datas = new FormData();
          datas.append('CustName', data?.name);
          datas.append(
            'trans_type',
            paymentType ? JSON.stringify(paymentType) : '30',
          );
          datas.append('person_id', data?.debtor_no);
          datas.append('ord_date', formattedDate);
          datas.append('payments', '1');
          datas.append('location', 'DEF');
          datas.append('dimension', '0');
          datas.append('price_list', '');
          datas.append('comments', '');
          datas.append('tax_included', '');
          datas.append('total', totalSum);
          datas.append('total_disc', '');
          datas.append('ship_via', CurrentUser?.ship_via);
          datas.append('freight_cost', '');
          datas.append('purch_order_details', JSON.stringify(cart));
          datas.append('loc_code', CurrentUser?.loc_code);
          datas.append('dim_id', CurrentUser?.dim_id);
          datas.append('salesman', CurrentUser?.salesman);
          datas.append('user_id', CurrentUser?.id);

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
              dispatch(setLoader(false));
              dispatch(setCartData([]));
              Toast.show({
                type: 'success',
                text1: 'Successfully created',
              });

              await AsyncStorage.removeItem(`${data?.debtor_no}`);
              await AsyncStorage.removeItem('setUserOr');
              dispatch(setGrandCartTotalPrice('0'));
              setOrderLoader(false);
            })
            .catch(async error => {
              console.log(error);
              Toast.show({
                type: 'success',
                text1: 'Order saved in offline mode',
              });
              dispatch(setCartData([]));
              dispatch(setLoader(false));
              setOrderLoader(false);
            });
        } else {
          dispatch(setCartData([]));
          Toast.show({
            type: 'error',
            text1: 'Nothing in the cart',
          });
          dispatch(setLoader(false));
          setOrderLoader(false);
        }
      }
    });
  };

  console.log('first', cart);

  const addToCart = async () => {
    if (!selectProduct) {
      Toast.show({
        type: 'error',
        text1: 'Please Select a Product',
      });
    } else if (!ProductPrice) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a Product Price',
      });
    } else if (!itemCode) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a Product Price',
      });
    } else {
      // Create a new item object

      const isExist = cart?.some(item => item.item_code === itemCode);

      console.log('is exist?', isExist);

      if (isExist == true) {
        Toast.show({
          type: 'error',
          text1: 'Item already exists in the cart',
        });
      } else {
        console.log('product Price : ', (ProductPrice * total).toFixed(2));
        console.log('product Discount : ', ProductDiscount);
        console.log('Grand Total : ', totalSum);
        console.log('total : ', total);

        let discountedPrice =
          ProductPrice - ProductPrice * (ProductDiscount / 100);
        let totalPrice = (discountedPrice * total).toFixed(2);

        dispatch(setGrandCartTotalPrice(totalPrice));

        const newItem = {
          description: selectProduct?.description,
          unit_price: ProductPrice, // Assuming ProductPrice is a string, convert it to a float
          quantity_ordered: total,
          item_code: itemCode,
          ProductDiscount: ProductDiscount,
          GrandTotal: totalPrice,
        };

        console.log('ProductDiscount.............................', newItem);
        // Use the spread operator to create a new array with the existing cart items and the new item
        const newCart = [...cart, newItem];

        // Update the cart state

        dispatch(setCartData(newCart));

        console.log('first', console.log('newCart', newCart, data?.debtor_no));

        console.log('internetConnected', internetConnected);
        // if (internetConnected == false) {

        await AsyncStorage.setItem(
          `${data?.debtor_no}`,
          JSON.stringify(newCart),
        );

        await AsyncStorage.setItem(
          `${data?.debtor_no}_GrandTotal`,
          JSON.stringify(totalSum),
        );
        // }

        setSelectProduct();
        setProductDiscount('0');
        setProductPrice('0');
        setItemCode();
        setTotal(1);
      }
    }
  };

  const filteredProducts = AllProducts?.filter(val => {
    const itemNameLowerCase = val.description.toLowerCase();

    if (Search == '') {
      return val;
    } else if (itemNameLowerCase?.includes(Search.toLowerCase())) {
      return val;
    }
  });

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1}}>
      <View style={{flex: 1, backgroundColor: APPCOLORS.BTN_COLOR}}>
        <View
          style={{
            flexDirection: 'row',
            padding: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            onPress={() => {
              dispatch(setCartData([])),
                navigation.goBack(),
                dispatch(setGrandCartTotalPrice('0'));
            }}>
            <Ionicons name={'chevron-back'} color={APPCOLORS.WHITE} size={30} />
          </TouchableOpacity>

          <View>
            <TouchableOpacity
              style={{
                height: 30,
                width: 30,
                backgroundColor: 'red',
                position: 'absolute',
                zIndex: 100,
                borderRadius: 200,
                top: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                {cart?.length > 0 ? cart?.length : '0'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ItemList', {data: data})}>
              <PlatformGradient
                colors={['#9BC8E2', '#007BC1']}
                style={{
                  height: 40,
                  alignSelf: 'center',
                  borderRadius: 20,
                  marginTop: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 10,
                }}>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}>
                  Total Items
                </Text>
              </PlatformGradient>
            </TouchableOpacity>
          </View>
        </View>

        {type == 11 ? null : (
          <>
            {/* <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
                alignSelf: 'center',
                marginBottom: 20,
              }}>
              <TouchableOpacity
                onPress={() => setpaymentType('1')}
                style={{flexDirection: 'row'}}>
                <View
                  style={{
                    height: 30,
                    width: 30,
                    borderWidth: 2,
                    borderRadius: 200,
                    borderColor: APPCOLORS.WHITE,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {paymentType == '1' ? (
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        borderRadius: 2000,
                        backgroundColor: APPCOLORS.WHITE,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,

                    fontSize: 23,
                    marginLeft: 5,
                    fontWeight: 'bold',
                  }}>
                  Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setpaymentType('2')}
                style={{flexDirection: 'row'}}>
                <View
                  style={{
                    height: 30,
                    width: 30,
                    borderWidth: 2,
                    borderRadius: 200,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: APPCOLORS.WHITE,
                    marginLeft: 40,
                  }}>
                  {paymentType == '2' ? (
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        borderRadius: 2000,
                        backgroundColor: APPCOLORS.WHITE,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,
                    fontSize: 23,
                    marginLeft: 5,
                    fontWeight: 'bold',
                  }}>
                  Credit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Visit', {data: data})}
                style={{flexDirection: 'row'}}>
                <View
                  style={{
                    height: 30,
                    borderColor: APPCOLORS.WHITE,
                    width: 30,
                    borderWidth: 2,
                    borderRadius: 200,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 40,
                  }}>
                  {paymentType == '3' ? (
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        borderRadius: 2000,
                        backgroundColor: APPCOLORS.WHITE,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,
                    fontSize: 23,
                    marginLeft: 5,
                    fontWeight: 'bold',
                  }}>
                  Visit
                </Text>
              </TouchableOpacity>
            </View> */}
            {/* po grn invoice */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
                alignSelf: 'center',
                marginBottom: 20,
                gap: 20,
              }}>
              <TouchableOpacity
                onPress={() =>
                  setpaymentType(userType == 'supplier' ? '18' : '30')
                }
                style={{flexDirection: 'row'}}>
                <View
                  style={{
                    height: 30,
                    width: 30,
                    borderWidth: 2,
                    borderRadius: 200,
                    borderColor: APPCOLORS.WHITE,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {paymentType == '32' || paymentType === '18' ? (
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        borderRadius: 2000,
                        backgroundColor: APPCOLORS.WHITE,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,

                    fontSize: 23,
                    marginLeft: 5,
                    fontWeight: 'bold',
                  }}>
                  {userType == 'supplier' ? 'Po' : 'Quotation'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setpaymentType(userType == 'supplier' ? '25' : '30')
                }
                style={{flexDirection: 'row'}}>
                <View
                  style={{
                    height: 30,
                    width: 30,
                    borderWidth: 2,
                    borderRadius: 200,
                    borderColor: APPCOLORS.WHITE,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {paymentType == '30' || paymentType == '25' ? (
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        borderRadius: 2000,
                        backgroundColor: APPCOLORS.WHITE,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,

                    fontSize: 23,
                    marginLeft: 5,
                    fontWeight: 'bold',
                  }}>
                  {userType == 'supplier' ? 'Grn' : 'Order'}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
                alignSelf: 'center',
                marginBottom: 20,
                gap: 20,
              }}>
              <TouchableOpacity
                onPress={() =>
                  setpaymentType(userType == 'supplier' ? '20' : '10')
                }
                style={{flexDirection: 'row'}}>
                <View
                  style={{
                    height: 30,
                    width: 30,
                    borderWidth: 2,
                    borderRadius: 200,
                    borderColor: APPCOLORS.WHITE,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {paymentType == '10' || paymentType == '20' ? (
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        borderRadius: 2000,
                        backgroundColor: APPCOLORS.WHITE,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: APPCOLORS.WHITE,

                    fontSize: 23,
                    marginLeft: 5,
                    fontWeight: 'bold',
                  }}>
                  Invoice
                </Text>
              </TouchableOpacity>

              {userType == 'supplier' ? null : (
                <TouchableOpacity
                  onPress={() => setpaymentType('13')}
                  style={{flexDirection: 'row'}}>
                  <View
                    style={{
                      height: 30,
                      width: 30,
                      borderWidth: 2,
                      borderRadius: 200,
                      borderColor: APPCOLORS.WHITE,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {paymentType == '13' ? (
                      <View
                        style={{
                          height: 20,
                          width: 20,
                          borderRadius: 2000,
                          backgroundColor: APPCOLORS.WHITE,
                        }}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={{
                      color: APPCOLORS.WHITE,

                      fontSize: 23,
                      marginLeft: 5,
                      fontWeight: 'bold',
                    }}>
                    Delivery
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <View
          style={{
            flex: 1,
            backgroundColor: '#9BC8E2',
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            padding: 20,
          }}>
          <TouchableOpacity
            onPress={() => {
              setProductModal(true);
            }}
            style={{
              height: 50,
              flexDirection: 'row',
              backgroundColor: APPCOLORS.WHITE,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              borderRadius: 10,
            }}>
            <Text style={{color: APPCOLORS.BLACK}}>Select Product</Text>
            <Text style={{width: '60%'}} numberOfLines={1}>
              {selectProduct?.description}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              height: 50,
              flexDirection: 'row',
              backgroundColor: APPCOLORS.WHITE,
              alignItems: 'center',
              paddingHorizontal: 20,
              borderRadius: 10,
              marginTop: 10,
              justifyContent: 'space-between',
            }}>
            <Text style={{color: APPCOLORS.BLACK}}>Quantity :</Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 20,
              }}>
              <TouchableOpacity
                onPress={() => subtraction('minus')}
                style={{
                  height: 30,
                  width: 30,
                  borderRadius: 10,
                  backgroundColor: APPCOLORS.BTN_COLOR,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{fontSize: 20, color: APPCOLORS.WHITE}}>-</Text>
              </TouchableOpacity>

              <TextInput
                placeholder={JSON.stringify(total)}
                placeholderTextColor={'black'}
                value={String(total)} // Ensure total is shown as a string in the input
                onChangeText={txt => {
                  setTotal(Number(txt)); // Convert input to number
                }}
                style={{
                  color: APPCOLORS.BLACK,
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginLeft: 10,
                  marginRight: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
                keyboardType="number-pad"
                numberOfLines={1}
                multiline={false}
              />

              <TouchableOpacity
                onPress={() => subtraction('plus')}
                style={{
                  height: 30,
                  width: 30,
                  borderRadius: 10,
                  backgroundColor: APPCOLORS.BTN_COLOR,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{fontSize: 20, color: APPCOLORS.WHITE}}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              height: 50,
              flexDirection: 'row',
              backgroundColor: APPCOLORS.WHITE,
              alignItems: 'center',
              paddingHorizontal: 20,
              borderRadius: 10,
              marginTop: 10,
              justifyContent: 'space-between',
            }}>
            <Text style={{color: APPCOLORS.BLACK}}>Price :</Text>

            <TextInput
              keyboardType="decimal-pad"
              style={{
                borderBottomWidth: 1,
                borderColor: APPCOLORS.BLACK,
                width: '75%',
                padding: 0,
                marginBottom: 10,
                marginLeft: 10,
              }}
              value={ProductPrice}
              onChangeText={txt => {
                setProductPrice(txt);
              }}
            />
          </View>

          <View
            style={{
              height: 50,
              flexDirection: 'row',
              backgroundColor: APPCOLORS.WHITE,
              alignItems: 'center',
              paddingHorizontal: 20,
              borderRadius: 10,
              marginTop: 10,
              justifyContent: 'space-between',
            }}>
            <Text style={{color: APPCOLORS.BLACK}}>Discount :</Text>

            <TextInput
              keyboardType="decimal-pad"
              style={{
                borderBottomWidth: 1,
                borderColor: APPCOLORS.BLACK,
                width: '75%',
                padding: 0,
                marginBottom: 10,
                marginLeft: 10,
              }}
              value={ProductDiscount}
              onChangeText={txt => {
                setProductDiscount(txt);
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => addToCart()}
            style={{alignSelf: 'flex-end'}}>
            <PlatformGradient
              colors={['#9BC8E2', '#007BC1']}
              style={{
                height: 40,
                borderRadius: 20,
                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 10,
              }}>
              <Text
                style={{
                  color: APPCOLORS.WHITE,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}>
                Add Item
              </Text>
            </PlatformGradient>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: APPCOLORS.CLOSETOWHITE,
              borderRadius: 10,
              marginTop: 20,
              padding: 20,
            }}>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                Subtotal
              </Text>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                Rs {formatNumber(ProductPrice * total)}
              </Text>
            </View>

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                Discount
              </Text>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                Rs {formatNumber(ProductDiscount)} ({ProductDiscount}%)
              </Text>
            </View>

            <View
              style={{
                height: 2,
                backgroundColor: APPCOLORS.BLACK,
                marginTop: 30,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
              }}>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                Grand Total
              </Text>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                {formatNumber(totalSum)}
              </Text>
            </View>
          </View>

          {OrderLoader == true ? (
            <View
              style={{
                height: 50,
                backgroundColor: APPCOLORS.CLOSETOWHITE,
                marginTop: 20,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ActivityIndicator size={'large'} color={'black'} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => AddItemss()}
              style={{
                height: 50,
                backgroundColor: APPCOLORS.CLOSETOWHITE,
                marginTop: 20,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{color: APPCOLORS.BLACK, fontSize: 17}}>
                Confirm order
              </Text>
            </TouchableOpacity>
          )}
          {/* 
          <TouchableOpacity onPress={() => getSavedData()}>
            <Text
              style={{
                color: 'black',
                fontWeight: 'bold',
                fontSize: 15,
                alignSelf: 'center',
                marginTop: 10,
              }}>
              Sync Offline
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <Modal isVisible={ProductModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
          }}>
          {
            <View style={{flex: 1}}>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{color: 'black', fontSize: 20}}>
                  Select product
                </Text>

                {/* {
                                    selectProduct ?

                                        <TouchableOpacity onPress={() => setProductModal(false)} style={{ paddingHorizontal: 15, backgroundColor: APPCOLORS.BTN_COLOR, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 14, color: 'white' }}>Done</Text>
                                        </TouchableOpacity>

                                        :
                                        null
                                } */}
              </View>

              <TextInput
                placeholder="search"
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  marginTop: 10,
                }}
                onChangeText={txt => {
                  setSearch(txt);
                }}
                value={Search}
              />

              <FlatList
                data={filteredProducts}
                renderItem={({item, index}) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setItemCode(item?.stock_id),
                          setSelectProduct(item),
                          setProductPrice(item.price),
                          setProductModal(false);
                        setProductDiscount(item.discount);
                      }}
                      style={{
                        padding: 10,
                        borderWidth: 1,
                        marginTop: 10,
                        borderRadius: 10,
                        backgroundColor:
                          item.description == selectProduct
                            ? APPCOLORS.BTN_COLOR
                            : null,
                      }}>
                      <Text
                        style={{
                          color:
                            item.description == selectProduct
                              ? 'white'
                              : 'black',
                        }}>
                        Stock ID : {item.stock_id}
                      </Text>
                      <Text
                        style={{
                          color:
                            item.description == selectProduct
                              ? 'white'
                              : 'black',
                        }}>
                        Product name : {item.description}
                      </Text>
                      <Text
                        style={{
                          color:
                            item.description == selectProduct
                              ? 'white'
                              : 'black',
                        }}>
                        Stock : {formatQuantity(item?.qoh)}
                      </Text>

                      <Text
                        style={{
                          color:
                            item.description == selectProduct
                              ? 'white'
                              : 'black',
                          fontWeight: 'bold',
                        }}>
                        Price : {formatNumber(item.price)}
                      </Text>

                      <Text
                        style={{
                          color:
                            item.description == selectProduct
                              ? 'white'
                              : 'black',
                          fontWeight: 'bold',
                        }}>
                        discount : {formatNumber(item.discount)}%
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
              {/* <ScrollView>
                {AllProducts?.filter(val => {
                  const itemNameLowerCase = val.description.toLowerCase();

                  if (Search == '') {
                    return val;
                  } else if (
                    itemNameLowerCase?.includes(Search.toLowerCase())
                  ) {
                    return val;
                  }
                }).map(item => {
                  console.log('...........', item);
                  // setProductPrice(item.material_cost)
                 
                })}
              </ScrollView> */}
            </View>
          }
        </View>
      </Modal>
    </ScrollView>
  );
};

export default AddItems;
