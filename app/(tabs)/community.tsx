import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity,
  TextInput, Alert, Image, Modal, Dimensions,
  KeyboardAvoidingView, Platform, StatusBar,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import {
  Search,
  Flame, Heart, MessageCircle, Zap,
  Camera, CameraOff, X, Send, MoreHorizontal, Plus, RefreshCw, Trash2, Expand,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { fetchPosts, toggleLike, createPost, fetchComments, addComment } from '../../services/socialService';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../services/supabase';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import { decode } from 'base64-arraybuffer';

const { width: SW } = Dimensions.get('window');

// ── Full-Screen Lightbox ───────────────────────────────────────────────────────
const ImageLightbox = ({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        style={{ position: 'absolute', top: 52, right: 20, zIndex: 10,
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
        onPress={onClose}
      >
        <X size={20} color="#fff" strokeWidth={2.5} />
      </Pressable>
      <Image
        source={{ uri }}
        style={{ width: SW, height: SW, borderRadius: 0 }}
        resizeMode="contain"
      />
    </View>
  </Modal>
);

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onLike, onFire, onComment, onDelete, currentUserId }: any) => {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { CHR, TERR, MUST } = tokens;
  const { clayCard } = clay;
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const isOwn = post.userId === currentUserId;

  return (
  <View style={[styles.postCard, clayCard]}>
    {/* ── Header ── */}
    <View style={styles.postHeader}>
      <View style={styles.postAvatarBox}>
        {post.avatarUrl ? (
          <Image source={{ uri: post.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 16 }} />
        ) : (
          <Text style={{ fontSize: 18, fontWeight: '900', color: CHR }}>{(post.user || 'U')[0].toUpperCase()}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.postUser}>{post.user}</Text>
        <Text style={styles.postMeta}>{post.protocol} · {post.time}</Text>
      </View>
      <Pressable style={styles.postMoreBtn} onPress={() => setMenuOpen(v => !v)}>
        <MoreHorizontal size={18} color={`${CHR}50`} strokeWidth={2} />
      </Pressable>
    </View>

    {/* ── Dropdown menu ── */}
    {menuOpen && (
      <View style={styles.dropdownMenu}>
        {isOwn && (
          <Pressable
            style={styles.dropdownItem}
            onPress={() => {
              setMenuOpen(false);
              Alert.alert('Delete Post', 'Are you sure you want to delete this snap?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
              ]);
            }}
          >
            <Trash2 size={15} color="#E07A5F" strokeWidth={2.5} />
            <Text style={[styles.dropdownItemText, { color: '#E07A5F' }]}>Delete Post</Text>
          </Pressable>
        )}
        {!isOwn && (
          <Pressable style={styles.dropdownItem} onPress={() => setMenuOpen(false)}>
            <Text style={styles.dropdownItemText}>Report</Text>
          </Pressable>
        )}
      </View>
    )}

    <Text style={styles.postCaption}>{post.caption}</Text>

    {/* ── Snap image / placeholder ── */}
    {post.imageUri ? (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setLightboxUri(post.imageUri)}
        style={styles.snapTile}
      >
        <Image
          source={{ uri: post.imageUri }}
          style={{ width: '100%', height: 250, borderRadius: 16 }}
          resizeMode="cover"
        />
        <View style={styles.snapBadge}>
          <Camera size={11} color="#fff" strokeWidth={2.5} />
          <Text style={styles.snapBadgeText}>Protocol Snap</Text>
        </View>
        <View style={styles.expandBtn}>
          <Expand size={13} color="#fff" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    ) : (
      <View style={[styles.snapTile, { backgroundColor: '#E5E5E5', height: 250, borderRadius: 16 }]}>
        <CameraOff size={40} color={`${CHR}25`} strokeWidth={1.5} />
        <Text style={{ marginTop: 12, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: `${CHR}60` }}>Missing Evidence</Text>
      </View>
    )}

    {/* ── Reactions ── */}
    <View style={styles.reactionRow}>
      <Pressable
        style={[styles.reactionBtn, post.likedByMe && { backgroundColor: `${TERR}20` }]}
        onPress={() => onLike(post.id)}
      >
        <Heart size={16} color={post.likedByMe ? TERR : `${CHR}50`} strokeWidth={2.5} fill={post.likedByMe ? TERR : 'none'} />
        <Text style={[styles.reactionCount, post.likedByMe && { color: TERR }]}>{post.likes}</Text>
      </Pressable>

      <Pressable
        style={[styles.reactionBtn, post.firedByMe && { backgroundColor: `${MUST}30` }]}
        onPress={() => onFire(post.id)}
      >
        <Zap size={16} color={post.firedByMe ? MUST : `${CHR}50`} strokeWidth={2.5} fill={post.firedByMe ? MUST : 'none'} />
        <Text style={[styles.reactionCount, post.firedByMe && { color: '#c8a020' }]}>{post.fires}</Text>
      </Pressable>

      <Pressable style={styles.reactionBtn} onPress={() => onComment(post)}>
        <MessageCircle size={16} color={`${CHR}50`} strokeWidth={2.5} />
        <Text style={styles.reactionCount}>{post.comments}</Text>
      </Pressable>
    </View>

    {/* ── Full-screen lightbox ── */}
    {lightboxUri && (
      <ImageLightbox uri={lightboxUri} visible={!!lightboxUri} onClose={() => setLightboxUri(null)} />
    )}
  </View>
  );
};

// ── Comment Modal ─────────────────────────────────────────────────────────────
const CommentModal = ({ post, visible, onClose }: any) => {
  const { tokens, styles } = useThemeStyles(createStyles);
  const { CHR, SAGE } = tokens;
  const [text, setText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useUserStore();

  useEffect(() => {
    if (visible && post?.id) loadComments(post.id);
  }, [visible, post]);

  const loadComments = async (postId: string) => {
    setLoading(true);
    try {
      const dbComments = await fetchComments(postId);
      const mapped = dbComments.map(c => ({
        id: (c as any).comment_id,
        user: (c as any).users?.username || 'Unknown',
        avatarUrl: (c as any).users?.avatar_url || null,
        text: (c as any).content,
        time: new Date((c as any).created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setComments(mapped);
    } catch (err) {
      console.warn('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !profile || !post?.id) return;
    try {
      await addComment(post.id, profile.user_id, text.trim());
      setText('');
      loadComments(post.id);
    } catch (e: any) {
      console.warn("Could not send comment:", e);
      Alert.alert("Error", "Could not send comment.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <Pressable onPress={onClose}><X size={20} color={`${CHR}60`} strokeWidth={2.5} /></Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {loading && <ActivityIndicator color={SAGE} style={{ marginTop: 20 }} />}
            {!loading && comments.length === 0 && <Text style={styles.emptyText}>No comments yet.</Text>}
            {comments.map(c => (
              <View key={c.id} style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  {c.avatarUrl ? (
                    <Image source={{ uri: c.avatarUrl }} style={{ width: 34, height: 34, borderRadius: 12 }} />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '900', color: CHR }}>{c.user[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{c.user}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                  <Text style={styles.commentTime}>{c.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={`${CHR}40`}
              value={text}
              onChangeText={setText}
            />
            <Pressable style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]} onPress={handleSend}>
              <Send size={16} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Camera Snap Modal (camera-only, no gallery) ──────────────────────────────
const CameraSnapModal = ({ visible, onClose, onCapture }: any) => {
  const { tokens, styles } = useThemeStyles(createStyles);
  const { CHR } = tokens;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState<string | null>(null);
  const [capturedB64, setCapturedB64] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!visible) { setCaptured(null); setCapturedB64(null); setCaption(''); setPosting(false); setIsReady(false); }
  }, [visible]);

  const takePhoto = async () => {
    if (!cameraRef.current || !isReady) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: true });
      if (photo?.uri) { setCaptured(photo.uri); setCapturedB64(photo.base64!); }
    } catch (e: any) {
      console.warn("Camera takePicture error:", e);
      Alert.alert('Camera error', 'Could not take photo. Try again.');
    }
  };

  const handlePost = async () => {
    if (!caption.trim() || posting) return;
    setPosting(true);
    try {
      await onCapture(caption, captured, capturedB64);
      onClose();
    } catch (e: any) {
      console.warn("Failed to post snap:", e);
      Alert.alert("Failed to post", "Please try again.");
    } finally {
      setPosting(false);
    }
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: CHR, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
          <Camera size={48} color="#fff" strokeWidth={1.5} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 20, textAlign: 'center' }}>Camera Access Needed</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, textAlign: 'center', fontWeight: '600' }}>To post a protocol snap, please allow camera access.</Text>
          <Pressable style={[styles.postBtn, { marginTop: 24, width: '100%' }]} onPress={requestPermission}>
            <Text style={styles.postBtnText}>Allow Camera</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {!captured ? (
          <>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
              onCameraReady={() => setIsReady(true)}
            />
            <View style={{ position: 'absolute', top: 56, right: 20 }}>
              <Pressable onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </View>
            <View style={{ position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Protocol Snap</Text>
              <Pressable
                onPress={takePhoto}
                disabled={!isReady}
                style={{
                  width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff',
                  borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
                  shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 10,
                  opacity: isReady ? 1 : 0.4,
                }}
              />
            </View>
          </>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Image source={{ uri: captured }} style={{ flex: 1 }} resizeMode="cover" />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.75)', padding: 20, gap: 14 }}>
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 14, fontWeight: '600' }}
                placeholder="What did you accomplish?"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  onPress={() => setCaptured(null)}
                >
                  <RefreshCw size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Retake</Text>
                </Pressable>
                <Pressable
                  style={[styles.postBtn, { flex: 2, opacity: !caption.trim() || posting ? 0.5 : 1 }]}
                  onPress={handlePost}
                  disabled={!caption.trim() || posting}
                >
                  <Zap size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.postBtnText}>{posting ? 'Posting...' : 'Share Snap'}</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={{ position: 'absolute', top: 56, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose}
            >
              <X size={20} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
type TabKey = 'feed' | 'friends' | 'discover';

export default function CommunityScreen() {
  const { tokens, styles, clay } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR } = tokens;
  const { clayCard } = clay;

  const [tab, setTab]             = useState<TabKey>('feed');
  const [posts, setPosts]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentPost, setCommentPost] = useState<any>(null);
  const [snapOpen, setSnapOpen]   = useState(false);

  // Friends tab
  const [search, setSearch]       = useState('');
  const [allUsers, setAllUsers]   = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const { profile } = useUserStore();
  const router = useRouter();

  // ── Feed ──
  const loadFeed = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await fetchPosts();
      if (data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id: p.post_id,
          userId: p.user_id,
          user: p.users?.username || 'Unknown Operator',
          avatarUrl: p.users?.avatar_url || null,
          time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          protocol: p.completion_id ? 'Verified Protocol' : 'Status Update',
          caption: p.content,
          imageUri: p.image_url ?? p.mission_completions?.end_image_url ?? p.mission_completions?.start_image_url ?? null,
          likes: p.like_count || 0,
          fires: p.zap_count || 0,
          comments: p.comment_count || 0,
          likedByMe: false,
          firedByMe: false,
        }));
        setPosts(mapped);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.warn('Feed fetch failed:', err);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUsers = React.useCallback(async (query = '') => {
    setUsersLoading(true);
    try {
      let q = supabase
        .from('users')
        .select('user_id, username, discipline_score, current_streak, global_rank_tier, avatar_url')
        .neq('user_id', profile?.user_id || '')
        .order('discipline_score', { ascending: false })
        .limit(30);

      if (query.trim()) {
        q = q.ilike('username', `%${query}%`);
      }

      const { data } = await q;
      setAllUsers(data || []);
    } catch (e) {
      console.warn('User search failed:', e);
    } finally {
      setUsersLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => { loadFeed(); }, []);
  useEffect(() => {
    if (tab === 'friends' || tab === 'discover') loadUsers(search);
  }, [tab, search, loadUsers]);

  const handleLike = async (id: string) => {
    if (!profile) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
      : p));
    try {
      await toggleLike(id, profile.user_id, post.likedByMe);
    } catch (e) { console.warn('Like failed:', e); }
  };

  const handleFire = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, firedByMe: !p.firedByMe, fires: p.firedByMe ? p.fires - 1 : p.fires + 1 }
      : p));
  };

  const handleDelete = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id)); // optimistic
    try {
      const { error } = await supabase.from('posts' as any).delete().eq('post_id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Delete failed:', e);
      loadFeed(); // revert
    }
  };

  const handleShare = async (caption: string, imageUri?: string | null, base64Str?: string | null) => {
    if (!profile) return;
    const opt = {
      id: `opt-${Date.now()}`,
      user: profile.username || 'You',
      time: 'Just now',
      protocol: 'Status Update',
      caption,
      imageUri: imageUri ?? null,
      likes: 0, fires: 0, comments: 0,
      likedByMe: false, firedByMe: false,
    };
    setPosts(prev => [opt, ...prev]);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (imageUri) {
        // Upload base64/uri to supabase storage
        const ext = 'jpg';
        const path = `community/${profile.user_id}/${Date.now()}.${ext}`;
        
        let uploadData, error;
        if (base64Str) {
          const res = await supabase.storage.from('snaps').upload(path, decode(base64Str), { contentType: 'image/jpeg', upsert: true });
          uploadData = res.data; error = res.error;
        } else {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const res = await supabase.storage.from('snaps').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
          uploadData = res.data; error = res.error;
        }

        if (uploadData && !error) {
          const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(path);
          uploadedUrl = urlData.publicUrl;
        } else if (error) {
          console.warn("Upload failed:", error);
        }
      }
      await createPost(profile.user_id, caption, uploadedUrl, undefined);
      loadFeed();
    } catch (err) {
      console.warn('Share failed:', err);
      setPosts(prev => prev.filter(p => p.id !== opt.id));
      throw err;
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} tintColor={SAGE} />}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSub}>Your discipline circle</Text>
          </View>
          <Pressable style={styles.shareFab} onPress={() => setSnapOpen(true)}>
            <Camera size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* ── TAB PILLS ── */}
        <View style={styles.tabRow}>
          {(['feed', 'friends', 'discover'] as TabKey[]).map(key => (
            <Pressable
              key={key}
              style={[styles.tabPill, tab === key && { backgroundColor: TERR }]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabPillText, tab === key && { color: '#fff' }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── FEED ── */}
        {tab === 'feed' && (
          <View>
            {loading && <ActivityIndicator color={SAGE} style={{ marginVertical: 32 }} />}
            {!loading && posts.length === 0 && (
              <View style={styles.emptyState}>
                <Camera size={40} color={`${CHR}25`} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Snaps Yet</Text>
                <Text style={styles.emptySub}>Be the first to share a protocol snap.</Text>
                <Pressable style={[styles.postBtn, { marginTop: 16, paddingHorizontal: 24 }]} onPress={() => setSnapOpen(true)}>
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.postBtnText}>Post a Snap</Text>
                </Pressable>
              </View>
            )}
            {posts.map(post => (
              <PostCard
                key={post.id} post={post}
                onLike={handleLike}
                onFire={handleFire}
                onComment={(p: any) => setCommentPost(p)}
                onDelete={handleDelete}
                currentUserId={profile?.user_id}
              />
            ))}
          </View>
        )}

        {/* ── FRIENDS / DISCOVER ── */}
        {(tab === 'friends' || tab === 'discover') && (
          <View>
            <View style={[styles.searchBox, clayCard]}>
              <Search size={18} color={`${CHR}60`} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search operators..."
                placeholderTextColor={`${CHR}40`}
                value={search}
                onChangeText={handleSearchChange}
              />
            </View>

            {usersLoading && <ActivityIndicator color={SAGE} style={{ marginVertical: 20 }} />}

            {!usersLoading && allUsers.length === 0 && (
              <Text style={styles.emptyText}>No operators found.</Text>
            )}

            {allUsers.map(user => (
              <Pressable
                key={user.user_id}
                style={[styles.friendCard, clayCard]}
                onPress={() => router.push({ pathname: '/public-profile', params: { userId: user.user_id } })}
              >
                <View style={styles.friendAvatar}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={{ width: 44, height: 44, borderRadius: 16 }} />
                  ) : (
                    <Text style={{ fontSize: 18, fontWeight: '900', color: CHR }}>{(user.username || 'U')[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{user.username}</Text>
                  <View style={styles.friendMeta}>
                    <Flame size={12} color={TERR} strokeWidth={2.5} />
                    <Text style={styles.metaText}>{user.current_streak}d streak</Text>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.metaText}>{Math.round(user.discipline_score || 0)} pts</Text>
                  </View>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{user.global_rank_tier || 'Novice'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <CommentModal post={commentPost} visible={!!commentPost} onClose={() => setCommentPost(null)} />
      <CameraSnapModal
        visible={snapOpen}
        onClose={() => setSnapOpen(false)}
        onCapture={handleShare}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (tokens: any, clay: any) => {
  const { BG, CHR, SAGE, TERR } = tokens;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: CHR, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: `${CHR}50`, fontWeight: '600', marginTop: 2 },
  shareFab: {
    width: 48, height: 48, borderRadius: 18, backgroundColor: TERR,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TERR, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10,
  },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 100, backgroundColor: `${CHR}10` },
  tabPillText: { fontSize: 12, fontWeight: '800', color: `${CHR}70` },

  // Posts
  postCard: {
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    padding: 16, marginBottom: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatarBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: `${SAGE}30`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  postUser: { fontSize: 16, fontWeight: '800', color: CHR },
  postMeta: { fontSize: 10, color: `${CHR}50`, fontWeight: '600', marginTop: 1 },
  postMoreBtn: { padding: 4 },
  postCaption: { fontSize: 14, color: `${CHR}85`, lineHeight: 21, marginBottom: 12, fontWeight: '500' },

  snapTile: {
    width: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, position: 'relative', overflow: 'hidden',
  },
  snapBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  snapBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  expandBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  // 3-dot dropdown
  dropdownMenu: {
    position: 'absolute', top: 52, right: 14, zIndex: 100,
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
    minWidth: 160, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dropdownItemText: { fontSize: 14, fontWeight: '700', color: '#3D405B' },

  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 100, backgroundColor: `${CHR}08` },
  reactionCount: { fontSize: 12, fontWeight: '800', color: `${CHR}60` },

  // Search / Users
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: BG, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: CHR, fontWeight: '600' },
  friendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    padding: 14, marginBottom: 12,
  },
  friendAvatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: `${SAGE}30`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  friendName: { fontSize: 14, fontWeight: '800', color: CHR },
  friendMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11, fontWeight: '600', color: `${CHR}55` },
  dot: { color: `${CHR}30`, marginHorizontal: 2 },
  tierBadge: { backgroundColor: `${CHR}10`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tierText: { fontSize: 10, fontWeight: '900', color: `${CHR}70`, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Empty States
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: `${CHR}60` },
  emptySub: { fontSize: 13, fontWeight: '600', color: `${CHR}35`, textAlign: 'center' },
  emptyText: { textAlign: 'center', marginTop: 20, color: `${CHR}40`, fontWeight: '600' },

  // Comment Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61,64,91,0.4)' },
  modalSheet: { backgroundColor: BG, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, height: '65%' },
  modalHandle: { width: 40, height: 4, backgroundColor: `${CHR}25`, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: CHR },

  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: `${SAGE}30`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 10 },
  commentBubble: { backgroundColor: `${CHR}08`, borderRadius: 18, padding: 12, borderTopLeftRadius: 4 },
  commentUser: { fontSize: 12, fontWeight: '800', color: CHR, marginBottom: 3 },
  commentText: { fontSize: 13, color: `${CHR}80`, lineHeight: 18 },
  commentTime: { fontSize: 10, color: `${CHR}40`, fontWeight: '600', marginTop: 4, marginLeft: 4 },

  commentInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  commentInput: {
    flex: 1, backgroundColor: `${CHR}08`, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: CHR, fontWeight: '500',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: SAGE, alignItems: 'center', justifyContent: 'center' },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SAGE, borderRadius: 20, paddingVertical: 14,
    shadowColor: SAGE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  postBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  });
};
