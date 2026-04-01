import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

const QRCodeScreen = ({ navigation }: any) => {
    // Example verification code (would usually be dynamic)
    const verificationData = JSON.stringify({
        userId: '12345',
        mealId: 'lunch-2026-03-12',
        timestamp: Date.now(),
    });

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Meal Verification" />

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Ready for Lunch?</Text>
                    <Text style={styles.infoSubtitle}>
                        Scan this QR code at the restaurant counter to verify your meal subscription.
                    </Text>
                </View>

                <View style={styles.qrContainer}>
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={verificationData}
                            size={width * 0.6}
                            color={Colors.text}
                            backgroundColor={Colors.white}
                        />
                    </View>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>Code valid for 01:54</Text>
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Restaurant</Text>
                        <Text style={styles.detailValue}>The Green Plate</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Meal Type</Text>
                        <Text style={styles.detailValue}>Lunch (Subscription)</Text>
                    </View>
                </View>

                <View style={styles.instruction}>
                    <Text style={styles.instructionText}>
                        Please ensure your screen brightness is at maximum for better scanning.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    infoCard: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    infoTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    timerContainer: {
        marginTop: Spacing.md,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    detailsContainer: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    detailLabel: {
        color: Colors.textLight,
        fontSize: 14,
    },
    detailValue: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    instruction: {
        marginTop: 'auto',
        marginBottom: Spacing.xl,
    },
    instructionText: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default QRCodeScreen;
