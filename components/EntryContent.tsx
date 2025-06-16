import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { X, Save, Calendar, Heart, Target, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUser } from '@/components/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { DateUtils } from '@/lib/dateUtils';

const { width } = Dimensions.get('window');

const moodEmojis = ['😞', '😔', '😐', '😊', '😄'];
const moodLabels = ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];

const defaultHabits = [
  'Exercise',
  'Meditation',
  'Reading',
  'Healthy Eating',
  'Early Sleep',
  'Gratitude Practice',
  'Learning',
  'Social Connection'
];

export default function EntryContent() {
  const { addEntry, updateEntry, getTodaysEntry, subscription } = useUser();
  
  // Get today's entry if it exists
  const existingEntry = getTodaysEntry();
  const isEditing = !!existingEntry;
  
  // Form state
  const [mood, setMood] = useState(existingEntry?.mood || 3);
  const [decision, setDecision] = useState(existingEntry?.decision || '');
  const [habits, setHabits] = useState<{ [key: string]: boolean }>(() => {
    if (existingEntry?.habits && typeof existingEntry.habits === 'object') {
      return existingEntry.habits as { [key: string]: boolean };
    }
    return defaultHabits.reduce((acc, habit) => ({ ...acc, [habit]: false }), {});
  });
  const [loading, setLoading] = useState(false);

  const canSave = decision.trim().length > 0;
  const todayDate = DateUtils.getCurrentLocalDate();

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Missing Information', 'Please write about your day before saving.');
      return;
    }

    // Check subscription limits for new entries
    if (!isEditing && subscription.plan === 'free' && subscription.entriesThisMonth >= subscription.maxEntriesPerMonth) {
      Alert.alert(
        'Monthly Limit Reached',
        `You've reached your monthly limit of ${subscription.maxEntriesPerMonth} entries. Upgrade to Pro for unlimited entries and AI insights.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const entryData = {
        mood,
        moodEmoji: moodEmojis[mood - 1],
        decision: decision.trim(),
        habits,
      };

      let result;
      if (isEditing) {
        result = await updateEntry(existingEntry.id, entryData);
      } else {
        result = await addEntry({
          date: todayDate,
          ...entryData,
        });
      }

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert(
          'Success!',
          isEditing ? 'Your entry has been updated.' : 'Your entry has been saved.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = (habit: string) => {
    setHabits(prev => ({
      ...prev,
      [habit]: !prev[habit]
    }));
  };

  const completedHabitsCount = Object.values(habits).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Enhanced Header */}
        <Animated.View entering={FadeInUp} style={styles.headerContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                  {isEditing ? 'Edit Today\'s Entry' : 'Today\'s Reflection'}
                </Text>
                <Text style={styles.headerDate}>
                  {DateUtils.formatDisplayDate(todayDate)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.saveButton, (!canSave || loading) && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={!canSave || loading}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Mood Selection */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <View style={styles.moodCard}>
            <View style={styles.moodSelector}>
              {moodEmojis.map((emoji, index) => {
                const moodValue = index + 1;
                const isSelected = mood === moodValue;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.moodOption, isSelected && styles.moodOptionSelected]}
                    onPress={() => setMood(moodValue)}
                  >
                    <Text style={[styles.moodEmoji, isSelected && styles.moodEmojiSelected]}>
                      {emoji}
                    </Text>
                    <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                      {moodLabels[index]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.moodIndicator}>
              <View style={styles.moodIndicatorTrack}>
                <View 
                  style={[
                    styles.moodIndicatorFill,
                    { width: `${(mood / 5) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.moodIndicatorText}>
                {mood}/5 - {moodLabels[mood - 1]}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Decision/Reflection Input */}
        <Animated.View entering={SlideInRight.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>What's on your mind today?</Text>
          <View style={styles.decisionCard}>
            <TextInput
              style={styles.decisionInput}
              placeholder="Share your thoughts, decisions, or reflections about today..."
              placeholderTextColor="#9ca3af"
              value={decision}
              onChangeText={setDecision}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={styles.decisionMeta}>
              <Text style={styles.characterCount}>
                {decision.length}/1000 characters
              </Text>
              {decision.length > 0 && (
                <View style={styles.progressIndicator}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${(decision.length / 1000) * 100}%` }
                    ]} 
                  />
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Habits Tracking */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Habits</Text>
            <View style={styles.habitsBadge}>
              <Text style={styles.habitsBadgeText}>
                {completedHabitsCount}/{defaultHabits.length}
              </Text>
            </View>
          </View>
          <View style={styles.habitsCard}>
            <View style={styles.habitsGrid}>
              {defaultHabits.map((habit, index) => {
                const isCompleted = habits[habit];
                return (
                  <Animated.View 
                    key={habit} 
                    entering={FadeInDown.delay(400 + index * 50)}
                    style={styles.habitItemContainer}
                  >
                    <TouchableOpacity
                      style={[styles.habitItem, isCompleted && styles.habitItemCompleted]}
                      onPress={() => toggleHabit(habit)}
                    >
                      <View style={[styles.habitCheckbox, isCompleted && styles.habitCheckboxCompleted]}>
                        {isCompleted && <Text style={styles.habitCheckmark}>✓</Text>}
                      </View>
                      <Text style={[styles.habitText, isCompleted && styles.habitTextCompleted]}>
                        {habit}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
            
            {completedHabitsCount > 0 && (
              <View style={styles.habitsProgress}>
                <View style={styles.habitsProgressBar}>
                  <View 
                    style={[
                      styles.habitsProgressFill,
                      { width: `${(completedHabitsCount / defaultHabits.length) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.habitsProgressText}>
                  {Math.round((completedHabitsCount / defaultHabits.length) * 100)}% complete
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Subscription Status */}
        {subscription.plan === 'free' && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.subscriptionCard}>
              <LinearGradient
                colors={['#dbeafe', '#bfdbfe']}
                style={styles.subscriptionGradient}
              >
                <View style={styles.subscriptionHeader}>
                  <Sparkles size={20} color="#3b82f6" />
                  <Text style={styles.subscriptionTitle}>LifeMap Free</Text>
                </View>
                <Text style={styles.subscriptionText}>
                  {subscription.entriesThisMonth}/{subscription.maxEntriesPerMonth} entries used this month
                </Text>
                <View style={styles.subscriptionProgress}>
                  <View 
                    style={[
                      styles.subscriptionProgressFill,
                      { width: `${(subscription.entriesThisMonth / subscription.maxEntriesPerMonth) * 100}%` }
                    ]} 
                  />
                </View>
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => router.push('/paywall')}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                  <Target size={16} color="#ffffff" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* Tips Section */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Heart size={20} color="#ef4444" />
              <Text style={styles.tipsTitle}>Reflection Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Be honest about your feelings and experiences</Text>
              <Text style={styles.tipItem}>• Focus on what you learned or discovered today</Text>
              <Text style={styles.tipItem}>• Note any decisions you made and why</Text>
              <Text style={styles.tipItem}>• Celebrate small wins and progress</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  headerDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  moodCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    marginHorizontal: 2,
  },
  moodOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  moodEmojiSelected: {
    transform: [{ scale: 1.2 }],
  },
  moodLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: '#3b82f6',
    fontFamily: 'Inter-SemiBold',
  },
  moodIndicator: {
    alignItems: 'center',
  },
  moodIndicatorTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  moodIndicatorFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  moodIndicatorText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  decisionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  decisionInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  decisionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  progressIndicator: {
    width: 60,
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  habitsBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  habitsBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
  habitsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  habitsGrid: {
    gap: 12,
  },
  habitItemContainer: {
    marginBottom: 4,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  habitItemCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  habitCheckboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  habitCheckmark: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  habitText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    flex: 1,
  },
  habitTextCompleted: {
    color: '#166534',
  },
  habitsProgress: {
    marginTop: 20,
    alignItems: 'center',
  },
  habitsProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  habitsProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  habitsProgressText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#166534',
  },
  subscriptionCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  subscriptionGradient: {
    padding: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  subscriptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  subscriptionProgress: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  subscriptionProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
  },
});