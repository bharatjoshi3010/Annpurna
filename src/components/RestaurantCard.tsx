import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useThemeColors, Spacing, BorderRadius, Shadows } from '../styles/theme';
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
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
    name, cuisine, rating, imageUrl, onPress, isSelected,
    kycStatus, menuItemName,
}) => {
    const C = useThemeColors();

    const getSafeUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.includes('10.0.2.2') || url.includes('localhost')) {
            const match = url.match(/:(\d+)(\/.*)/);
            if (match) return `${API_BASE_URL}${match[2]}`;
        }
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
        return url;
    };

    const displayImage = getSafeUrl(imageUrl);
    const isApproved = kycStatus === 'approved';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: isSelected ? C.primaryLight : C.surface,
                    borderColor: isSelected ? C.primary : C.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.88}
        >
            {/* Image / placeholder */}
            <View style={styles.imageContainer}>
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.image} />
                ) : (
                    <View style={[styles.placeholder, { backgroundColor: C.surfaceAlt }]}>
                        <Text style={[styles.placeholderInitial, { color: C.primary }]}>
                            {name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                {kycStatus && (
                    <View style={[
                        styles.kycPill,
                        { backgroundColor: isApproved ? C.successLight : C.warningLight },
                    ]}>
                        <Text style={[
                            styles.kycText,
                            { color: isApproved ? C.success : C.warning },
                        ]}>
                            {isApproved ? '✓ Verified' : '⏳ Pending'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>{name}</Text>
                    <View style={[styles.ratingPill, { backgroundColor: C.warningLight }]}>
                        <Text style={[styles.ratingStar, { color: C.warning }]}>★</Text>
                        <Text style={[styles.ratingNum, { color: C.warning }]}>{rating}</Text>
                    </View>
                </View>

                <Text style={[styles.cuisine, { color: C.textLight }]} numberOfLines={1}>
                    {cuisine || 'Multi-cuisine'}
                </Text>

                {menuItemName && (
                    <View style={[styles.menuChip, { backgroundColor: C.primaryLight }]}>
                        <Text style={[styles.menuChipText, { color: C.primaryDark }]} numberOfLines={1}>
                            🍲 {menuItemName}
                        </Text>
                    </View>
                )}

                {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: C.primary }]}>
                        <Text style={styles.selectedText}>✓ Selected</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        marginVertical: 6,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    imageContainer: { width: 90, height: 100, position: 'relative' },
    image: { width: '100%', height: '100%' },
    placeholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    placeholderInitial: { fontSize: 34, fontWeight: '800' },
    kycPill: {
        position: 'absolute', bottom: 6, left: 4,
        paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
    },
    kycText: { fontSize: 8, fontWeight: '800' },
    info: { flex: 1, padding: Spacing.sm + 2, justifyContent: 'center', gap: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { flex: 1, fontSize: 15, fontWeight: '700' },
    ratingPill: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, gap: 2,
    },
    ratingStar: { fontSize: 11 },
    ratingNum: { fontSize: 11, fontWeight: '700' },
    cuisine: { fontSize: 12, fontWeight: '500' },
    menuChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
    menuChipText: { fontSize: 11, fontWeight: '600' },
    selectedBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.round, marginTop: 2 },
    selectedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
});

export default RestaurantCard;
