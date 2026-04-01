import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';

const ProfileScreen = ({ navigation }: any) => {
    const MENU_OPTIONS = [
        { title: 'Personal Information', icon: '👤' },
        { title: 'My Subscriptions', icon: '💳', subtitle: 'Premium Monthly' },
        { title: 'Meal History', icon: '🍽️' },
        { title: 'Default Restaurant', icon: '🏪', subtitle: 'The Green Plate' },
        { title: 'Notifications', icon: '🔔' },
        { title: 'Settings', icon: '⚙️' },
        { title: 'Help & Support', icon: '❓' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Profile" />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>B</Text>
                    </View>
                    <Text style={styles.userName}>Bharat</Text>
                    <Text style={styles.userEmail}>bharat@example.com</Text>
                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuContainer}>
                    {MENU_OPTIONS.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => navigation.replace('Auth')}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        borderWidth: 4,
        borderColor: '#FFF1E8',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '800',
        color: Colors.primary,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 4,
    },
    editButton: {
        marginTop: Spacing.md,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    editButtonText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    menuContainer: {
        marginTop: Spacing.md,
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FAF9F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    menuIcon: {
        fontSize: 18,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    menuSubtitle: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    arrow: {
        fontSize: 24,
        color: '#CCCCCC',
        marginLeft: Spacing.sm,
    },
    logoutButton: {
        margin: Spacing.xl,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
        backgroundColor: '#FFF1F0',
    },
    logoutText: {
        color: Colors.error,
        fontWeight: '700',
        fontSize: 16,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 12,
        marginBottom: Spacing.xl,
    },
});

export default ProfileScreen;
