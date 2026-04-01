import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../styles/theme';

interface RestaurantCardProps {
    name: string;
    cuisine: string;
    rating: number;
    imageUrl?: string;
    onPress: () => void;
    isSelected?: boolean;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
    name,
    cuisine,
    rating,
    imageUrl,
    onPress,
    isSelected,
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selectedContainer]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
                    </View>
                )}
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={[Typography.h3, styles.name]}>{name}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>★ {rating}</Text>
                    </View>
                </View>
                <Text style={Typography.caption}>{cuisine}</Text>
                {isSelected && (
                    <View style={styles.selectedBadge}>
                        <Text style={styles.selectedText}>Selected</Text>
                    </View>
                )}
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
        padding: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedContainer: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF1E8',
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
        backgroundColor: Colors.secondary,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.primary,
    },
    infoContainer: {
        flex: 1,
        paddingLeft: Spacing.md,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        flex: 1,
        fontSize: 18,
    },
    ratingBadge: {
        backgroundColor: '#FFF9E5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFB800',
    },
    selectedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    selectedText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '700',
    },
});

export default RestaurantCard;
