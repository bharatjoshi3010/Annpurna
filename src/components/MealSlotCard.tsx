import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../styles/theme';

interface MealSlotCardProps {
    type: 'Breakfast' | 'Lunch' | 'Dinner';
    time: string;
    status: 'available' | 'booked' | 'skipped' | 'taken' | 'missed';
    restaurant?: string;
    onPress: () => void;
    statusText?: string;
    locked?: boolean;
}

const MealSlotCard: React.FC<MealSlotCardProps> = ({ type, time, status, restaurant, onPress, statusText, locked }) => {
    // 'taken' = consumed — ALWAYS green, regardless of locked flag
    const isConsumed = status === 'taken';

    // A meal is visually "locked grey" only when locked AND not consumed
    const showLocked = locked && !isConsumed;

    const getStatusColor = () => {
        switch (status) {
            case 'booked':  return Colors.primary;
            case 'taken':   return Colors.success;   // green
            case 'skipped':
            case 'missed':  return Colors.error;
            default:        return Colors.textLight;
        }
    };

    const color = getStatusColor();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                showLocked  && styles.lockedContainer,
                isConsumed  && styles.consumedContainer,   // ← light green card tint
            ]}
            onPress={showLocked ? undefined : onPress}
            activeOpacity={showLocked ? 1 : 0.7}
        >
            {/* Left colour bar — always green for consumed */}
            <View style={[styles.statusIndicator, { backgroundColor: showLocked ? '#999' : color }]} />

            <View style={styles.content}>
                <View style={styles.leftContent}>
                    <Text style={[
                        Typography.h3,
                        showLocked  && styles.lockedText,
                        isConsumed  && styles.consumedTitle,
                    ]}>
                        {type}
                    </Text>
                    <Text style={Typography.caption}>{time}</Text>
                </View>

                <View style={styles.rightContent}>
                    {restaurant && restaurant !== 'Not selected' ? (
                        <Text
                            style={[
                                styles.restaurantName,
                                showLocked && styles.lockedText,
                                isConsumed && styles.consumedRestaurant,
                            ]}
                            numberOfLines={1}
                        >
                            {restaurant}
                        </Text>
                    ) : (
                        <Text style={styles.placeholderText}>Not selected</Text>
                    )}

                    {/* Status badge */}
                    <View style={[
                        styles.statusBadge,
                        showLocked ? { backgroundColor: '#F0F0F0' } : { backgroundColor: color + '22' },
                    ]}>
                        <Text style={[styles.statusText, { color: showLocked ? '#888' : color }]}>
                            {isConsumed
                                ? '✓  CONSUMED'
                                : showLocked
                                    ? '🔒 LOCKED'
                                    : (statusText ? statusText.toUpperCase() : status.toUpperCase())
                            }
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        marginVertical: Spacing.sm,
        flexDirection: 'row',
        height: 80,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statusIndicator: {
        width: 6,
        height: '100%',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flex: 1,
    },
    rightContent: {
        alignItems: 'flex-end',
        flex: 1,
    },
    restaurantName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
        marginBottom: 4,
    },
    placeholderText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: Colors.textLight,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    lockedContainer: {
        backgroundColor: '#FCFCFC',
        opacity: 0.75,
    },
    lockedText: {
        color: '#999',
    },
    // ── Consumed / green theme ────────────────────────────────────────────────
    consumedContainer: {
        backgroundColor: '#F0FDF4',   // very light green card
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    consumedTitle: {
        color: '#166534',             // dark green meal name
        fontWeight: '700' as const,
    },
    consumedRestaurant: {
        color: '#16a34a',             // medium green restaurant name
    },
});

export default MealSlotCard;
