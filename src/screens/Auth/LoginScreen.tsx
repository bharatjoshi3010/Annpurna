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
    useColorScheme,
} from 'react-native';
import { useThemeColors, Spacing, Typography, BorderRadius, Shadows } from '../../styles/theme';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);

    const { setUser } = useAuth();
    const C = useThemeColors();

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
            style={{ flex: 1, backgroundColor: C.background }}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[Typography.h1, { color: C.text }]}>Welcome Back!</Text>
                    <Text style={[styles.subtitle, { color: C.textLight }]}>Sign in to continue to Annpurna</Text>
                </View>

                <View style={styles.form}>
                    {/* Role toggle */}
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                { borderColor: C.border, backgroundColor: C.surface },
                                role === 'student' && { backgroundColor: C.primary, borderColor: C.primary },
                            ]}
                            onPress={() => setRole('student')}
                        >
                            <Text style={[
                                styles.roleText,
                                { color: C.text },
                                role === 'student' && { color: '#FFFFFF' },
                            ]}>Consumer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                { borderColor: C.border, backgroundColor: C.surface },
                                role === 'restaurant' && { backgroundColor: C.primary, borderColor: C.primary },
                            ]}
                            onPress={() => setRole('restaurant')}
                        >
                            <Text style={[
                                styles.roleText,
                                { color: C.text },
                                role === 'restaurant' && { color: '#FFFFFF' },
                            ]}>Restaurant</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.text }]}>Email Address</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: C.inputBg,
                                    borderColor: C.inputBorder,
                                    color: C.inputText,
                                },
                            ]}
                            placeholder="Enter your email"
                            placeholderTextColor={C.inputPlaceholder}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password — dark input so dots are visible */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.text }]}>Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: C.inputBg,
                                    borderColor: C.inputBorder,
                                    color: C.inputText,
                                },
                            ]}
                            placeholder="Enter your password"
                            placeholderTextColor={C.inputPlaceholder}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={[styles.forgotPasswordText, { color: C.primary }]}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: Spacing.md }} />
                    ) : (
                        <AppButton title="Login" onPress={handleLogin} style={styles.loginButton} />
                    )}

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: C.textLight }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={[styles.signupText, { color: C.primary }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 80, paddingBottom: Spacing.lg },
    header: { marginBottom: Spacing.xl },
    subtitle: { fontSize: 15, marginTop: 8, lineHeight: 22 },
    form: { flex: 1 },
    roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
    roleButton: { flex: 1, paddingVertical: 12, borderWidth: 1, borderRadius: BorderRadius.md, alignItems: 'center', marginHorizontal: 4 },
    roleText: { fontWeight: '600', fontSize: 14 },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    input: { height: 54, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, borderWidth: 1 },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
    forgotPasswordText: { fontWeight: '600', fontSize: 14 },
    loginButton: { marginTop: Spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    footerText: { fontSize: 14 },
    signupText: { fontWeight: '700', fontSize: 14 },
});

export default LoginScreen;
