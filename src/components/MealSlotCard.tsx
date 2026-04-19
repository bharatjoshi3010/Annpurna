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
}

const MealSlotCard: React.FC<MealSlotCardProps> = ({ type, time, status, restaurant, onPress, statusText }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'booked':
                return Colors.primary;
            case 'taken':
                return Colors.success;
            case 'skipped':
            case 'missed':
                return Colors.error;
            default:
                return Colors.textLight;
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <View style={styles.content}>
                <View style={styles.leftContent}>
                    <Text style={Typography.h3}>{type}</Text>
                    <Text style={Typography.caption}>{time}</Text>
                </View>
                <View style={styles.rightContent}>
                    {restaurant && restaurant !== 'Not selected' ? (
                        <Text style={styles.restaurantName} numberOfLines={1}>
                            {restaurant}
                        </Text>
                    ) : (
                        <Text style={styles.placeholderText}>Not selected</Text>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {statusText ? statusText.toUpperCase() : status.toUpperCase()}
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
});

export default MealSlotCard;
