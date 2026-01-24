import axios from 'axios';
import {BASEURL} from '../utils/BaseUrl';


export const GetBankBalance = async () => {

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASEURL}dash_banks.php`,
    headers: {},
  };

 const res = await axios.request(config)
 return res.data

};


export const GetSalesman = async () => {

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASEURL}dash_salesman.php`,
    headers: {},
  };


 const res = await axios.request(config)
 return res.data
};


export const GetItemBalance = async () => {

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASEURL}dash_items.php`,
    headers: {},
  };


 const res = await axios.request(config)
 return res.data
};

export const GetPayable = async () => {

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASEURL}dash_payable.php`,
    headers: {},
  };


 const res = await axios.request(config)
 return res.data
};


export const GetReceivable = async () => {

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASEURL}dash_receivable.php`,
    headers: {},
  };
  console.log("config", config);


 const res = await axios.request(config)
 return res.data
};