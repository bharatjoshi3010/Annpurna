import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { Colors, Typography } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

const SplashScreen = ({ navigation }: any) => {
    const { user, isLoading } = useAuth();
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    // ── Logo animation ────────────────────────────────────────────────────────
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ── Session check: wait until AuthContext finishes AsyncStorage lookup ────
    useEffect(() => {
        if (isLoading) return; // still checking — wait

        // Give the logo animation at least 1.5 s before navigating
        const minDelay = 1500;

        const timer = setTimeout(() => {
            if (user) {
                // Session found — skip login
                if (user.role === 'restaurant') {
                    navigation.replace('RestaurantMain');
                } else {
                    navigation.replace('Main');
                }
            } else {
                navigation.replace('Auth');
            }
        }, minDelay);

        return () => clearTimeout(timer);
    }, [isLoading, user, navigation]);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>🍲</Text>
                </View>
                <Text style={styles.appName}>Annpurna</Text>
                <Text style={styles.tagline}>Student Meal Network</Text>

                {/* Subtle loading indicator while session check runs */}
                {isLoading && (
                    <Text style={styles.loadingText}>Restoring session…</Text>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    logoEmoji: {
        fontSize: 60,
    },
    appName: {
        fontSize: 42,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 8,
        fontWeight: '500',
    },
    loadingText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 24,
        fontWeight: '400',
    },
});

export default SplashScreen;
