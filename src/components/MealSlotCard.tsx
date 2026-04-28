import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/theme';

interface MealSlotCardProps {
    type: 'Breakfast' | 'Lunch' | 'Dinner';
    time: string;
    status: 'available' | 'booked' | 'skipped' | 'taken' | 'missed';
    restaurant?: string;
    onPress: () => void;
    statusText?: string;
    locked?: boolean;
    menuItems?: string[];
}

const MEAL_CONFIG = {
    Breakfast: { emoji: '🌅', gradient: '#FFF7ED', accent: '#FB923C' },
    Lunch:     { emoji: '☀️', gradient: '#F0FDF4', accent: '#22C55E' },
    Dinner:    { emoji: '🌙', gradient: '#EFF6FF', accent: '#6366F1' },
};

const MealSlotCard: React.FC<MealSlotCardProps> = ({
    type, time, status, restaurant, onPress, statusText, locked, menuItems,
}) => {
    const isConsumed  = status === 'taken';
    const isMissed    = status === 'missed';
    const isAvailable = status === 'available';
    const showLocked  = locked && !isConsumed;

    const config = MEAL_CONFIG[type] || MEAL_CONFIG.Lunch;

    const accentColor = isConsumed
        ? Colors.success
        : isMissed
            ? Colors.error
            : showLocked
                ? '#9CA3AF'
                : status === 'booked'
                    ? config.accent
                    : Colors.textLight;

    const getBadgeLabel = () => {
        if (isConsumed) return '✓  CONSUMED';
        if (showLocked)  return '🔒 LOCKED';
        if (statusText)  return statusText.toUpperCase();
        return status.toUpperCase();
    };

    const getBadgeBg = () => {
        if (isConsumed) return Colors.successLight;
        if (isMissed)   return Colors.errorLight;
        if (showLocked) return '#F3F4F6';
        if (status === 'booked') return config.gradient;
        return Colors.surfaceAlt;
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isConsumed && styles.consumedCard,
                isMissed   && styles.missedCard,
                showLocked && styles.lockedCard,
            ]}
            onPress={showLocked ? undefined : onPress}
            activeOpacity={showLocked ? 1 : 0.78}
        >
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            {/* Emoji bubble */}
            <View style={[styles.emojiBox, { backgroundColor: isConsumed ? Colors.successLight : config.gradient }]}>
                <Text style={styles.emoji}>{config.emoji}</Text>
            </View>

            {/* Main content */}
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.mealType, showLocked && styles.dimText]}>{type}</Text>
                    <View style={[styles.badge, { backgroundColor: getBadgeBg() }]}>
                        <Text style={[styles.badgeText, { color: accentColor }]}>{getBadgeLabel()}</Text>
                    </View>
                </View>

                <Text style={[styles.time, showLocked && styles.dimText]}>{time}</Text>

                {restaurant && restaurant !== 'Not selected' ? (
                    <Text style={[styles.restaurant, showLocked && styles.dimText]} numberOfLines={1}>
                        🏪 {restaurant}
                    </Text>
                ) : isAvailable ? (
                    <Text style={styles.tapHint}>Tap to select restaurant →</Text>
                ) : null}

                {menuItems && menuItems.length > 0 ? (
                    <Text style={[styles.menuText, showLocked && styles.dimText]} numberOfLines={1}>
                        🍽 {menuItems.join(' · ')}
                    </Text>
                ) : restaurant && restaurant !== 'Not selected' && (
                    <Text style={styles.surpriseText}>🎁 Surprise Meal</Text>
                )}
            </View>

            {/* Arrow for interactive cards */}
            {!showLocked && !isConsumed && !isMissed && (
                <Text style={styles.arrow}>›</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 88,
        ...Shadows.sm,
    },
    consumedCard: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    missedCard: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FECACA',
        opacity: 0.85,
    },
    lockedCard: {
        backgroundColor: Colors.surfaceAlt,
        opacity: 0.75,
    },

    accentBar: {
        width: 4,
        alignSelf: 'stretch',
    },

    emojiBox: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    emoji: { fontSize: 22 },

    content: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 6,
        gap: 3,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    mealType: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.round,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    time: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '500',
    },
    restaurant: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    menuText: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
    surpriseText: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '600',
    },
    tapHint: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '600',
    },
    dimText: {
        color: Colors.textLight,
    },
    arrow: {
        fontSize: 22,
        color: Colors.textLight,
        paddingHorizontal: 12,
    },
});

export default MealSlotCard;
