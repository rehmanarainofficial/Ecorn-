import { View, Text, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'

import Ionicons from 'react-native-vector-icons/Ionicons'
import PlatformGradient from '../../../components/PlatformGradient'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Octicons from 'react-native-vector-icons/Octicons'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import axios from 'axios'
import Modal from 'react-native-modal'
import { useDispatch, useSelector } from 'react-redux'
import { setLoader } from '../../../redux/AuthSlice'
import Toast from 'react-native-toast-message'
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {BASEURL} from '../../../utils/BaseUrl'
import { APPCOLORS } from '../../../utils/APPCOLORS'


const PaymentScreen = ({ navigation, route }) => {

    const { data, userType } = route.params

    // Alert.alert("userType",userType)
    // console.log("first...", data)
    const [PaymentMethod, setPaymentMethod] = useState("Cash Receipt")
    const [PaymentTypeModal, setPaymentTypeModal] = useState(false)

    //Cash
    const [Amount, setAmount] = useState("")

    //Bank
    const [ChequeNo, setChequqNo] = useState("")
    const [BankDate, setBankDate] = useState("")
    const [BankDateForDisplay, setBankDateForDisplay] = useState("")

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);


    const [isSelectPayment, setPaymentSelect] = useState([])
    const [SelectCashType, setSelechCashType] = useState()
    const dispatch = useDispatch()


    const Loader = useSelector((state) => state.Data.Loading)
    const [bankLoader, setBankLoader] = useState(false)
    const [CashLoader, setCashLoader] = useState(false)

    console.log("first", SelectCashType)


    



    console.log("PaymentMethod",PaymentMethod)

    const Payment = () => {
        dispatch(setLoader(true))
        




        if (PaymentMethod == "Cash Receipt" || PaymentMethod == "Cash Payment" ) {

            if (Amount == "") {
                Toast.show({
                    type: 'error',
                    text1: "Please enter the amount"

                })
                dispatch(setLoader(false))

            } else {

                let Cashdata = new FormData();
                Cashdata.append('type', PaymentMethod == "Cash Receipt" ? 42 : PaymentMethod == "Cash Payment" ? 41 : null);
                Cashdata.append('bank_act', SelectCashType.id);
                Cashdata.append('trans_date', BankDate);
                Cashdata.append('amount', Amount);
                Cashdata.append('comments', '');
                Cashdata.append('person_type_id', userType == "supplier" ? 3 : 2);
                Cashdata.append('person_id', data?.debtor_no);

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `${BASEURL}post_service_payments.php`,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    data: Cashdata
                };

                axios.request(config)
                    .then((response) => {
                        console.log(JSON.stringify(response.data))
                        dispatch(setLoader(false))

                        Toast.show({
                            type: 'success',
                            text1: "Successfully Done"

                        })

                    })
                    .catch((error) => {
                        console.log(false);
                        Toast.show({
                            type: 'error',
                            text1: "Something went wrong"

                        })
                    });
            }

        } else {

            if (Amount == "") {
                Toast.show({
                    type: 'error',
                    text1: "Please enter the amount"

                })
                dispatch(setLoader(false))

            } else {

                let bankdata = new FormData();
                bankdata.append('type',  PaymentMethod == "Bank Receipt"  ? 2 : PaymentMethod == "Bank Receipt" ? 1 : null);
                bankdata.append('bank_act', SelectCashType.id);
                bankdata.append('trans_date', BankDate);
                bankdata.append('amount', Amount);
                bankdata.append('comments', '');
                Cashdata.append('person_type_id', userType == "supplier" ? 3 : 2);
                bankdata.append('cheque', ChequeNo);
                bankdata.append('cheque_date', BankDate);
                bankdata.append('person_id', data?.debtor_no);

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `${BASEURL}post_service_payments.php`,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    data: bankdata
                };

                axios.request(config)
                    .then((response) => {
                        console.log(JSON.stringify(response.data))
                        dispatch(setLoader(false))

                        Toast.show({
                            type: 'success',
                            text1: "Successfully Done"

                        })

                    })
                    .catch((error) => {
                        console.log(false);
                        Toast.show({
                            type: 'error',
                            text1: "Something went wrong"

                        })
                    });
            }
        }


    }

    const getAccount = () => {


        // dispatch(setLoader(true))
        setCashLoader(true)
        setBankLoader(true)
        let getAccdata = new FormData();

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${BASEURL}all_data.php`,
            headers: {
            },
            data: getAccdata
        };

        axios.request(config)
            .then((response) => {
                // console.log(JSON.stringify(response.data.data_bank));




                if (PaymentMethod == "Cash Receipt" || PaymentMethod == "Cash Payment" ) {

                    setCashLoader(false)
                    setBankLoader(false)
                    console.log("cash", response.data.data_cash_bank);

                    setPaymentSelect(response?.data?.data_cash_bank)
                    setPaymentTypeModal(true)




                } else {
                    console.log("bank", response.data.data_bank);
                    setPaymentSelect(response?.data?.data_bank)
                    setPaymentTypeModal(true)
                    setCashLoader(false)
                    setBankLoader(false)





                }

            })
            .catch((error) => {
                console.log(error);
            });

    }

    const getTypes = () => {
        getAccount()
    }


    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    useEffect(() => {
        formatDate()
    }, [])

    const formatDate = () => {
        const dateString = Date.now();
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0'); // Get day with leading zero if needed
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month with leading zero if needed (months are zero-indexed)
        const year = date.getFullYear();

        const formattedDate = `${year}-${month}-${day}`;

        const formattedDateForDisplay = `${day}-${month}-${year}`;


        setBankDateForDisplay(formattedDateForDisplay)

        setBankDate(formattedDate); // Output: "08-02-2024"
    }
    const handleConfirm = (dates) => {

        const dateString = dates;
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0'); // Get day with leading zero if needed
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month with leading zero if needed (months are zero-indexed)
        const year = date.getFullYear();

        const formattedDate = `${year}-${month}-${day}`;
        const formattedDateForDisplay = `${day}-${month}-${year}`;

        // console.log(formattedDate); // Output: "08-02-2024"


        setBankDateForDisplay(formattedDateForDisplay)

        setBankDate(formattedDate)


        hideDatePicker();
    };

    return (
        <View style={{ flex: 1, backgroundColor: APPCOLORS.CLOSETOWHITE }}>

            <View style={{ backgroundColor: APPCOLORS.BTN_COLOR, height: 90, borderBottomEndRadius: 20, borderBottomLeftRadius: 20, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 20 }}>

                <TouchableOpacity onPress={() => navigation.goBack()} >
                    <Ionicons
                        name={'chevron-back'}
                        color={APPCOLORS.WHITE}
                        size={30}
                    />
                </TouchableOpacity>

                <Text style={{ color: APPCOLORS.WHITE, fontSize: 20, fontWeight: 'bold' }}>Payment Screen</Text>

                <View />

            </View>

        <View style={{ flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent:'space-between' }}>

                <TouchableOpacity onPress={() => { setPaymentMethod("Cash Receipt"), setSelechCashType() }} style={{ flexDirection: 'row' }}>
                    <View style={{ height: 30, width: 30, borderWidth: 2, borderRadius: 200, alignItems: 'center', justifyContent: 'center' }}>
                        {
                            PaymentMethod == "Cash Receipt" ?

                                <View style={{ height: 20, width: 20, borderRadius: 2000, backgroundColor: APPCOLORS.BTN_COLOR }} />
                                :
                                null
                        }
                    </View>
                    <Text style={{ color: APPCOLORS.BLACK, fontSize: 18, marginLeft: 5, fontWeight: 'bold' }}>Cash Receipt</Text>
                </TouchableOpacity>


                 <TouchableOpacity onPress={() => { setPaymentMethod("Cash Payment"), setSelechCashType() }} style={{ flexDirection: 'row' }}>
                    <View style={{ height: 30, width: 30, borderWidth: 2, borderRadius: 200, alignItems: 'center', justifyContent: 'center' }}>
                        {
                            PaymentMethod == "Cash Payment" ?

                                <View style={{ height: 20, width: 20, borderRadius: 2000, backgroundColor: APPCOLORS.BTN_COLOR }} />
                                :
                                null
                        }
                    </View>
                    <Text style={{ color: APPCOLORS.BLACK, fontSize: 18, marginLeft: 5, fontWeight: 'bold' }}>Cash Payment</Text>
                </TouchableOpacity>

          

                
            </View>


            <View style={{ flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent:'space-between' }}>

                <TouchableOpacity onPress={() => { setPaymentMethod("Bank Receipt"), setSelechCashType() }} style={{ flexDirection: 'row' }}>
                    <View style={{ height: 30, width: 30, borderWidth: 2, borderRadius: 200, alignItems: 'center', justifyContent: 'center' }}>
                        {
                            PaymentMethod == "Bank Receipt" ?

                                <View style={{ height: 20, width: 20, borderRadius: 2000, backgroundColor: APPCOLORS.BTN_COLOR }} />
                                :
                                null
                        }
                    </View>
                    <Text style={{ color: APPCOLORS.BLACK, fontSize: 18, marginLeft: 5, fontWeight: 'bold' }}>Bank Receipt</Text>
                </TouchableOpacity>


                 <TouchableOpacity onPress={() => { setPaymentMethod("Bank Payment"), setSelechCashType() }} style={{ flexDirection: 'row' }}>
                    <View style={{ height: 30, width: 30, borderWidth: 2, borderRadius: 200, alignItems: 'center', justifyContent: 'center' }}>
                        {
                            PaymentMethod == "Bank Payment" ?

                                <View style={{ height: 20, width: 20, borderRadius: 2000, backgroundColor: APPCOLORS.BTN_COLOR }} />
                                :
                                null
                        }
                    </View>
                    <Text style={{ color: APPCOLORS.BLACK, fontSize: 18, marginLeft: 5, fontWeight: 'bold' }}>Bank Payment</Text>
                </TouchableOpacity>

          

                
            </View>


            


            <View style={{ padding: 20 }}>
                {
                    PaymentMethod == "Cash Receipt" || PaymentMethod == "Cash Payment"  ?
                        <>
                            <Text style={{ color: APPCOLORS.BLACK, fontSize: 23, marginLeft: 5, fontWeight: 'bold' }}>Cash</Text>
                            <TextInput
                                placeholder='Enter Value'
                                style={{ height: 50, backgroundColor: APPCOLORS.WHITE, elevation: 10, borderRadius: 200, paddingHorizontal: 20, marginTop: 10 }}
                                onChangeText={(txt) => {
                                    setAmount(txt)
                                }}
                                value={Amount}
                            />

                    


                            <TouchableOpacity onPress={() => getTypes()} style={{ height: 50, backgroundColor: 'white', marginTop: 10, borderRadius: 200, elevation: 10, alignItems: 'center', justifyContent: 'center' }}>

                                {
                                    CashLoader == true ?

                                        <ActivityIndicator size={'large'} color={'blue'} />
                                        :

                                        <Text>{SelectCashType ? SelectCashType.bank_account_name : "Select Type"}</Text>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={{ height: 50, backgroundColor: APPCOLORS.WHITE, elevation: 10, borderRadius: 200, paddingHorizontal: 20, marginTop: 10, width: '47%', alignItems: 'flex-start', justifyContent: 'center' }}>
                                <Text style={{ color: 'gray' }}>{BankDateForDisplay}</Text>
                            </TouchableOpacity>


                        </>
                        :
                        <>
                            <Text style={{ color: APPCOLORS.BLACK, fontSize: 23, marginLeft: 5, fontWeight: 'bold' }}>Cheque</Text>
                            <TouchableOpacity onPress={() => getTypes()} style={{ height: 50, backgroundColor: 'white', marginTop: 10, borderRadius: 200, elevation: 10, alignItems: 'center', justifyContent: 'center' }}>

                                {
                                    bankLoader == true ?

                                        <ActivityIndicator size={'large'} color={'blue'} />
                                        :

                                        <Text>{SelectCashType ? SelectCashType.bank_account_name : "Bank name"}</Text>
                                }
                            </TouchableOpacity>

                            <TextInput
                                placeholder='Cheque no'
                                style={{ height: 50, backgroundColor: APPCOLORS.WHITE, elevation: 10, borderRadius: 200, paddingHorizontal: 20, marginTop: 10 }}
                                onChangeText={(txt) => {
                                    setChequqNo(txt)
                                }}
                                value={ChequeNo}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TextInput
                                    placeholder='Amount'
                                    style={{ height: 50, backgroundColor: APPCOLORS.WHITE, elevation: 10, borderRadius: 200, paddingHorizontal: 20, marginTop: 10, width: '50%' }}
                                    onChangeText={(txt) => {
                                        setAmount(txt)
                                    }}
                                    value={Amount}
                                />
                                <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={{ height: 50, backgroundColor: APPCOLORS.WHITE, elevation: 10, borderRadius: 200, paddingHorizontal: 20, marginTop: 10, width: '47%', alignItems: 'flex-start', justifyContent: 'center' }}>
                                    <Text style={{ color: 'gray' }}>{BankDateForDisplay}</Text>
                                </TouchableOpacity>

                            </View>

                            <View style={{ height: 2, backgroundColor: APPCOLORS.BLACK, marginTop: 20 }} />
                            {/* 
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                                <Text style={{ fontSize: 20, color: APPCOLORS.BLACK }}>Given</Text>
                                <Text style={{ fontSize: 20, color: APPCOLORS.BLACK }}>9,000</Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <Text style={{ fontSize: 20, color: APPCOLORS.BLACK }}>Remaining</Text>
                                <Text style={{ fontSize: 20, color: APPCOLORS.BLACK }}>1,000</Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <Text style={{ fontSize: 20, color: APPCOLORS.BLACK }}>Given</Text>
                                <Text style={{ fontSize: 20, color: APPCOLORS.BLACK }}>10,000</Text>
                            </View> */}

                        </>


                }
                <TouchableOpacity onPress={() => Payment()} style={{ height: 50, backgroundColor: APPCOLORS.BTN_COLOR, borderRadius: 200, marginTop: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: APPCOLORS.WHITE, fontSize: 20, fontWeight: 'bold' }}>{Loader == true ? <ActivityIndicator size={'large'} color={'white'} /> : "Done"}</Text>
                </TouchableOpacity>


                <Modal isVisible={PaymentTypeModal}>
                    <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 10 }}>
                        <TouchableOpacity onPress={() => setPaymentTypeModal(false)} style={{ height: 30, width: 30, borderRadius: 200, backgroundColor: APPCOLORS.BTN_COLOR, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white' }}>X</Text>


                        </TouchableOpacity>

                        <FlatList
                            data={isSelectPayment}
                            renderItem={({ item }) => {

                                return (
                                    <TouchableOpacity onPress={() => {setSelechCashType(item), setPaymentTypeModal(false)}} style={{ height: 50, borderWidth: 1, marginTop: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SelectCashType?.id == item.id ? APPCOLORS.BTN_COLOR : null }}>
                                        <Text style={{ color: SelectCashType?.id == item.id ? 'white' : 'black' }}>{item.bank_account_name}</Text>
                                    </TouchableOpacity>
                                )
                            }}
                        />


                    </View>
                </Modal>

            </View>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
            />

            <Toast />

        </View>
    )
}

export default PaymentScreen