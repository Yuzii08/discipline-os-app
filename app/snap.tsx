import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable,
  Image, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, X, CheckCircle, Sparkles } from 'lucide-react-native';
import { useMissionStore } from '../store/useMissionStore';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../services/supabase';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withRepeat } from 'react-native-reanimated';
import { decode } from 'base64-arraybuffer';
import { useThemeStyles } from '../hooks/use-theme-styles';

type ProtocolState = 'PENDING' | 'VERIFYING' | 'DONE' | 'FAIL';

export default function SnapScreen() {
  const { tokens, styles } = useThemeStyles(createStyles);
  const { BG, CHR, SAGE, TERR } = tokens;
  const router = useRouter();
  const { completionId, title, isFinish } = useLocalSearchParams();
  const isFinishState = isFinish === 'true';
  const compId = Array.isArray(completionId) ? completionId[0] : completionId;

  const [permission, requestPermission] = useCameraPermissions();
  const { todayMissions, setTodayMissions, markMissionOptimistic } = useMissionStore();
  const { profile } = useUserStore();

  const [machineState, setMachineState] = useState<ProtocolState>('PENDING');
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [aiRoast, setAiRoast] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Fail-safe unlock for devices that occasionally miss onCameraReady
    const timer = setTimeout(() => setIsCameraReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const rotateVal = useSharedValue(0);
  const floatVal = useSharedValue(0);

  useEffect(() => {
    if (machineState === 'VERIFYING') {
      rotateVal.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);
      floatVal.value = withRepeat(withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      rotateVal.value = 0;
      floatVal.value = 0;
    }
  }, [machineState, rotateVal, floatVal]);

  const architectStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${rotateVal.value}deg` },
      { translateY: floatVal.value }
    ]
  }));

  const cameraRef = useRef<CameraView>(null);

  const captureImage = async (): Promise<string | null> => {
    if (!cameraRef.current || !isCameraReady) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
      });
      if (!photo?.uri) return null;
      
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, base64: true }
      );
      return manipResult.base64 || null;
    } catch (e) {
      console.warn('Capture failed:', e);
      return null;
    }
  };

  const handleStartProtocol = async () => {
    if (isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const b64 = await captureImage();
    if (!b64) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }
    
    setCapturedBase64(b64);
    
    if (compId) {
      const nowIso = new Date().toISOString();
      let publicUrl = b64;
      
      try {
        const filePath = `${profile?.user_id || 'anon'}/${compId}_start_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('mission_snaps')
          .upload(filePath, decode(b64), { contentType: 'image/jpeg' });
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('mission_snaps').getPublicUrl(uploadData.path);
          if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
        } else {
            console.error('Storage upload error:', uploadError);
        }
      } catch (e) { console.error(e); }

      const { error } = await supabase.from('mission_completions')
        .update({ 
          start_image_url: publicUrl, 
          started_at: nowIso
        } as any)
        .eq('completion_id', compId);
        
      if (error) {
        console.error("Failed to start protocol DB error:", error);
        Alert.alert("Database Error", error.message || JSON.stringify(error));
        isProcessingRef.current = false;
        setIsProcessing(false);
        setCapturedBase64(null);
        return;
      }

      // Optimistic local state update
      setTodayMissions(
        todayMissions.map(m => m.completion_id === compId ? {
          ...m,
          start_image_url: publicUrl,
          started_at: nowIso,
        } : m)
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    isProcessingRef.current = false;
    setIsProcessing(false);
    router.replace('/(tabs)');
  };

  const handleFinishProtocol = async () => {
    if (isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMachineState('VERIFYING');

    const finishB64 = await captureImage();
    if (!finishB64) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setMachineState('PENDING');
      return;
    }
    
    setCapturedBase64(finishB64);
    
    if (compId) {
      let publicUrl = finishB64;
      try {
        const filePath = `${profile?.user_id || 'anon'}/${compId}_finish_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('mission_snaps')
          .upload(filePath, decode(finishB64), { contentType: 'image/jpeg' });
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('mission_snaps').getPublicUrl(uploadData.path);
          if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
        }
      } catch (e) { console.error(e); }

      await supabase.from('mission_completions')
        .update({ 
          end_image_url: publicUrl, 
          ended_at: new Date().toISOString()
        } as any)
        .eq('completion_id', compId);
    }

    await executeAIAudit();
  };

  const executeAIAudit = async () => {
    if (!compId) {
       isProcessingRef.current = false;
       setIsProcessing(false);
       return;
    }

    try {
      const { data, error } = await supabase
        .from('mission_completions')
        .select('is_grace_period, missions!inner(base_reward_points, wager_amount)')
        .eq('completion_id', compId)
        .single();
        
      if (error || !data) throw error || new Error("No completion record found");

      const mData = data.missions as any;
      const basePoints = mData?.base_reward_points || 20;
      const wagerAmt = mData?.wager_amount || 0;

      const res = await supabase.functions.invoke('trigger-ai-feedback', {
        body: {
          completionId: compId,
          missionName: title || 'Unknown Mission',
        }
      });

      if (res.error) {
        console.error("Supabase function error:", res.error);
        handleBreach("Connection Interrupted. The Judge could not be reached.");
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const auditData = res.data || { verified: false, message: "Judge systems failed." };

      if (!auditData.verified) {
        handleBreach(auditData.message);
      } else {
        await handleSuccess(auditData.score_multiplier || 1.0, basePoints, wagerAmt);
      }
    } catch (err: any) {
      console.error("AI Audit failed:", err);
      handleBreach("Connection Interrupted. The Judge could not be reached.");
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleBreach = async (message: string) => {
    setAiRoast(message);
    setMachineState('FAIL');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    if (compId) {
      await supabase.from('mission_completions')
        .update({ status: 'FAILED' } as any)
        .eq('completion_id', compId);
    }
  };

  const handleSuccess = async (multiplier: number, basePts: number, wagerAmt: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMachineState('DONE');
    
    if (compId) {
      const finalPoints = Math.round((basePts * multiplier) + (wagerAmt * 2.5));
      
      // OPTIMISTIC
      markMissionOptimistic(compId as string);
      
      const { profile } = useUserStore.getState();
      if (profile) {
        // Just increment local state by the total points (we already deducted wager earlier)
        useUserStore.setState(s => ({
          disciplineScore: s.disciplineScore + finalPoints
        }));
      }

      await supabase.from('mission_completions')
        .update({ status: 'COMPLETED', points_earned: finalPoints } as any)
        .eq('completion_id', compId);

      if (profile?.user_id) {
         await supabase.rpc('increment_discipline_score', { 
           user_id_param: profile.user_id, 
           score_delta: finalPoints 
         } as any);
      }
    }
    setTimeout(() => router.replace('/(tabs)'), 2500);
  };

  const shatterY = useSharedValue(0);
  const shatterRot = useSharedValue(0);
  const shatterScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (machineState === 'FAIL') {
      shatterY.value = withTiming(200, { duration: 600 });
      shatterRot.value = withTiming(45, { duration: 600 });
      shatterScale.value = withTiming(0.8, { duration: 600 });
      opacity.value = withTiming(0, { duration: 600 });
    }
  }, [machineState, shatterY, shatterRot, shatterScale, opacity]);

  const shatterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: shatterY.value },
      { rotateZ: `${shatterRot.value}deg` },
      { scale: shatterScale.value }
    ],
    opacity: opacity.value
  }));

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain === false) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={SAGE} />
        <Text style={{ marginTop: 20, color: CHR, fontWeight: '700' }}>Initializing Protocol...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center]}>
        <Camera size={48} color={SAGE} strokeWidth={1.5} />
        <Text style={styles.permHead}>Camera Access Required</Text>
        <Text style={styles.permBody}>Grant camera access to verify your discipline session.</Text>
        <Pressable style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (machineState === 'DONE') {
    return (
      <View style={[styles.root, styles.center]}>
        <CheckCircle size={72} color={SAGE} strokeWidth={1.5} />
        <Text style={styles.doneHead}>Protocol Verified</Text>
        <Text style={styles.doneBody}>Your session is logged. Well done.</Text>
      </View>
    );
  }

  if (machineState === 'FAIL') {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: `${TERR}15` }]}>
        <Animated.View style={[styles.center, shatterStyle]}>
          <X size={72} color={TERR} strokeWidth={1.5} />
          <Text style={[styles.doneHead, { color: TERR }]}>Protocol Rejected</Text>
          <Text style={[styles.doneBody, { marginTop: 12, paddingHorizontal: 32, fontSize: 16, color: CHR, fontStyle: 'italic' }]}>
            &quot;{aiRoast}&quot;
          </Text>
        </Animated.View>
        <Pressable 
          style={[styles.grantBtn, { backgroundColor: CHR, marginTop: 40, position: 'absolute', bottom: 60 }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.grantText}>Acknowledge Breach</Text>
        </Pressable>
      </View>
    );
  }

  const isVerifying = machineState === 'VERIFYING';

  return (
    <View style={styles.root} pointerEvents={isProcessing ? 'none' : 'auto'}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.topBar}>
        {!isVerifying ? (
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <X size={22} color={CHR} strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topTitle} numberOfLines={1}>{title || 'Protocol'}</Text>
          <Text style={styles.topSub}>
            {isVerifying ? 'AI Audit' : (isFinishState ? 'Exit Phase' : 'Intake Phase')}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.cameraWrap}>
        {capturedBase64 ? (
           <Image source={{ uri: `data:image/jpeg;base64,${capturedBase64}` }} style={styles.camera} />
        ) : (
          <CameraView 
            style={styles.camera} 
            facing="back" 
            ref={cameraRef} 
            onCameraReady={() => setIsCameraReady(true)}
          />
        )}

        {isVerifying && (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: BG, zIndex: 10 }]}>
             <Animated.View style={[styles.architectStone, styles.clayLifted, architectStyle]}>
               <View style={styles.architectInner} />
             </Animated.View>
             <Text style={styles.generatingTitle}>The Oracle is Auditing</Text>
             <Text style={styles.generatingSub}>Verifying your effort delta.</Text>
          </View>
        )}

        {isProcessing && machineState === 'PENDING' && (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: `${BG}E6`, zIndex: 999 }]}>
            <ActivityIndicator size="large" color={SAGE} />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '800', color: CHR, letterSpacing: 1 }}>CLAY LOADING...</Text>
          </View>
        )}

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            {isVerifying ? "Do not move." : (isFinishState ? "Capture Finish Snap" : "Capture Start Snap")}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {machineState === 'PENDING' && !isFinishState && (
          <Pressable style={styles.submitBtn} onPress={handleStartProtocol} disabled={isProcessing || !isCameraReady}>
            {isProcessing ? (
               <ActivityIndicator color="#fff" />
            ) : (
               <Camera size={18} color="#fff" strokeWidth={2.5} />
            )}
            <Text style={styles.submitText}>{isProcessing ? 'Stamping Ledger...' : 'Start Protocol & Snap'}</Text>
          </Pressable>
        )}

        {machineState === 'PENDING' && isFinishState && (
          <Pressable 
            style={[styles.submitBtn, { backgroundColor: SAGE }]} 
            onPress={handleFinishProtocol}
            disabled={isProcessing || !isCameraReady}
          >
            <Sparkles size={18} color="#fff" strokeWidth={2.5} />
            <Text style={styles.submitText}>Finalize & Verify</Text>
          </Pressable>
        )}

        {isVerifying && (
          <Pressable style={[styles.submitBtn, { backgroundColor: CHR }]} disabled>
            <ActivityIndicator color="#fff" />
            <Text style={styles.submitText}>The Judge is Auditing...</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const createStyles = (tokens: any) => {
  const { BG, CHR, SAGE, isDark } = tokens;
  
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: BG },
    center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: BG },
    closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: `${CHR}10`, alignItems: 'center', justifyContent: 'center' },
    topTitle: { fontSize: 16, fontWeight: '800', color: CHR },
    topSub:   { fontSize: 10, fontWeight: '700', color: `${CHR}40`, letterSpacing: 1.5, textTransform: 'uppercase' },
    cameraWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
    camera:     { flex: 1 },
    clayLifted: { shadowColor: isDark ? '#000' : '#B8B2A5', shadowOffset: { width: 6, height: 8 }, shadowOpacity: isDark ? 0.6 : 0.4, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' },
    architectStone: { width: 120, height: 120, borderRadius: 40, backgroundColor: SAGE, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    architectInner: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.4)' },
    generatingTitle: { fontSize: 22, fontWeight: '900', color: CHR, marginBottom: 8 },
    generatingSub: { fontSize: 14, color: `${CHR}60`, fontWeight: '600' },
    hintBox: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: `${CHR}99`, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 6 },
    hintText: { fontSize: 11, fontWeight: '700', color: BG, letterSpacing: 0.5 },
    footer: { backgroundColor: BG, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    submitBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 60, borderRadius: 20, backgroundColor: SAGE, shadowColor: SAGE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
    submitText: { fontSize: 16, fontWeight: '900', color: '#fff' },
    permHead: { fontSize: 20, fontWeight: '900', color: CHR, marginTop: 20, marginBottom: 8, textAlign: 'center' },
    permBody: { fontSize: 13, color: `${CHR}60`, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    grantBtn: { backgroundColor: SAGE, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14 },
    grantText:  { fontSize: 14, fontWeight: '900', color: '#fff' },
    doneHead: { fontSize: 22, fontWeight: '900', color: CHR, marginTop: 20, marginBottom: 8 },
    doneBody: { fontSize: 13, color: `${CHR}50`, textAlign: 'center' },
  });
};
