import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@ipm/shared';
import type { NotificationDto } from '@ipm/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/authStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
const WS_URL = API_URL.replace('/api', '');

export default function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await listNotifications(api);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      const token = await getToken();
      if (!token || cancelled) return;

      const socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('notification', (notif: NotificationDto) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      socketRef.current = socket;
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  async function handleTap(notif: NotificationDto) {
    if (!notif.isRead) {
      try {
        await markNotificationRead(api, notif.id);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
    if (notif.taskId) {
      navigation.navigate('Projects', {
        screen: 'TaskDetail',
        params: { taskId: notif.taskId, projectId: 0 },
      });
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead(api);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#0C66E4" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.notifRow, !item.isRead && s.unreadRow]}
            onPress={() => handleTap(item)}
            activeOpacity={0.7}
          >
            {!item.isRead && <View style={s.unreadDot} />}
            <View style={s.notifBody}>
              <Text style={[s.notifMessage, !item.isRead && s.unreadMessage]}>{item.message}</Text>
              <Text style={s.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  markAllText: { fontSize: 13, color: '#0C66E4', fontWeight: '600' },
  listContent: { padding: 16 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  unreadRow: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0C66E4', marginTop: 4 },
  notifBody: { flex: 1 },
  notifMessage: { fontSize: 14, color: '#374151', lineHeight: 20 },
  unreadMessage: { color: '#1a1a1a', fontWeight: '500' },
  notifTime: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
