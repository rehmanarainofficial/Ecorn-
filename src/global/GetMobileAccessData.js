import axios from 'axios';
import {BASEURL} from '../utils/BaseUrl';

const GetMobileAccessData = async roleId => {
  let data = new FormData();
  data.append('role_id', roleId);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${BASEURL}users_mobile_access.php`,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: data,
  };

  const res = await axios.request(config);
  return res.data;
};

export default GetMobileAccessData;
