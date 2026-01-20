import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../components/PlatformGradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useDispatch, useSelector} from 'react-redux';
import {setCartData, setGrandCartTotalPrice} from '../../../redux/AuthSlice';
import Modal from 'react-native-modal';
import EditItemModal from './EditItem/EditItemModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber, formatQuantity} from '../../../utils/NumberUtils';
const ItemList = ({navigation, route}) => {
  const {data} = route.params;

  const dispatch = useDispatch();

  const cart = useSelector(state => state.Data.cartData);
  const GrandCartTotalPrice = useSelector(
    state => state.Data.GrandCartTotalPrice,
  );

  const [Editing, setEditing] = useState(false);
  const [editItemIndex, setEditItemIndex] = useState(null);

  // Sum all GrandTotal values
  let totalSum = cart.reduce((sum, product) => {
    return sum + parseFloat(product.GrandTotal);
  }, 0);

  console.log('Total sum of GrandTotal: ' + formatNumber(totalSum));

  console.log('first', cart);
  const removeItem = async index => {
    // Create a new array without the selected item

    dispatch(
      setGrandCartTotalPrice(GrandCartTotalPrice - cart[index].GrandTotal),
    );

    const newCart = cart.filter((item, i) => i !== index);
    dispatch(setCartData(newCart));

    await AsyncStorage.setItem(`${data?.debtor_no}`, JSON.parse(newCart));
  };

  const openEditModal = index => {
    setEditItemIndex(index);
  };

  const closeEditModal = () => {
    setEditItemIndex(null);
  };

  const saveEditedItem = async editedItem => {
    const updatedCart = cart.map((item, index) =>
      index === editItemIndex ? editedItem : item,
    );
    dispatch(setCartData(updatedCart));

    await AsyncStorage.setItem(`${data?.debtor_no}`, JSON.parse(updatedCart));
    console.log('updatedCart', cart);
    const newGrandTotal = updatedCart.reduce(
      (total, item) => total + item.GrandTotal,
      0,
    );
    dispatch(setGrandCartTotalPrice(newGrandTotal));

    closeEditModal();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: APPCOLORS.BTN_COLOR,
        padding: 20,
        paddingBottom: 0,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddItems', {data: data})}>
          <Ionicons name={'chevron-back'} color={APPCOLORS.WHITE} size={30} />
        </TouchableOpacity>

        <Text
          style={{color: APPCOLORS.WHITE, fontSize: 20, fontWeight: 'bold'}}>
          Total Items
        </Text>

        {/* <TouchableOpacity onPress={() => setEditing(!Editing)} style={{ backgroundColor: Editing == true ? 'green' : 'white', padding: 15, borderRadius: 10, paddingVertical: 0 }}>
                    <Text style={{ color: Editing == true ? 'white' : 'black', fontSize: 14, fontWeight: 'bold' }}>Edit</Text>
                </TouchableOpacity> */}
      </View>

      <Text
        style={{
          color: APPCOLORS.WHITE,
          fontSize: 25,
          fontWeight: 'bold',
          marginTop: 10,
        }}>
        Grand Total: Rs {formatNumber(totalSum)}
      </Text>

      <FlatList
        data={cart}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => {
          console.log(item, index);
          return (
            <View
              style={{
                backgroundColor: APPCOLORS.CLOSETOWHITE,
                marginTop: 20,
                borderRadius: 10,
                padding: 10,
              }}>
              <TouchableOpacity onPress={() => openEditModal(index)}>
                <Text>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  right: 0,
                  top: -15,
                  backgroundColor: 'red',
                  padding: 10,
                  borderRadius: 10,
                }}
                onPress={() => removeItem(index)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons
                    name={'trash-bin'}
                    color={APPCOLORS.WHITE}
                    size={20}
                  />
                </View>
              </TouchableOpacity>

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
                <Text style={{color: APPCOLORS.BLACK, fontSize: 15}}>
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

                <Text style={{color: APPCOLORS.BLACK, fontSize: 15}}>
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
                <Text style={{color: APPCOLORS.BLACK, fontSize: 15}}>
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
                <Text style={{color: APPCOLORS.BLACK, fontSize: 15}}>
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
                <Text style={{color: APPCOLORS.BLACK, fontSize: 15}}>
                  Rs {formatNumber(item?.GrandTotal)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={editItemIndex !== null} animationType="slide">
        <EditItemModal
          item={cart[editItemIndex]}
          onClose={closeEditModal}
          onSave={saveEditedItem}
        />
      </Modal>
    </View>
  );
};

export default ItemList;
