import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors, Spacing, BorderRadius, Shadows } from '../styles/theme';

interface MealSlotCardProps {
    type: 'Breakfast' | 'Lunch' | 'Dinner';
    time: string;
    status: 'available' | 'booked' | 'skipped' | 'taken' | 'missed';
    restaurant?: string;
    onPress: () => void;
    statusText?: string;
    locked?: boolean;
    menuItems?: string[];
    isServing?: boolean;
    onVerify?: () => void;
}

const MEAL_CONFIG = {
    Breakfast: { emoji: '🌅', lightGradient: '#FFF7ED', darkGradient: '#431407', accent: '#FB923C' },
    Lunch:     { emoji: '☀️', lightGradient: '#F0FDF4', darkGradient: '#052E16', accent: '#22C55E' },
    Dinner:    { emoji: '🌙', lightGradient: '#EFF6FF', darkGradient: '#1E1B4B', accent: '#6366F1' },
};

const MealSlotCard: React.FC<MealSlotCardProps> = ({
    type, time, status, restaurant, onPress, statusText, locked, menuItems, isServing, onVerify
}) => {
    const C = useThemeColors();
    const isDark = C.background === '#0F0E0D'; // quick dark-mode check

    const isConsumed  = status === 'taken';
    const isMissed    = status === 'missed';
    const isAvailable = status === 'available';
    const showLocked  = locked && !isConsumed;

    const config = MEAL_CONFIG[type] || MEAL_CONFIG.Lunch;
    const gradientBg = isDark ? config.darkGradient : config.lightGradient;

    const accentColor = isConsumed
        ? C.success
        : isMissed
            ? C.error
            : showLocked
                ? '#9CA3AF'
                : status === 'booked'
                    ? config.accent
                    : C.textLight;

    const getBadgeLabel = () => {
        if (isConsumed)  return '✓ DONE';
        if (showLocked)  return '🔒 LOCKED';
        if (statusText)  return statusText.toUpperCase();
        return status.toUpperCase();
    };

    const getBadgeBg = () => {
        if (isConsumed) return isDark ? C.successLight : '#DCFCE7';
        if (isMissed)   return isDark ? C.errorLight   : '#FEE2E2';
        if (showLocked) return isDark ? C.surfaceAlt    : '#F3F4F6';
        if (status === 'booked') return gradientBg;
        return C.surfaceAlt;
    };

    const cardBg = isConsumed
        ? (isDark ? '#052E16' : '#F0FDF4')
        : isMissed
            ? (isDark ? '#450A0A' : '#FFF5F5')
            : showLocked
                ? C.surfaceAlt
                : C.surface;

    const cardBorder = isConsumed
        ? (isDark ? '#16A34A' : '#BBF7D0')
        : isMissed
            ? (isDark ? '#F87171' : '#FECACA')
            : C.border;

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    opacity: isMissed ? 0.85 : showLocked ? 0.75 : 1,
                },
            ]}
            onPress={showLocked ? undefined : onPress}
            activeOpacity={showLocked ? 1 : 0.78}
        >
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            {/* Emoji bubble */}
            <View style={[styles.emojiBox, { backgroundColor: isConsumed ? (isDark ? '#052E16' : '#DCFCE7') : gradientBg }]}>
                <Text style={styles.emoji}>{config.emoji}</Text>
            </View>

            {/* Middle info */}
            <View style={styles.middleContent}>
                <Text style={[styles.time, { color: showLocked ? C.textLight : C.textLight }]}>{time}</Text>

                {restaurant && restaurant !== 'Not selected' ? (
                    <Text style={[styles.restaurant, { color: showLocked ? C.textLight : C.text }]} numberOfLines={1}>
                        🏪 {restaurant}
                    </Text>
                ) : isAvailable ? (
                    <Text style={[styles.tapHint, { color: C.primary }]}>Tap to select →</Text>
                ) : null}

                {menuItems && menuItems.length > 0 ? (
                    <Text style={[styles.menuText, { color: showLocked ? C.textLight : C.textSecondary }]} numberOfLines={1}>
                        🍽 {menuItems.map((item: any) => typeof item === 'string' ? item : item?.name || '').filter(Boolean).join(' · ')}
                    </Text>
                ) : restaurant && restaurant !== 'Not selected' && (
                    <Text style={[styles.surpriseText, { color: C.primary }]}>🎁 Surprise Meal</Text>
                )}

                {isServing && onVerify && !isConsumed && (
                    <TouchableOpacity style={[styles.verifyInsideBtn, { backgroundColor: C.primary }]} onPress={onVerify}>
                        <Text style={styles.verifyInsideText}>📲 Verify This Meal</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Right column */}
            <View style={styles.rightCol}>
                <Text style={[styles.mealType, { color: showLocked ? C.textLight : C.text }]}>{type}</Text>
                <View style={[styles.badge, { backgroundColor: getBadgeBg() }]}>
                    <Text style={[styles.badgeText, { color: accentColor }]}>{getBadgeLabel()}</Text>
                </View>
                {!showLocked && !isConsumed && !isMissed && (
                    <Text style={[styles.arrow, { color: C.textLight }]}>›</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        marginVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        minHeight: 84,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    accentBar: { width: 4, alignSelf: 'stretch' },
    emojiBox: {
        width: 44, height: 44, borderRadius: BorderRadius.md,
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 10, marginRight: 10,
    },
    emoji: { fontSize: 20 },
    middleContent: { flex: 1, paddingVertical: 12, gap: 3 },
    time: { fontSize: 11, fontWeight: '500' },
    restaurant: { fontSize: 13, fontWeight: '700' },
    menuText: { fontSize: 11, fontStyle: 'italic' },
    surpriseText: { fontSize: 11, fontWeight: '600' },
    tapHint: { fontSize: 11, fontWeight: '600' },
    rightCol: { alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 5 },
    mealType: { fontSize: 14, fontWeight: '900', textAlign: 'right' },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.round },
    badgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
    arrow: { fontSize: 18, marginTop: 2 },
    verifyInsideBtn: { marginTop: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: BorderRadius.md, alignSelf: 'flex-start' },
    verifyInsideText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});

export default MealSlotCard;
