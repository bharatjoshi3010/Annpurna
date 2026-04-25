import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../styles/theme';
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
    name,
    cuisine,
    rating,
    imageUrl,
    onPress,
    isSelected,
    kycStatus,
    menuItemName,
    menuItemImage,
}) => {
    const getKycBadgeStyle = () => {
        switch (kycStatus) {
            case 'approved': return styles.approvedBadge;
            case 'pending': return styles.pendingBadge;
            case 'rejected': return styles.rejectedBadge;
            default: return styles.pendingBadge;
        }
    };

    const getKycTextStyle = () => {
        switch (kycStatus) {
            case 'approved': return styles.approvedText;
            case 'pending': return styles.pendingText;
            case 'rejected': return styles.rejectedText;
            default: return styles.pendingText;
        }
    };

    const getSafeUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.includes('10.0.2.2') || url.includes('localhost')) {
            const match = url.match(/:\d+(\/.*)/);
            if (match) return `${API_BASE_URL}${match[1]}`;
        }
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
        return url;
    };

    const displayImage = getSafeUrl(menuItemImage) || getSafeUrl(imageUrl);

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selectedContainer]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.image} />
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
                <View style={styles.metaRow}>
                    <Text style={Typography.caption}>{cuisine}</Text>
                    {kycStatus && (
                        <View style={[styles.kycBadge, getKycBadgeStyle()]}>
                            <Text style={[styles.kycText, getKycTextStyle()]}>{kycStatus.toUpperCase()}</Text>
                        </View>
                    )}
                </View>
                {menuItemName && (
                    <Text style={styles.menuItemText} numberOfLines={2}>
                        🍲 Serving: {menuItemName}
                    </Text>
                )}
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
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    menuItemText: {
        fontSize: 13,
        color: Colors.primary,
        marginTop: 6,
        fontWeight: '500',
    },
    kycBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.5,
    },
    kycText: {
        fontSize: 8,
        fontWeight: '800',
    },
    approvedBadge: {
        backgroundColor: '#E6FFFA',
        borderColor: '#38B2AC',
    },
    approvedText: {
        color: '#2C7A7B',
    },
    pendingBadge: {
        backgroundColor: '#FFFBEB',
        borderColor: '#D97706',
    },
    pendingText: {
        color: '#D97706',
    },
    rejectedBadge: {
        backgroundColor: '#FFF5F5',
        borderColor: '#E53E3E',
    },
    rejectedText: {
        color: '#E53E3E',
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
