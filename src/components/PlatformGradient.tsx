import React from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface PlatformGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  [key: string]: any; // Allow other props to pass through
}

const PlatformGradient: React.FC<PlatformGradientProps> = ({
  colors,
  start,
  end,
  style,
  children,
  ...otherProps
}) => {
  if (Platform.OS === 'ios') {
    // On iOS, use solid color (first color from gradient)
    const backgroundColor = colors && colors.length > 0 ? colors[0] : '#000000';
    return (
      <View style={[{ backgroundColor }, style]} {...otherProps}>
        {children}
      </View>
    );
  }

  // On Android, use full gradient
  return (
    <LinearGradient
      colors={colors}
      start={start || { x: 0, y: 0 }}
      end={end || { x: 1, y: 0 }}
      style={style}
      {...otherProps}>
      {children}
    </LinearGradient>
  );
};

export default PlatformGradient;
