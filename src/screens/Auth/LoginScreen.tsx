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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../styles/theme';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);

    const { setUser } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                if (!data.isProfileComplete) {
                    Alert.alert('Incomplete Profile', 'Your profile is missing required details. You cannot sign in without them. Please register again or contact support.');
                    return;
                }

                setUser(data);

                if (role === 'restaurant') {
                    navigation.replace('RestaurantMain');
                } else {
                    navigation.replace('Main');
                }
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid credentials');
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
                    <Text style={Typography.h1}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Sign in to continue to Annpurna</Text>
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
                        <Text style={styles.label}>Email Address</Text>
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
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.md }} />
                    ) : (
                        <AppButton title="Login" onPress={handleLogin} style={styles.loginButton} />
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 80, paddingBottom: Spacing.lg },
    header: { marginBottom: Spacing.xl },
    subtitle: { ...Typography.body, color: Colors.textLight, marginTop: 8 },
    form: { flex: 1 },
    roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
    roleButton: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, alignItems: 'center', marginHorizontal: 4 },
    roleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    roleText: { color: Colors.text, fontWeight: '600' },
    roleTextActive: { color: Colors.white, fontWeight: '600' },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: Colors.white, height: 54, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, borderWidth: 1, borderColor: Colors.border },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
    forgotPasswordText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    loginButton: { marginTop: Spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    footerText: { color: Colors.textLight, fontSize: 14 },
    signupText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

export default LoginScreen;
