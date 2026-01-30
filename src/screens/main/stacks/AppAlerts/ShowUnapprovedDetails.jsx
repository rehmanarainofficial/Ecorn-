import {View, Text, FlatList, TextInput, Alert} from 'react-native';
import {useSelector} from 'react-redux';
import React, {useEffect, useState} from 'react';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import AppText from '../../../../components/AppText';
import AppButton from '../../../../components/AppButton';
import {BASEURL} from '../../../../utils/BaseUrl';
import axios from 'axios';
import {formatNumber} from '../../../../utils/NumberUtils';

const ShowUnapprovedDetails = ({route, navigation}) => {
  const {dataDetail, type} = route.params;
  const currentUser = useSelector(state => state.Data.currentData);

  const [filteredData, setFilteredData] = useState(dataDetail);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = text => {
    setSearchText(text);
    if (text === '') {
      setFilteredData(dataDetail);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = dataDetail.filter(
        item =>
          item?.name?.toLowerCase()?.includes(lowerText) ||
          item?.reference?.toLowerCase()?.includes(lowerText) ||
          item?.ord_date?.toLowerCase()?.includes(lowerText) ||
          item?.supp_name?.toLowerCase()?.includes(lowerText) ||
          item?.tran_date?.toLowerCase()?.includes(lowerText) ||
          item?.type_no?.toLowerCase()?.includes(lowerText),
      );
      setFilteredData(filtered);
    }
  };

  const HandleApproveAndUnApprove = (status, item) => {
    let data = new FormData();
    data.append('trans_no', item?.trans_no);
    data.append('type', item?.type);
    data.append('approval', JSON.stringify(status));
    data.append('user_id', currentUser?.id);

    fetch(`${BASEURL}dash_approval_post.php`, {
      method: 'POST',
      body: data,
      headers: {
        Accept: 'application/json',
      },
    })
      .then(res => res.json())
      .then(responseData => {
        if (responseData.status == true || responseData.status == 'true') {
          Alert.alert(`Status ${status == 0 ? 'UnApproved' : 'Approved'}`);
          navigation.goBack();
        } else {
          Alert.alert(
            'Action Failed',
            responseData.message || 'Something went wrong',
          );
        }
      })
      .catch(error => {
        console.log('Approval API Error:', error);
        Alert.alert('Network Error', 'Check your internet connection');
      });
  };

  return (
    <View style={{flex: 1}}>
      <SimpleHeader title="Alerts Details" />

      <View style={{padding: 20}}>
        {/* 🔍 Search Bar */}
        <TextInput
          value={searchText}
          onChangeText={handleSearch}
          placeholder={
            type === 'Delivery'
              ? 'Search by name, reference or transaction date'
              : type === 'Po'
              ? 'Search by supplier, reference or order date'
              : 'Search by name, reference or date'
          }
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderColor: '#ccc',
            borderWidth: 1,
            marginBottom: 15,
          }}
        />

        {/* 📋 List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{gap: 10, paddingBottom: 200}}
          renderItem={({item}) => {
            console.log('item', item);
            return (
              <View
                style={{
                  padding: 20,
                  backgroundColor: APPCOLORS.Secondary,
                  borderRadius: 10,
                }}>
                {type == 'Voucher' ? (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Reference'} titleSize={2} />
                      <AppText title={item.reference} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Transaction date'} titleSize={2} />
                      <AppText title={item.tran_date} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'name'} titleSize={2} />
                      <AppText title={item.name} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'cheque'} titleSize={2} />
                      <AppText title={item.cheque} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'amount'} titleSize={2} />
                      <AppText title={formatNumber(item.amount)} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'User'} titleSize={2} />
                      <AppText title={item.user_id} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Memo'} titleSize={2} />
                      <AppText title={item.memo_} />
                    </View>
                  </>
                ) : type == 'Po' ? (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Reference'} titleSize={2} />
                      <AppText title={item.reference} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Supplier Name'} titleSize={2} />
                      <AppText title={item.supp_name} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Order date'} titleSize={2} />
                      <AppText title={item.ord_date} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Total'} titleSize={2} />
                      <AppText title={formatNumber(item.total)} />
                    </View>
                  </>
                ) : type == 'Delivery' ? (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Reference'} titleSize={2} />
                      <AppText title={item.reference} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Name'} titleSize={2} />
                      <AppText title={item.name} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Transaction date'} titleSize={2} />
                      <AppText title={item.tran_date} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'OV Amount'} titleSize={2} />
                      <AppText title={formatNumber(item.ov_amount)} />
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Reference'} titleSize={2} />
                      <AppText title={item.reference} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Name'} titleSize={2} />
                      <AppText title={item.name} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Order date'} titleSize={2} />
                      <AppText title={item.ord_date} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <AppText title={'Total'} titleSize={2} />
                      <AppText title={item.total} />
                    </View>
                  </>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 20,
                  }}>
                  <AppButton
                    title="Approve"
                    btnWidth={38}
                    onPress={() => HandleApproveAndUnApprove(1, item)}
                  />
                  <AppButton
                    title="Unapprove"
                    btnWidth={38}
                    onPress={() => HandleApproveAndUnApprove(0, item)}
                  />
                </View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

export default ShowUnapprovedDetails;
