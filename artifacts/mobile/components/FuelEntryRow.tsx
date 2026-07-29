import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FuelEntry } from '@/types';

interface FuelEntryRowProps {
  entry: FuelEntry;
  isFirst: boolean;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = -80;
const DELETE_ZONE = -100;

export function FuelEntryRow({ entry, isFirst, onDelete }: FuelEntryRowProps) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, -120));
          deleteOpacity.setValue(Math.min(-g.dx / 100, 1));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.spring(translateX, { toValue: DELETE_ZONE, useNativeDriver: true }),
            Animated.timing(deleteOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.timing(deleteOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const date = new Date(entry.date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View style={[styles.wrapper, { borderTopColor: isFirst ? 'transparent' : colors.border }]}>
      {/* Delete button behind */}
      <Animated.View
        style={[styles.deleteBtn, { backgroundColor: colors.destructive, opacity: deleteOpacity }]}
      >
        <Pressable onPress={onDelete} style={styles.deletePressable}>
          <MaterialCommunityIcons name="delete" size={22} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      {/* Row content */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.row, { backgroundColor: colors.card, transform: [{ translateX }] }]}
      >
        {/* Date + badge */}
        <View style={styles.dateBlock}>
          <View style={[styles.badge, { backgroundColor: `${colors.neonPurple}22` }]}>
            <MaterialCommunityIcons name="fuel" size={16} color={colors.neonPurple} />
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
        </View>

        {/* Info Block (Stats + Details) */}
        <View style={{ flex: 1, gap: 6 }}>
          {/* Stats */}
          <View style={styles.statsBlock}>
            <View style={styles.statPair}>
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {entry.odometer.toLocaleString()}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>km</Text>
            </View>
            <View style={styles.statPair}>
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {entry.litresFilled}L
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>fuel</Text>
            </View>
            <View style={styles.statPair}>
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {entry.distance > 0 ? `${entry.distance.toLocaleString()} km` : '—'}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>dist</Text>
            </View>
            <View style={styles.statPair}>
              <Text style={[styles.statVal, { color: colors.neonPink }]}>
                {entry.mileage > 0 ? `${entry.mileage.toFixed(1)}` : '—'}
              </Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>km/L</Text>
            </View>
          </View>

          {/* Details row if reached reserve or has offset */}
          {(entry.reachedReserve || (entry.reserveOffset ?? 0) > 0 || (entry.prevReserveOffset ?? 0) > 0) && (
            <View style={{ flexDirection: 'column', gap: 2, borderTopWidth: 0.5, borderTopColor: `${colors.border}55`, paddingTop: 4 }}>
              {entry.reachedReserve ? (
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  ⛽ Reserve at <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{entry.reserveOdometer?.toLocaleString()} km</Text> (Offset: {entry.reserveOffset} km)
                </Text>
              ) : (
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  Direct refill (No reserve)
                </Text>
              )}
              {(entry.prevReserveOffset ?? 0) > 0 && (
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  Deducted prev offset: <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium' }}>-{entry.prevReserveOffset} km</Text>
                </Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateBlock: {
    alignItems: 'center',
    width: 48,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  statsBlock: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statPair: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  statLbl: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
