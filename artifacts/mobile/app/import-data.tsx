import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVehicles } from '@/context/VehiclesContext';
import { GlowButton } from '@/components/GlowButton';
import { GlassCard } from '@/components/GlassCard';

export default function ImportDataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { exportData, importFromJson } = useVehicles();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      Alert.alert('Empty', 'Please paste your backup JSON first.');
      return;
    }
    setLoading(true);
    const result = await importFromJson(jsonText.trim());
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Import Successful', result.message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Import Failed', result.message);
    }
  };

  const handleExport = async () => {
    await exportData();
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Backup & Restore</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Export Section */}
        <GlassCard glow style={{ marginBottom: 24 }}>
          <View style={styles.sectionRow}>
            <View style={[styles.sectionIcon, { backgroundColor: `${colors.neonPurple}22` }]}>
              <MaterialCommunityIcons name="export" size={24} color={colors.neonPurple} />
            </View>
            <View style={styles.sectionText}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Export Data</Text>
              <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
                Save all vehicles and fuel history as a JSON file
              </Text>
            </View>
          </View>
          <GlowButton
            title="Export Backup"
            onPress={handleExport}
            fullWidth
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </GlassCard>

        {/* Import Section */}
        <Text style={[styles.label, { color: colors.foreground }]}>Import Backup</Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Paste your exported JSON backup below. This will replace all current data.
        </Text>

        <TextInput
          style={[
            styles.jsonInput,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder={`{\n  "version": 1,\n  "vehicles": [...]\n}`}
          placeholderTextColor={colors.mutedForeground}
          value={jsonText}
          onChangeText={setJsonText}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <GlowButton
          title="Restore from Backup"
          onPress={handleImport}
          loading={loading}
          fullWidth
          style={{ marginTop: 12 }}
          variant="primary"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 20,
    gap: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 12,
  },
  jsonInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    minHeight: 160,
  },
});
