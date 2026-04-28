import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../styles/theme';

interface UserAvatarProps {
    /** Full URL or local path of the profile photo */
    photoUrl?: string | null;
    /** Display name – first character becomes the fallback initial */
    name?: string;
    /** Diameter of the avatar circle (default 44) */
    size?: number;
    /** Optional border width */
    borderWidth?: number;
    /** Optional border colour */
    borderColor?: string;
    /** If provided, the whole avatar becomes a pressable button */
    onPress?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    photoUrl,
    name,
    size = 44,
    borderWidth = 0,
    borderColor = '#FFF1E8',
    onPress,
}) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const fontSize = size * 0.42;
    const borderRadius = size / 2;

    const circle = [
        styles.circle,
        { width: size, height: size, borderRadius, borderWidth, borderColor },
    ];

    const content = photoUrl ? (
        <Image
            source={{ uri: photoUrl }}
            style={[styles.image, { width: size, height: size, borderRadius }]}
            resizeMode="cover"
        />
    ) : (
        <View style={circle}>
            <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={photoUrl ? [styles.wrapper, { width: size, height: size, borderRadius, borderWidth, borderColor }] : undefined}
            >
                {content}
            </TouchableOpacity>
        );
    }

    if (photoUrl) {
        return (
            <View style={[styles.wrapper, { width: size, height: size, borderRadius, borderWidth, borderColor }]}>
                {content}
            </View>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    wrapper: {
        overflow: 'hidden',
    },
    circle: {
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        overflow: 'hidden',
    },
    initial: {
        fontWeight: '800',
        color: Colors.primary,
    },
});

export default UserAvatar;
