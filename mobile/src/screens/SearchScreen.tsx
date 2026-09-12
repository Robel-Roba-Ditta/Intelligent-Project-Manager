import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchGlobal } from '@ipm/shared';
import type { SearchResult } from '@ipm/shared';
import { api } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#a855f7',
  DONE: '#10b981',
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const words = text.trim().split(/\s+/);
    if (words.length < 2 || text.trim().length < 3) {
      setResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchGlobal(api, text.trim());
        setResults(r);
      } catch {
        setResults({ projects: [], tasks: [] });
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const hasResults = results && (results.projects.length > 0 || results.tasks.length > 0);
  const noResults = results && results.projects.length === 0 && results.tasks.length === 0;

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search projects and tasks..."
          placeholderTextColor="#9ca3af"
          autoFocus
          returnKeyType="search"
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {!results && query.trim().split(/\s+/).length < 2 && query.trim().length > 0 && (
        <View style={s.hintBox}>
          <Text style={s.hintText}>Type at least two words to search</Text>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#0C66E4" style={s.loader} />}

      {noResults && (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>No results for "{query.trim()}"</Text>
        </View>
      )}

      {hasResults && (
        <ScrollView style={s.results} contentContainerStyle={s.resultsContent} keyboardShouldPersistTaps="handled">
          {results.projects.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Projects ({results.projects.length})</Text>
              {results.projects.map(p => (
                <TouchableOpacity key={p.id} style={s.resultRow} onPress={() => navigation.navigate('Projects', { screen: 'ProjectDetail', params: { projectId: p.id, projectName: p.name } })}>
                  <Text style={s.resultIcon}>📁</Text>
                  <Text style={s.resultText} numberOfLines={1}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {results.tasks.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Tasks ({results.tasks.length})</Text>
              {results.tasks.map(t => (
                <TouchableOpacity key={t.id} style={s.resultRow} onPress={() => navigation.navigate('Projects', { screen: 'TaskDetail', params: { taskId: t.id, projectId: 0 } })}>
                  <View style={[s.dot, { backgroundColor: STATUS_COLORS[t.status] ?? '#94a3b8' }]} />
                  <View style={s.taskResult}>
                    <Text style={s.resultText} numberOfLines={1}>{t.title}</Text>
                    <Text style={s.resultSub}>{t.projectName}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#1a1a1a', backgroundColor: '#f9fafb' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  cancelText: { fontSize: 15, color: '#0C66E4', fontWeight: '500' },
  hintBox: { paddingHorizontal: 20, paddingVertical: 32, alignItems: 'center' },
  hintText: { fontSize: 14, color: '#9ca3af' },
  loader: { marginTop: 40 },
  emptyBox: { paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280' },
  results: { flex: 1 },
  resultsContent: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  resultIcon: { fontSize: 18 },
  resultText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500', flex: 1 },
  resultSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  taskResult: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
