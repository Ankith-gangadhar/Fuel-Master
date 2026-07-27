import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface GlowButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GlowButton({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  size = 'md',
}: GlowButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
  }[size];

  if (variant === 'primary') {
    return (
      <Animated.View
        style={[
          animStyle,
          fullWidth && { width: '100%' },
          {
            borderRadius: 14,
            shadowColor: colors.neonPurple,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0.1 : 0.6,
            shadowRadius: 14,
            elevation: disabled ? 0 : 8,
          },
          style,
        ]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={{ borderRadius: 14, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={disabled ? ['#3A2A5A', '#2A1F3D'] : [colors.neonPink, colors.neonPurple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.btnInner,
              { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.btnText, { fontSize: sizeStyles.fontSize }]}>
                {title}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View
        style={[
          animStyle,
          fullWidth && { width: '100%' },
          {
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: disabled ? colors.border : colors.neonPurple,
          },
          style,
        ]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[
            styles.btnInner,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: 14,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.neonPurple} size="small" />
          ) : (
            <Text
              style={[
                styles.btnText,
                { fontSize: sizeStyles.fontSize, color: disabled ? colors.mutedForeground : colors.neonPurple },
              ]}
            >
              {title}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'danger') {
    return (
      <Animated.View style={[animStyle, fullWidth && { width: '100%' }, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[
            styles.btnInner,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: 14,
              backgroundColor: colors.destructive,
            },
          ]}
        >
          <Text style={[styles.btnText, { fontSize: sizeStyles.fontSize }]}>{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  // secondary
  return (
    <Animated.View style={[animStyle, fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.btnInner,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderRadius: 14,
            backgroundColor: colors.secondary,
          },
        ]}
      >
        <Text
          style={[
            styles.btnText,
            { fontSize: sizeStyles.fontSize, color: colors.secondaryForeground },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});
