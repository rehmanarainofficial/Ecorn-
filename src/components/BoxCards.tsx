import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import PlatformGradient from './PlatformGradient'
import AppText from './AppText'
import { APPCOLORS } from '../utils/APPCOLORS'
import { responsiveHeight, responsiveWidth } from '../utils/Responsive'
import { formatNumber } from '../utils/NumberUtils'

type props = {
    title?: string,
    amount?: Number,
    gradientTopColor?: any
    gradientBottomColor?: any

}

const BoxCards = ({amount,gradientBottomColor, gradientTopColor, title}:props) => {
  return (
    <TouchableOpacity>
    <PlatformGradient colors={[gradientTopColor, gradientBottomColor ]} style={{alignItems:'center', justifyContent:'center', width:responsiveWidth(28), marginLeft:10, borderRadius:10, height:responsiveHeight(10),gap:5}}> 
      <AppText title={title} titleSize={1.5} titleWeight titleColor={APPCOLORS.WHITE}/>
      <AppText title={formatNumber(amount)} titleSize={1.8} titleWeight titleColor={APPCOLORS.WHITE}/>
    </PlatformGradient>
    </TouchableOpacity>
  )
}

export default BoxCards