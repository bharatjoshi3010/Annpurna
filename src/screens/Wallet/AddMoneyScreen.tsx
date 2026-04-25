import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config';

const AddMoneyScreen = ({ navigation, route }: any) => {
    const { user, setUser } = useAuth();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const initialAmount = route.params?.amount?.toString() || '';
    const [amount, setAmount] = useState(initialAmount);
    const [loading, setLoading] = useState(false);

    const fetchPaymentSheetParams = async () => {
        const response = await fetch(`${API_BASE_URL}/api/payment/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                studentId: user._id,
            }),
        });
        const { clientSecret, paymentIntentId } = await response.json();

        return {
            clientSecret,
            paymentIntentId,
        };
    };

    const initializePaymentSheet = async () => {
        setLoading(true);
        try {
            const { clientSecret, paymentIntentId } = await fetchPaymentSheetParams();

            const { error } = await initPaymentSheet({
                merchantDisplayName: 'Annpurna Food Service',
                paymentIntentClientSecret: clientSecret,
                // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
                // methods that take time to settle, like separate bank transfers.
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: {
                    name: user.name,
                }
            });

            if (!error) {
                openPaymentSheet(paymentIntentId);
            } else {
                Alert.alert('Error', error.message);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not initialize payment sheet');
            setLoading(false);
        }
    };

    const openPaymentSheet = async (paymentIntentId: string) => {
        console.log('Opening payment sheet for:', paymentIntentId);
        const { error } = await presentPaymentSheet();

        if (error) {
            console.log('Payment sheet error:', error);
            Alert.alert(`Payment Cancelled`, error.message);
            setLoading(false);
        } else {
            console.log('Payment sheet successful, confirming with backend...');
            await confirmPayment(paymentIntentId);
        }
    };

    const confirmPayment = async (paymentIntentId: string) => {
        try {
            console.log('Sending confirmation to backend for:', paymentIntentId);
            const response = await fetch(`${API_BASE_URL}/api/payment/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentIntentId,
                    studentId: user._id,
                }),
            });

            console.log('Backend confirmation response status:', response.status);
            const data = await response.json();

            if (response.ok) {
                console.log('Payment verified successfully:', data);
                Alert.alert('Success', 'Money added to your wallet!');
                setUser({ ...user, walletBalance: data.balance });
                navigation.goBack();
            } else {
                console.log('Payment verification failed:', data);
                Alert.alert('Error', data.message || 'Payment verification failed on server');
            }
        } catch (e: any) {
            console.log('Confirmation network error:', e);
            Alert.alert('Error', `Could not confirm payment: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRecharge = () => {
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount to add');
            return;
        }
        initializePaymentSheet();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="Add Money" showBack onBackPress={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Enter Amount (INR)</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>

                    <View style={styles.quickAmounts}>
                        {['100', '200', '500', '1000'].map(val => (
                            <TouchableOpacity
                                key={val}
                                style={styles.chip}
                                onPress={() => setAmount(val)}
                            >
                                <Text style={styles.chipText}>+₹{val}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Platform Fee</Text>
                        <Text style={styles.infoValue}>₹0.00</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>GST</Text>
                        <Text style={styles.infoValue}>₹0.00</Text>
                    </View>
                    <View style={[styles.infoRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>₹{amount || '0.00'}</Text>
                    </View>
                </View>

                <AppButton
                    title={loading ? "Processing..." : `Proceed to Pay ₹${amount || '0'}`}
                    onPress={handleRecharge}
                    disabled={loading || !amount}
                />

                <View style={styles.secureBadge}>
                    <Text style={styles.secureText}>🔒 Secure SSL Encrypted Payment</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.md,
    },
    card: {
        backgroundColor: Colors.white,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: Spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
        paddingBottom: 8,
    },
    currency: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
    },
    quickAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: Spacing.lg,
    },
    chip: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    infoSection: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.xs,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: {
        color: Colors.textLight,
        fontSize: 15,
    },
    infoValue: {
        color: Colors.text,
        fontWeight: '600',
        fontSize: 15,
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    secureBadge: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    secureText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
});

export default AddMoneyScreen;
