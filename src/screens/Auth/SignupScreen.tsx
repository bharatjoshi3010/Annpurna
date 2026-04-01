import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import AppButton from '../../components/AppButton';

const SignupScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);

    // Common fields
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Student fields
    const [name, setName] = useState('');
    const [localGuardianName, setLocalGuardianName] = useState('');
    const [localGuardianPhone, setLocalGuardianPhone] = useState('');
    const [hometownAddress, setHometownAddress] = useState('');

    // Restaurant fields
    const [ownerName, setOwnerName] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [openingYear, setOpeningYear] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in core fields');
            return;
        }

        const payload: any = { email, password, role, address, phoneNumber };
        if (role === 'student') {
            if (!name || !localGuardianName || !localGuardianPhone || !hometownAddress || !address || !phoneNumber) {
                Alert.alert('Error', 'Please fill in all student details');
                return;
            }
            payload.name = name;
            payload.localGuardianName = localGuardianName;
            payload.localGuardianPhone = localGuardianPhone;
            payload.hometownAddress = hometownAddress;
        } else {
            if (!ownerName || !restaurantName || !openingYear || !maxCapacity || !address || !phoneNumber) {
                Alert.alert('Error', 'Please fill in all restaurant details');
                return;
            }
            payload.ownerName = ownerName;
            payload.restaurantName = restaurantName;
            payload.openingYear = openingYear;
            payload.maxCapacity = maxCapacity;
        }

        setLoading(true);
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                if (role === 'restaurant') {
                    navigation.replace('RestaurantMain');
                } else {
                    navigation.replace('Main');
                }
            } else {
                Alert.alert('Signup Failed', data.message || 'Could not create account');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Network request failed. Ensure your backend is running and MongoDB is whitelisted.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={Typography.h1}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the meal network today</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'student' && styles.roleActive]}
                            onPress={() => setRole('student')}
                        >
                            <Text style={role === 'student' ? styles.roleTextActive : styles.roleText}>Consumer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'restaurant' && styles.roleActive]}
                            onPress={() => setRole('restaurant')}
                        >
                            <Text style={role === 'restaurant' ? styles.roleTextActive : styles.roleText}>Restaurant</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter current address"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    {role === 'student' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Local Guardian Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Guardian's Name"
                                    value={localGuardianName}
                                    onChangeText={setLocalGuardianName}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Local Guardian Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Guardian's Phone"
                                    value={localGuardianPhone}
                                    onChangeText={setLocalGuardianPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Hometown Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Hometown address"
                                    value={hometownAddress}
                                    onChangeText={setHometownAddress}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Owner Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter owner name"
                                    value={ownerName}
                                    onChangeText={setOwnerName}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Restaurant Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter restaurant name"
                                    value={restaurantName}
                                    onChangeText={setRestaurantName}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Opening Year</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 2010"
                                    value={openingYear}
                                    onChangeText={setOpeningYear}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Max Capacity</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 50"
                                    value={maxCapacity}
                                    onChangeText={setMaxCapacity}
                                    keyboardType="numeric"
                                />
                            </View>
                        </>
                    )}

                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.md }} />
                    ) : (
                        <AppButton title="Sign Up" onPress={handleSignup} style={styles.signupButton} />
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.signupText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.lg },
    header: { marginBottom: Spacing.xl },
    subtitle: { ...Typography.body, color: Colors.textLight, marginTop: 8 },
    form: { flex: 1 },
    roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
    roleButton: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, alignItems: 'center', marginHorizontal: 4 },
    roleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    roleText: { color: Colors.text, fontWeight: '600' },
    roleTextActive: { color: Colors.white, fontWeight: '600' },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: Colors.white, height: 54, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, borderWidth: 1, borderColor: Colors.border },
    signupButton: { marginTop: Spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    footerText: { color: Colors.textLight, fontSize: 14 },
    signupText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

export default SignupScreen;
