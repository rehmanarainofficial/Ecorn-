import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import PlatformGradient from './PlatformGradient'
import { responsiveHeight, responsiveWidth } from '../utils/Responsive'
import AppText from './AppText'
import { APPCOLORS } from '../utils/APPCOLORS'



const AppButton = ({ title,onPress, btnWidth }) => {
    return (
        <PlatformGradient colors={[APPCOLORS.BLACK, APPCOLORS.Secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius:200}}>
            <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center',width:responsiveWidth(btnWidth ? btnWidth : 90), height:responsiveHeight(5),  borderRadius:200}}>
            <AppText title={title} titleColor={APPCOLORS.WHITE} titleSize={2} titleWeight/>
            </TouchableOpacity>
        </PlatformGradient>
    )
}

export default AppButton