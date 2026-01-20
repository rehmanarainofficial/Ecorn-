import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useState} from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../components/PlatformGradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useDispatch} from 'react-redux';
import {setLogout} from '../../../redux/AuthSlice';
import {useSelector} from 'react-redux';

import moment from 'moment';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../utils/BaseUrl';
import { APPCOLORS } from '../../../utils/APPCOLORS';

const Profile = ({navigation}) => {
  const [loaderTimout, setLoaderTimout] = useState(false);
  const [loaderTimIn, setLoaderTimIn] = useState(false);
  const dispatch = useDispatch();
  const data = useSelector(state => state.Data.currentData);

  const logout = () => {
    const currentTime = moment().format('HH:mm:ss');

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
        dispatch(setLogout());
      })
      .catch(error => {
        console.log(error);
      });
  };

  const TimeOut = () => {
    setLoaderTimout(true);
    const currentTime = moment().format('HH:mm:ss');

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
        setLoaderTimout(false);
        Toast.show({
          type: 'success',
          text1: 'successfully timeout',
        });
      })
      .catch(error => {
        console.log(error);
        setLoaderTimout(false);
      });
  };

  const TimeIn = () => {
    setLoaderTimIn(true);
    const currentTime = moment().format('HH:mm:ss');

    let datass = new FormData();
    datass.append('user_id', data.id);
    datass.append('time_in_out', currentTime);
    datass.append('type', 0);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASEURL}user_attendance_post.php`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: datass,
    };

    axios
      .request(config)
      .then(response => {
        console.log(JSON.stringify(response.data));
        setLoaderTimIn(false);
        Toast.show({
            type: 'success',
            text1: 'successfully timein',
          });
      })
      .catch(error => {
        console.log(error);
        setLoaderTimIn(false);
      });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: APPCOLORS.BTN_COLOR,
        justifyContent: 'space-between',
      }}>
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
            borderRadius: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 10,
          }}>
          <Text
            style={{color: APPCOLORS.WHITE, fontSize: 22, fontWeight: 'bold'}}>
            Profile
          </Text>
        </View>

        <View style={{width: 20}} />
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: APPCOLORS.WHITE,
          borderTopRightRadius: 20,
          borderTopLeftRadius: 20,
          padding: 20,
          justifyContent: 'space-between',
        }}>
        <View>
          <Image
            source={require('../../../assets/images/Rider.png')}
            style={{height: 200, width: 200, alignSelf: 'center'}}
            resizeMode="contain"
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 50,
            }}>
            {loaderTimIn == true ? (
              <View
                style={{
                  height: 50,
                  width: '40%',
                  backgroundColor: APPCOLORS.BTN_COLOR,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                               <ActivityIndicator size={'large'} color={'white'} />

              </View>
            ) : (
              <TouchableOpacity
                onPress={() => TimeIn()}
                style={{
                  height: 50,
                  width: '40%',
                  backgroundColor: APPCOLORS.BTN_COLOR,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{color: APPCOLORS.WHITE, fontWeight: 'bold'}}>
                  Shift Start
                </Text>
              </TouchableOpacity>
            )}

            <View style={{height: 50, width: 1, backgroundColor: 'black'}} />
            {loaderTimout == true ? (
              <View
                style={{
                  height: 50,
                  width: '40%',
                  backgroundColor: APPCOLORS.SKY_BLUE,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ActivityIndicator size={'large'} color={'black'} />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  TimeOut();
                }}
                style={{
                  height: 50,
                  width: '40%',
                  backgroundColor: APPCOLORS.SKY_BLUE,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{color: APPCOLORS.BLACK, fontWeight: 'bold'}}>
                  Shift End
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
            <Ionicons name={'person'} color={APPCOLORS.BLACK} size={30} />
            <Text
              style={{color: APPCOLORS.BLACK, fontSize: 20, marginLeft: 10}}>
              {data?.real_name}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginTop: 10,
            }}>
            <Entypo name={'mail'} color={APPCOLORS.BLACK} size={30} />
            <Text
              style={{color: APPCOLORS.BLACK, fontSize: 20, marginLeft: 10}}>
              {data?.email}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginTop: 10,
            }}>
            <Entypo name={'phone'} color={APPCOLORS.BLACK} size={30} />
            <Text
              style={{color: APPCOLORS.BLACK, fontSize: 20, marginLeft: 10}}>
              {data?.phone}
            </Text>
          </View>
        </View>

        <View style={{}}>
          <TouchableOpacity
            onPress={() => logout()}
            style={{
              height: 50,
              backgroundColor: 'red',
              marginTop: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
              borderRadius: 10,
            }}>
            <Text style={{color: APPCOLORS.WHITE, fontSize: 20}}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Profile;
