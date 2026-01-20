import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import axios from 'axios';

import {BASEURL} from '../../../../utils/BaseUrl';
import NameandValue from '../../../../components/NameandValue';
import {formatNumber} from '../../../../utils/NumberUtils';

const AsmSalesman = ({navigation, route}) => {
  const [AllSalesman, setAllSalesman] = useState([]);
  const [Loader, setLoader] = useState(false);

  const {item} = route.params;

  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      getSalesMan();
    });

    return nav;
  }, [navigation]);

  const getSalesMan = () => {
    setLoader(true);
    let data = new FormData();
    data.append('dimension', item.id);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}asm_wise_salesman.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(response => {
        setAllSalesman(response.data.data);
        setLoader(false);
      })
      .catch(error => {
        console.log(error);
        setLoader(false);
      });
  };
  return (
    <View style={{flex: 1, backgroundColor: '#FFFFFF', padding: 20}}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Go Back</Text>
      </TouchableOpacity>
      {Loader === true ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator size={'large'} color={'#000000'} />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={AllSalesman}
          renderItem={({item}) => {
            console.log('item', item);
            const partDTarget = formatNumber(item?.daily_target);
            const partMTarget = formatNumber(item?.monthly_target);
            const partMSales = formatNumber(item?.monthly_sale);
            const partDSales = formatNumber(item?.daily_sale);

            return (
              <View
                style={{
                  padding: 20,
                  marginTop: 20,
                  backgroundColor: 'lightblue',
                  marginTop: 20,
                  borderRadius: 20,
                  gap: 5,
                }}>
                <NameandValue
                  title={'Area Name'}
                  value={item.area_name ? item.area_name : '-'}
                />
                <View
                  style={{
                    width: '100%',
                    height: 1,
                    backgroundColor: 'black',
                    marginTop: 5,
                    marginBottom: 5,
                  }}
                />
                <NameandValue
                  title={'Salesman Name'}
                  value={item.salesman_name ? item.salesman_name : '-'}
                />
                {/* <NameandValue title={"Area"} value={item.name}/> */}

                <NameandValue title={'D.Target'} value={`Rs ${partDTarget}`} />
                <NameandValue title={'D.Sale'} value={`Rs ${partDSales}`} />
                <NameandValue title={'D.Status'} value={item.daily_status} />
                <NameandValue
                  title={'Shift Start'}
                  value={item.shift_start ? item.shift_start : '-'}
                />
                <NameandValue
                  title={'Shift end'}
                  value={item.shift_end ? item.shift_end : '-'}
                />

                <NameandValue
                  title={'D.productive'}
                  value={item.daily_productive ? item.daily_productive : '-'}
                />
                <NameandValue
                  title={'D.nonproductive'}
                  value={
                    item.daily_non_productive ? item.daily_non_productive : '-'
                  }
                />
                <NameandValue
                  title={'D.New Customer'}
                  value={
                    item.daily_new_customer ? item.daily_new_customer : '-'
                  }
                />
                <NameandValue
                  title={'D.visit'}
                  value={item.daily_visit ? item.daily_visit : '-'}
                />

                <View
                  style={{
                    width: '100%',
                    height: 1,
                    backgroundColor: 'black',
                    marginTop: 5,
                    marginBottom: 5,
                  }}
                />
                <NameandValue title={'M.Target'} value={`Rs ${partMTarget}`} />
                <NameandValue title={'M.Sale'} value={`Rs ${partMSales}`} />
                <NameandValue
                  title={'M.productive'}
                  value={item.daily_productive ? item.daily_productive : '-'}
                />
                <NameandValue
                  title={'M.nonproductive'}
                  value={
                    item.daily_non_productive ? item.daily_non_productive : '-'
                  }
                />
                <NameandValue
                  title={'M.New Customer'}
                  value={
                    item.monthly_new_customer ? item.monthly_new_customer : '-'
                  }
                />
                <NameandValue
                  title={'M.visit'}
                  value={item.monthly_visit ? item.monthly_visit : '-'}
                />

                <NameandValue title={'M.Statuss'} value={item.monthly_status} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default AsmSalesman;
