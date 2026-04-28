import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import KYCWarning from '../../components/KYCWarning';
import UserAvatar from '../../components/UserAvatar';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_BASE_URL } from '../../config';

const ProfileScreen = ({ navigation }: any) => {
    const { user, setUser, logout } = useAuth();
    const [uploading, setUploading] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigation.replace('Auth');
    };

    const displayName = user?.name || user?.restaurantName || 'Guest';
    const displayEmail = user?.email || 'guest@example.com';

    // ── Pick & upload profile photo ──────────────────────────────────────────
    const handlePickPhoto = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('Error', response.errorMessage || 'Failed to pick image');
                return;
            }
            const asset = response.assets?.[0];
            if (!asset?.uri) return;

            setUploading(true);
            try {
                // 1. Upload to server
                const formData = new FormData();
                formData.append('image', {
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || `avatar_${Date.now()}.jpg`,
                } as any);

                const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');

                const photoUrl = `${API_BASE_URL}${uploadData.image}`;

                // 2. Save to profile
                const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user?.token}`,
                    },
                    body: JSON.stringify({ profilePhoto: photoUrl }),
                });
                const profileData = await profileRes.json();
                if (!profileRes.ok) throw new Error(profileData.message || 'Failed to save photo');

                // 3. Update local auth context
                setUser((prev: any) => ({ ...prev, profilePhoto: photoUrl }));
                Alert.alert('✅ Done', 'Profile photo updated!');
            } catch (err: any) {
                Alert.alert('Error', err.message || 'Something went wrong.');
            } finally {
                setUploading(false);
            }
        });
    };

    const MENU_OPTIONS = [
        { title: 'Personal Information', icon: '👤' },
        {
            title: 'My Subscriptions', icon: '💳',
            subtitle: user?.role === 'student'
                ? (user?.selectedPlan
                    ? `${user.selectedPlan} · ${user.subscriptionStatus?.toUpperCase()}`
                    : 'No active plan')
                : 'Manage Plans',
        },
        { title: 'Meal History', icon: '🍽️' },
        {
            title: user?.role === 'restaurant' ? 'Restaurant Settings' : 'Default Restaurant',
            icon: '🏪',
            subtitle: user?.role === 'restaurant'
                ? (user?.restaurantName || 'Set Info')
                : (user?.location || 'Not set'),
        },
        { title: 'Notifications', icon: '🔔' },
        { title: 'Settings', icon: '⚙️' },
        { title: 'Help & Support', icon: '❓' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Profile" />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
                    <KYCWarning />
                </View>

                {/* ── Profile header ─────────────────────────────────────── */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <UserAvatar
                            photoUrl={user?.profilePhoto}
                            name={displayName}
                            size={100}
                            borderWidth={4}
                            borderColor="#FFF1E8"
                        />
                        {/* Camera button overlay */}
                        <TouchableOpacity
                            style={styles.cameraBtn}
                            onPress={handlePickPhoto}
                            disabled={uploading}
                        >
                            {uploading
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={styles.cameraIcon}>📷</Text>}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{displayEmail}</Text>
                    <TouchableOpacity style={styles.editButton} onPress={handlePickPhoto}>
                        <Text style={styles.editButtonText}>
                            {user?.profilePhoto ? 'Change Photo' : 'Add Profile Photo'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ── Menu items ──────────────────────────────────────────── */}
                <View style={styles.menuContainer}>
                    {MENU_OPTIONS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => {
                                if (
                                    item.title === 'Personal Information' ||
                                    item.title === 'Restaurant Settings' ||
                                    item.title === 'Default Restaurant'
                                ) {
                                    navigation.navigate('PersonalDetails');
                                } else if (item.title === 'Meal History') {
                                    navigation.navigate('MealHistory');
                                } else if (item.title === 'My Subscriptions') {
                                    navigation.navigate('SubscriptionHistory');
                                }
                            }}
                        >
                            <View style={styles.menuIconContainer}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                {item.subtitle && (
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                )}
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: Spacing.md,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    cameraIcon: { fontSize: 15 },
    userName: { fontSize: 22, fontWeight: '700', color: Colors.text },
    userEmail: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
    editButton: {
        marginTop: Spacing.md,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    editButtonText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    menuContainer: {
        marginTop: Spacing.md,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceAlt,
    },
    menuIconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#FAF9F6',
        justifyContent: 'center', alignItems: 'center',
        marginRight: Spacing.md,
    },
    menuIcon: { fontSize: 18 },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '500', color: Colors.text },
    menuSubtitle: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
    arrow: { fontSize: 24, color: '#CCCCCC', marginLeft: Spacing.sm },
    logoutButton: {
        margin: Spacing.xl, paddingVertical: 16,
        alignItems: 'center', borderRadius: BorderRadius.md,
        backgroundColor: '#FFF1F0',
    },
    logoutText: { color: Colors.error, fontWeight: '700', fontSize: 16 },
    versionText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginBottom: Spacing.xl },
});

export default ProfileScreen;
