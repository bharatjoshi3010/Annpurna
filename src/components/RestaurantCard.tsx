import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/theme';
import { API_BASE_URL } from '../config';

interface RestaurantCardProps {
    name: string;
    cuisine: string;
    rating: number;
    imageUrl?: string;
    onPress: () => void;
    isSelected?: boolean;
    kycStatus?: string;
    menuItemName?: string;
    menuItemImage?: string;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
    name, cuisine, rating, imageUrl, onPress, isSelected,
    kycStatus, menuItemName, menuItemImage,
}) => {
    const getSafeUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.includes('10.0.2.2') || url.includes('localhost')) {
            const match = url.match(/:(\d+)(\/.*)/);
            if (match) return `${API_BASE_URL}${match[2]}`;
        }
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
        return url;
    };

    const displayImage = getSafeUrl(menuItemImage) || getSafeUrl(imageUrl);
    const isApproved = kycStatus === 'approved';

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selectedContainer]}
            onPress={onPress}
            activeOpacity={0.88}
        >
            {/* Image / placeholder */}
            <View style={styles.imageContainer}>
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderInitial}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                {/* KYC badge overlaid on image */}
                {kycStatus && (
                    <View style={[styles.kycPill, isApproved ? styles.kycApproved : styles.kycPending]}>
                        <Text style={[styles.kycText, isApproved ? styles.kycApprovedText : styles.kycPendingText]}>
                            {isApproved ? '✓ Verified' : '⏳ Pending'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <View style={styles.ratingPill}>
                        <Text style={styles.ratingStar}>★</Text>
                        <Text style={styles.ratingNum}>{rating}</Text>
                    </View>
                </View>

                <Text style={styles.cuisine} numberOfLines={1}>{cuisine || 'Multi-cuisine'}</Text>

                {menuItemName && (
                    <View style={styles.menuChip}>
                        <Text style={styles.menuChipText} numberOfLines={1}>🍲 {menuItemName}</Text>
                    </View>
                )}

                {isSelected && (
                    <View style={styles.selectedBadge}>
                        <Text style={styles.selectedText}>✓ Selected</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginVertical: 6,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    selectedContainer: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
        ...Shadows.md,
    },

    imageContainer: {
        width: 90,
        height: 100,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderInitial: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.primary,
    },
    kycPill: {
        position: 'absolute',
        bottom: 6,
        left: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    kycApproved: { backgroundColor: Colors.successLight },
    kycPending:  { backgroundColor: Colors.warningLight },
    kycText:     { fontSize: 8, fontWeight: '800' },
    kycApprovedText: { color: Colors.success },
    kycPendingText:  { color: Colors.warning },

    info: {
        flex: 1,
        padding: Spacing.sm + 2,
        justifyContent: 'center',
        gap: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E5',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        gap: 2,
    },
    ratingStar: { fontSize: 11, color: '#F59E0B' },
    ratingNum:  { fontSize: 11, fontWeight: '700', color: '#92400E' },
    cuisine: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    menuChip: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryLight,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: 2,
    },
    menuChipText: {
        fontSize: 11,
        color: Colors.primaryDark,
        fontWeight: '600',
    },
    selectedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: BorderRadius.round,
        marginTop: 2,
    },
    selectedText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '800',
    },
});

export default RestaurantCard;
