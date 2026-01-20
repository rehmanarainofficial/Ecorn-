import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import axios from 'axios';

import {setLogout} from '../../../../redux/AuthSlice';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {BASEURL} from '../../../../utils/BaseUrl';
import NameandValue from '../../../../components/NameandValue';
import {formatNumber} from '../../../../utils/NumberUtils';

const AsmDimension = ({navigation}) => {
  const [AllDimensions, setAllDimensions] = useState([]);
  const [Loader, setLoader] = useState(false);
  const userData = useSelector(state => state.Data.currentData);
  console.log('userData: ', userData);

  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      getDimension();
    });

    return nav;
  }, [navigation]);

  const getDimension = () => {
    setLoader(true);
    let data = new FormData();
    data.append('user_id', userData.id);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}asm_wise_dimension.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    axios
      .request(config)
      .then(response => {
        console.log(JSON.stringify(response.data));
        setAllDimensions(response.data.data);
        setLoader(false);
      })
      .catch(error => {
        console.log(error);
        setLoader(false);
      });
  };

  const dispatch = useDispatch();
  const data = useSelector(state => state.Data.currentData);

  const logout = () => {
    const currentTime = moment().format('HH:mm:ss');
    setLoader(true);

    let datas = new FormData();
    datas.append('user_id', data.id);
    datas.append('time_in_out', currentTime);
    datas.append('type', 1);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}user_attendance_post.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: datas,
    };

    axios
      .request(config)
      .then(response => {
        console.log(JSON.stringify(response.data));
        setLoader(false);
        dispatch(setLogout());
      })
      .catch(error => {
        setLoader(false);
        console.log(error);
      });
  };

  return (
    <View style={{flex: 1, backgroundColor: '#FFFFFF', padding: 20}}>
      <TouchableOpacity
        onPress={() => logout()}
        style={{padding: 10, backgroundColor: 'red', borderRadius: 10}}>
        <Text style={{color: 'white', fontWeight: 'bold', fontSize: 20}}>
          Logout
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('MainRoute')}
        style={{
          padding: 10,
          backgroundColor: APPCOLORS.SKY_BLUE,
          borderRadius: 10,
          marginTop: 5,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{color: 'white', fontWeight: 'bold', fontSize: 20}}>
          Home
        </Text>
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
          data={AllDimensions}
          renderItem={({item}) => {
            const partDTarget = formatNumber(item?.daily_target);
            const partMTarget = formatNumber(item?.monthly_target);
            const partMSales = formatNumber(item?.monthly_sale);
            const partDSales = formatNumber(item?.daily_sale);

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('AsmSalesman', {item: item})}
                style={{
                  padding: 20,
                  marginTop: 20,
                  backgroundColor: 'lightblue',
                  marginTop: 20,
                  borderRadius: 20,
                  gap: 5,
                }}>
                <NameandValue title={'Name'} value={item.name} />

                <View
                  style={{
                    width: '100%',
                    height: 1,
                    backgroundColor: 'black',
                    marginTop: 5,
                    marginBottom: 5,
                  }}
                />
                {/* <NameandValue title={"Area"} value={item.name}/> */}
                {/* <NameandValue title={"Shift Start"} value={item.name}/> */}

                <Text
                  style={{fontSize: 20, fontWeight: 'bold', color: 'black'}}>
                  Daily
                </Text>
                <NameandValue title={'Target'} value={`Rs ${partDTarget}`} />
                <NameandValue title={'Sale'} value={`Rs ${partDSales}`} />
                <NameandValue
                  title={'Status'}
                  value={item.daily_status}
                  valColour={
                    item.monthly_status == 'Not Achieved' ? 'red' : 'lightgreen'
                  }
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
                {/* <NameandValue title={"Shift end"} value={item.name}/> */}

                <Text
                  style={{fontSize: 20, fontWeight: 'bold', color: 'black'}}>
                  Monthly
                </Text>
                <NameandValue title={'Target'} value={`Rs ${partMTarget}`} />
                <NameandValue title={'Sale'} value={`Rs ${partMSales}`} />
                <NameandValue
                  title={'Status'}
                  value={item.monthly_status}
                  valColour={
                    item.monthly_status == 'Not Achieved' ? 'red' : 'lightgreen'
                  }
                />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default AsmDimension;
