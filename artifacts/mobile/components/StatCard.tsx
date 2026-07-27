import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
  style?: ViewStyle;
}

export function StatCard({ icon, label, value, accent = false, style }: StatCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: accent ? colors.glassBorder : colors.border,
          borderWidth: 1,
          shadowColor: accent ? colors.neonPurple : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: accent ? 4 : 0,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: accent ? `${colors.neonPurple}22` : colors.muted },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={accent ? colors.neonPink : colors.mutedForeground}
        />
      </View>
      <Text
        style={[styles.value, { color: accent ? colors.neonPink : colors.foreground }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
