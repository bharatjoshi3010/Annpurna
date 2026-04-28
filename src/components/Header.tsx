import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadows } from '../styles/theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
    subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, showBack, onBackPress, rightElement, subtitle }) => {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity onPress={onBackPress} style={styles.backButton} activeOpacity={0.7}>
                            <Text style={styles.backIcon}>‹</Text>
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                </View>
                <View style={styles.rightContainer}>{rightElement}</View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        ...Shadows.sm,
    },
    container: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 6,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 26,
        color: Colors.text,
        lineHeight: 30,
        marginTop: -2,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 1,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default Header;
