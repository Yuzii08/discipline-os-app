import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming, withSequence, Easing, withRepeat } from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import { CheckCircle, X, Timer } from 'lucide-react-native';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../services/supabase';

function MissionItemComponent({ completion, now, onPress, tokens, clay, styles }: any) {
  const { SAGE, TERR } = tokens;
  const { clayCard } = clay;
  const mission = completion.missions as any;
  const done = completion.status === 'COMPLETED';
  const failed = completion.status === 'FAILED';
  const isTask = mission?.mission_type !== 'TIME';
  const hasStarted = completion.started_at != null && completion.ended_at == null && completion.status === 'PENDING';
  const isActiveTask = hasStarted && (mission?.expected_duration_mins ?? 0) > 0;

  const resetStreak = useUserStore(s => s.resetStreak);

  const shakeX = useSharedValue(0);
  
  let inGrace = false;
  let timerDisplay = '';
  let fillPct = 0;
  let forceSubmitFail = false;

  if (isActiveTask) {
    const targetTimeMs = new Date(completion.started_at).getTime() + (mission?.expected_duration_mins || 0) * 60000;
    const remainingMs = targetTimeMs - now;
    const remainingSecs = Math.ceil(remainingMs / 1000);

    if (remainingSecs >= 0) {
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      timerDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;
      fillPct = Math.min(100, Math.max(0, (remainingSecs / ((mission?.expected_duration_mins || 1) * 60)) * 100));
    } else {
      inGrace = true;
      const graceRemainingSecs = (10 * 60) + remainingSecs;
      if (graceRemainingSecs <= 0) {
         timerDisplay = '-00:00';
         fillPct = 0;
         forceSubmitFail = true;
      } else {
         const mins = Math.floor(graceRemainingSecs / 60);
         const secs = Math.abs(graceRemainingSecs % 60);
         timerDisplay = `-${mins}:${secs.toString().padStart(2, '0')}`;
         fillPct = Math.min(100, Math.max(0, (graceRemainingSecs / 600) * 100));
      }
    }
  }

  useEffect(() => {
    if (inGrace) {
      shakeX.value = withRepeat(withSequence(
        withTiming(-3, { duration: 50, easing: Easing.linear }),
        withTiming(3, { duration: 50, easing: Easing.linear })
      ), -1, true);
    } else {
      shakeX.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inGrace]);

  // Handle auto-fail trigger for judge
  useEffect(() => {
    if (forceSubmitFail && isActiveTask) {
      const runGraceFail = async () => {
         try {
           const { data } = await supabase.from('mission_completions').select('start_image_url').eq('completion_id', completion.completion_id).single();
           if ((data as any)?.start_image_url) {
              const res = await supabase.functions.invoke('trigger-ai-feedback', {
                 body: { image_1: data?.start_image_url, image_2: null, missionName: mission?.title }
              });
              if (res.data?.verified && res.data?.score_multiplier > 0) {
                 await supabase.from('mission_completions').update({ status: 'COMPLETED', is_grace_period: true, points_earned: Math.round((mission?.base_reward_points || 0) * res.data.score_multiplier) } as any).eq('completion_id', completion.completion_id);
                 return;
              }
           }
         } catch (e) {
            console.error(e);
         }
         // Lapsed Audit: Reset Streak to 0 if fake or failed
         resetStreak();
         // @ts-ignore
         await supabase.from('mission_completions').update({ status: 'FAILED', is_grace_period: true } as any).eq('completion_id', completion.completion_id);
      };
      runGraceFail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceSubmitFail, isActiveTask]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }]
  }));

  const cardBaseStyle = [styles.taskRow, clayCard, !done && !failed && styles.auditCardPending];
  const isLocked = isActiveTask && !inGrace && fillPct < 100;

  if (inGrace) {
     cardBaseStyle.push({ shadowColor: TERR, shadowOpacity: 0.8, borderColor: TERR, borderWidth: 1 } as any);
  } else if (isLocked) {
     // Recessed clay state for physical lock
     cardBaseStyle.push({ shadowOffset: { width: 1, height: 1 }, shadowRadius: 2, shadowOpacity: 0.1, backgroundColor: '#EBE6DC', borderColor: 'transparent' } as any);
  }

  return (
    <Reanimated.View style={animatedStyle}>
      <Shadow 
         distance={isLocked ? 2 : 10} 
         startColor={tokens.isDark ? '#00000040' : '#B8B2A540'} 
         offset={[isLocked ? 1 : 2, isLocked ? 1 : 4]} 
         style={{ width: '100%', borderRadius: 32 }}
         containerStyle={{ marginBottom: 12, width: '100%' }}
      >
        <Pressable
          style={[cardBaseStyle, { marginBottom: 0 }]}
          onPress={onPress}
          disabled={done || failed || isLocked}
        >
        <View style={[styles.auditIconBox, { backgroundColor: done ? `${SAGE}25` : (failed ? `${TERR}25` : (inGrace ? `${TERR}30` : `${TERR}15`)) }]}>
          {done ? <CheckCircle size={20} color={SAGE} strokeWidth={2.5} /> :
           failed ? <X size={20} color={TERR} strokeWidth={2.5} /> :
           <Timer size={20} color={TERR} strokeWidth={2} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.auditTitle}>{mission?.title || 'Protocol'}</Text>
          <Text style={styles.auditTime}>
            {done ? 'Verified ✓' : failed ? 'Failed ✗' : (hasStarted ? (inGrace ? 'GRACE PERIOD' : (isLocked ? 'Locked (In Progress)' : `Tap to Finish ${isTask ? 'Snap' : 'Timer'}`)) : `Tap to Start ${isTask ? 'Snap' : 'Timer'}`)}
          </Text>
        </View>

        {isActiveTask ? (
          <View style={{ alignItems: 'center', gap: 4 }}>
             <View style={[styles.clayVesselSmall, inGrace && { borderColor: TERR, borderWidth: 1, backgroundColor: `${TERR}20` }]}>
               <Reanimated.View style={[styles.claySandSmall, { height: `${fillPct}%`, backgroundColor: inGrace ? TERR : SAGE }]} />
             </View>
             <Text style={[styles.timerTextSmall, inGrace && { color: TERR }]}>{timerDisplay}</Text>
          </View>
        ) : (
          mission?.base_reward_points > 0 && (
             <Text style={[styles.auditPts, done && { color: SAGE }]}>+{mission.base_reward_points} pts</Text>
          )
        )}
      </Pressable>
      </Shadow>
    </Reanimated.View>
  );
}

export const MissionItem = React.memo(MissionItemComponent);
