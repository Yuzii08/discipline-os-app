import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { X, Bell, Zap, MessageSquare, UserPlus, Heart, Check } from 'lucide-react-native';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import { 
  Notification, fetchNotifications, markAsRead, markAllAsRead 
} from '../../services/notificationService';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onRefreshCount: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible, onClose, userId, onRefreshCount
}) => {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { CHR, MUST, SAGE, TERR } = tokens;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && userId) {
      loadNotifications();
    }
  }, [visible, userId]);

  const handlePress = async (n: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!n.is_read) {
      await markAsRead(n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      onRefreshCount();
    }

    // Navigation logic
    if (n.type === 'LIKE' || n.type === 'ZAP' || n.type === 'COMMENT') {
      // Assuming we have a way to view a single post or scroll to it
      // For now, we go to Community tab
      router.push('/(tabs)/community');
    } else if (n.type === 'SQUAD_JOIN') {
      router.push('/(tabs)/community'); // Go to network to manage squads
    } else if (n.type === 'SQUAD_ACCEPT') {
      router.push('/(tabs)/community');
    }
    
    onClose();
  };

  const handleMarkAll = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onRefreshCount();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart size={16} color={TERR} fill={TERR} />;
      case 'ZAP': return <Zap size={16} color={MUST} fill={MUST} />;
      case 'COMMENT': return <MessageSquare size={16} color={SAGE} />;
      case 'SQUAD_JOIN': return <UserPlus size={16} color={MUST} />;
      case 'SQUAD_ACCEPT': return <Check size={16} color={SAGE} />;
      default: return <Bell size={16} color={CHR} />;
    }
  };

  const getMessage = (n: Notification) => {
    const sender = n.sender?.username || 'Unknown Operator';
    switch (n.type) {
      case 'LIKE': return `${sender} liked your progress.`;
      case 'ZAP': return `${sender} zapped your mission!`;
      case 'COMMENT': return `${sender} commented on your post.`;
      case 'SQUAD_JOIN': return `${sender} requested to join your squad.`;
      case 'SQUAD_ACCEPT': return `Your request to join the squad was approved!`;
      default: return `New interaction from ${sender}.`;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalSheet, clay.clayCard]}>
          <View style={styles.modalHandle} />
          
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Intelligence Feed</Text>
              <Text style={styles.modalSub}>Recent social signals</Text>
            </View>
            <Pressable onPress={handleMarkAll} hitSlop={10}>
              <Text style={styles.markAllText}>Clear All</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={TERR} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.center}>
              <Bell size={48} color={`${CHR}15`} strokeWidth={1} />
              <Text style={styles.emptyText}>Feed currently silent</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={() => { setRefreshing(true); loadNotifications(true); }}
                  tintColor={TERR}
                />
              }
            >
              {notifications.map((n) => (
                <Pressable
                  key={n.id}
                  style={[styles.notifItem, !n.is_read && styles.unreadItem]}
                  onPress={() => handlePress(n)}
                >
                  <View style={styles.notifLeft}>
                    <View style={styles.avatarWrap}>
                      {n.sender?.avatar_url ? (
                        <Image source={{ uri: n.sender.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: `${CHR}10` }]}>
                          <Text style={styles.avatarLetter}>{(n.sender?.username || '?')[0].toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.iconOverlay}>{getIcon(n.type)}</View>
                    </View>
                    <View style={styles.notifBody}>
                      <Text style={[styles.notifText, !n.is_read && styles.unreadText]}>
                        {getMessage(n)}
                      </Text>
                      <Text style={styles.timeText}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                  {!n.is_read && <View style={styles.unreadDot} />}
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={CHR} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (tokens: any) => {
  const { BG, CHR, TERR, MUST, SAGE, EGSHELL, isDark } = tokens;
  return StyleSheet.create({
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61,64,91,0.35)' },
    modalSheet: {
      height: '80%',
      backgroundColor: BG,
      borderTopLeftRadius: 32, borderTopRightRadius: 32,
      padding: 24, paddingBottom: 40,
    },
    modalHandle: { 
      width: 44, height: 5, borderRadius: 3, 
      backgroundColor: `${CHR}20`, alignSelf: 'center', marginBottom: 20 
    },
    modalHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', 
      alignItems: 'flex-start', marginBottom: 24 
    },
    modalTitle: { fontSize: 24, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
    modalSub: { fontSize: 13, color: `${CHR}50`, fontWeight: '600', marginTop: 2 },
    markAllText: { fontSize: 13, color: TERR, fontWeight: '800' },
    
    list: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { fontSize: 14, fontWeight: '600', color: `${CHR}40` },

    notifItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: `${CHR}08`,
    },
    unreadItem: { backgroundColor: `${TERR}05`, borderRadius: 16, marginHorizontal: -12, paddingHorizontal: 12 },
    notifLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { fontSize: 18, fontWeight: '800', color: CHR },
    iconOverlay: {
      position: 'absolute', bottom: -4, right: -4,
      backgroundColor: BG, width: 24, height: 24, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    },
    notifBody: { flex: 1, gap: 2 },
    notifText: { fontSize: 14, color: `${CHR}70`, fontWeight: '500', lineHeight: 20 },
    unreadText: { color: CHR, fontWeight: '700' },
    timeText: { fontSize: 11, color: `${CHR}40`, fontWeight: '600' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TERR },

    closeBtn: {
      position: 'absolute', top: 24, right: 24,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: `${CHR}08`, alignItems: 'center', justifyContent: 'center',
    },
  });
};
