import axios from 'axios';
import {BASEURL} from '../utils/BaseUrl';

const UpdateMobileAccessData = async formData => {
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${BASEURL}users_mobile_access_post.php`,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
  };

  const res = await axios.request(config);
  return res.data;
};

export default UpdateMobileAccessData;
