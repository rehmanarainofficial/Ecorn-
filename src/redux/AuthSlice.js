import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../utils/BaseUrl';

export const CurrentLogin = createAsyncThunk(
  'user/login',
  async ({username, password}, {rejectWithValue}) => {
    try {
      const response = await axios.post(`${BASEURL}users.php`, {
        username,
        password,
      });
      if (response.data.status === 'true') {
        const user = response.data.data.find(u => u.user_id === username);
        if (user) {
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome back!',
          });
          return user;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: 'Could not find user data in response.',
          });
          return rejectWithValue('User not found in response data');
        }
      } else {
        Toast.show({
          type: 'error',
          text1: response.data.message || 'Login failed',
          text2: 'Please check your credentials and try again.',
        });
        return rejectWithValue(response.data);
      }
    } catch (error) {
      console.log('Login API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'An unexpected error occurred. Please try again later.',
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const AuthSlice = createSlice({
  name: 'UsersData',
  initialState: {
    currentData: null,
    cartData: [],
    token: null,
    GrandCartTotalPrice: '0',
    Loading: false,
    AllProduct: [],
    accessData: [],
    mobileAccessData: null,
  },
  reducers: {
    setLoader: (state, action) => {
      state.Loading = action.payload;
    },
    setMyData: (state, action) => {
      state.currentData = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload.data;
    },
    setCartData: (state, action) => {
      state.cartData = action.payload;
    },
    setGrandCartTotalPrice: (state, action) => {
      state.GrandCartTotalPrice = action.payload;
    },
    setAllProducts: (state, action) => {
      state.AllProduct = action.payload;
    },
    setUserAccess: (state, action) => {
      state.accessData = action.payload;
    },
    setMobileAccess: (state, action) => {
      state.mobileAccessData = action.payload;
    },

    setLogout: state => {
      state.token = null;
      state.currentData = null;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(CurrentLogin.pending, state => {
        state.Loading = true;
      })
      .addCase(CurrentLogin.fulfilled, (state, action) => {
        state.Loading = false;
        state.currentData = action.payload;
        state.token = action.payload.user_id;
      })
      .addCase(CurrentLogin.rejected, state => {
        state.Loading = false;
        state.currentData = null;
        state.token = null;
      });
  },
});

export const {
  setMyData,
  setToken,
  setLogout,
  setLoader,
  setCartData,
  setGrandCartTotalPrice,
  setAllProducts,
  setUserAccess,
  setMobileAccess,
} = AuthSlice.actions;

export default AuthSlice.reducer;
