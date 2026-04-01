import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import AppButton from '../../components/AppButton';

const StudentOnboardingScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [budget, setBudget] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async (skip = false) => {
        setLoading(true);
        // Note: In a real app we would get the auth token from AsyncStorage or Context here.
        // Assuming the token is available or this is passed via route params, for now we will just simulate success to navigate
        // or actually send to API if token is stored in Context.

        try {
            // Simulated or real fetch to PUT /api/auth/profile
            // Make sure the token is securely stored and passed in headers { Authorization: 'Bearer ' + token }

            Alert.alert('Success', skip ? 'Skipped for now' : 'Profile Updated');
            navigation.replace('Main');
        } catch (error) {
            Alert.alert('Error', 'Could not complete profile setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={Typography.h1}>Consumer Details</Text>
                <Text style={styles.subtitle}>Help us personalize your experience</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location / College</Text>
                    <TextInput style={styles.input} placeholder="E.g., North Campus" value={location} onChangeText={setLocation} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Monthly Budget</Text>
                    <TextInput style={styles.input} placeholder="E.g., 2000" keyboardType="numeric" value={budget} onChangeText={setBudget} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select a Plan</Text>
                    <View style={styles.planContainer}>
                        {['Basic', 'Premium', 'Pro'].map(plan => (
                            <TouchableOpacity
                                key={plan}
                                style={[styles.planCard, selectedPlan === plan && styles.planCardActive]}
                                onPress={() => setSelectedPlan(plan)}
                            >
                                <Text style={selectedPlan === plan ? styles.planTextActive : styles.planText}>{plan}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.md }} />
                ) : (
                    <View style={styles.actions}>
                        <AppButton title="Save & Continue" onPress={() => handleSave(false)} style={styles.saveBtn} />
                        <TouchableOpacity style={styles.skipBtn} onPress={() => handleSave(true)}>
                            <Text style={styles.skipText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { padding: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
    header: { marginBottom: Spacing.xl },
    subtitle: { ...Typography.body, color: Colors.textLight, marginTop: 8 },
    form: { flex: 1 },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: Colors.white, height: 54, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, borderWidth: 1, borderColor: Colors.border },
    planContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    planCard: { flex: 1, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, borderRadius: BorderRadius.md, alignItems: 'center', marginHorizontal: 4 },
    planCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    planText: { color: Colors.text, fontWeight: '600' },
    planTextActive: { color: Colors.white, fontWeight: '600' },
    actions: { marginTop: Spacing.xl },
    saveBtn: { marginBottom: Spacing.md },
    skipBtn: { alignItems: 'center', padding: Spacing.md },
    skipText: { color: Colors.textLight, fontSize: 14, fontWeight: '600' }
});

export default StudentOnboardingScreen;
