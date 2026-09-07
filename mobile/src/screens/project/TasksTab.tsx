import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TasksTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Coming in the next update.</Text>
      <Text style={styles.hint}>Task list and Kanban board will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  hint: { fontSize: 13, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
});
