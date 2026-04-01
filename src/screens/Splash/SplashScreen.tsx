import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { Colors, Typography } from '../../styles/theme';

const SplashScreen = ({ navigation }: any) => {
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

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

        const timer = setTimeout(() => {
            navigation.replace('Auth');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

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
});

export default SplashScreen;
