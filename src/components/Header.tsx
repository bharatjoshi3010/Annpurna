import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, showBack, onBackPress, rightElement }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                            <Text style={styles.backIcon}>←</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={[Typography.h2, styles.title]}>{title}</Text>
                </View>
                <View style={styles.rightContainer}>{rightElement}</View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.white,
    },
    container: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: Spacing.sm,
        padding: Spacing.xs,
    },
    backIcon: {
        fontSize: 24,
        color: Colors.text,
    },
    title: {
        fontWeight: '700',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default Header;
