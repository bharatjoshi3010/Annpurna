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
    Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_BASE_URL } from '../../config';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';

// ─── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = (v: string) => /^[6-9]\d{9}$/.test(v.trim());        // Indian 10-digit
const isValidYear = (v: string) => /^\d{4}$/.test(v) && +v >= 1900 && +v <= new Date().getFullYear();
const isValidCapacity = (v: string) => /^\d+$/.test(v) && +v > 0;
const isNonEmpty = (v: string) => v.trim().length > 0;
const isValidPassword = (v: string) => v.length >= 6;

interface FieldError { [key: string]: string }

type DocField = {
    uri: string;
    name: string;
    type: string;
    size: number;
} | null;

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB

// ─── Component ────────────────────────────────────────────────────────────────
const SignupScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldError>({});

    const { setUser } = useAuth();

    // Common fields
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Student fields
    const [name, setName] = useState('');
    const [localGuardianName, setLocalGuardianName] = useState('');
    const [localGuardianPhone, setLocalGuardianPhone] = useState('');
    const [hometownAddress, setHometownAddress] = useState('');
    const [studentIdCard, setStudentIdCard] = useState<DocField>(null);

    // Restaurant fields
    const [ownerName, setOwnerName] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [openingYear, setOpeningYear] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');
    const [fssaiCert, setFssaiCert] = useState<DocField>(null);
    const [regCert, setRegCert] = useState<DocField>(null);

    // ── Image picker ──────────────────────────────────────────────────────────
    const pickDocument = async (
        setter: React.Dispatch<React.SetStateAction<DocField>>,
        fieldKey: string,
    ) => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.85,
            includeExtra: true,
        });

        if (result.didCancel || !result.assets?.length) return;
        const asset = result.assets[0];

        if (!asset.uri || !asset.fileSize) {
            Alert.alert('Error', 'Could not read the selected file.');
            return;
        }
        if (asset.fileSize > MAX_FILE_BYTES) {
            setErrors((prev) => ({ ...prev, [fieldKey]: 'Image must be smaller than 1 MB' }));
            setter(null);
            return;
        }

        setter({ uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.type || 'image/jpeg', size: asset.fileSize });
        setErrors((prev) => { const copy = { ...prev }; delete copy[fieldKey]; return copy; });
    };

    // ── Upload a document to the server, returns the server path ─────────────
    const uploadDocument = async (doc: NonNullable<DocField>, endpoint: string, fieldName: string): Promise<string> => {
        const form = new FormData();
        form.append(fieldName, { uri: doc.uri, name: doc.name, type: doc.type } as any);

        const res = await fetch(`${BASE_URL}/api/upload/${endpoint}`, {
            method: 'POST',
            body: form,
            // Do NOT set Content-Type manually — fetch auto-sets multipart/form-data
            // with the correct boundary when a FormData body is used.
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        return data.image as string;
    };

    // ── Inline field validation ───────────────────────────────────────────────
    const validate = (field: string, value: string) => {
        let msg = '';
        switch (field) {
            case 'email': msg = isValidEmail(value) ? '' : 'Enter a valid email address'; break;
            case 'password': msg = isValidPassword(value) ? '' : 'Password must be at least 6 characters'; break;
            case 'phoneNumber': msg = isValidPhone(value) ? '' : 'Enter a valid 10-digit mobile number'; break;
            case 'localGuardianPhone': msg = isValidPhone(value) ? '' : 'Enter a valid 10-digit mobile number'; break;
            case 'openingYear': msg = isValidYear(value) ? '' : 'Enter a valid year (e.g. 2010)'; break;
            case 'maxCapacity': msg = isValidCapacity(value) ? '' : 'Capacity must be a positive number'; break;
            default: msg = isNonEmpty(value) ? '' : 'This field is required';
        }
        setErrors((prev) => ({ ...prev, [field]: msg }));
    };

    // ── Full form validation before submit ────────────────────────────────────
    const validateAll = (): boolean => {
        const errs: FieldError = {};

        if (!isValidEmail(email)) errs.email = 'Enter a valid email address';
        if (!isValidPassword(password)) errs.password = 'Password must be at least 6 characters';
        if (!isValidPhone(phoneNumber)) errs.phoneNumber = 'Enter a valid 10-digit mobile number';
        if (!isNonEmpty(address)) errs.address = 'This field is required';

        if (role === 'student') {
            if (!isNonEmpty(name)) errs.name = 'This field is required';
            if (!isNonEmpty(localGuardianName)) errs.localGuardianName = 'This field is required';
            if (!isValidPhone(localGuardianPhone)) errs.localGuardianPhone = 'Enter a valid 10-digit mobile number';
            if (!isNonEmpty(hometownAddress)) errs.hometownAddress = 'This field is required';
            if (!studentIdCard) errs.studentIdCard = 'Please upload your student ID card';
        } else {
            if (!isNonEmpty(ownerName)) errs.ownerName = 'This field is required';
            if (!isNonEmpty(restaurantName)) errs.restaurantName = 'This field is required';
            if (!isValidYear(openingYear)) errs.openingYear = 'Enter a valid year (e.g. 2010)';
            if (!isValidCapacity(maxCapacity)) errs.maxCapacity = 'Capacity must be a positive number';
            if (!fssaiCert) errs.fssaiCert = 'Please upload the FSSAI certificate';
            if (!regCert) errs.regCert = 'Please upload the registration certificate';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Signup submit ─────────────────────────────────────────────────────────
    const handleSignup = async () => {
        if (!validateAll()) {
            Alert.alert('Validation Error', 'Please fix the highlighted errors before continuing.');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload document(s) first
            let studentIdCardUrl: string | null = null;
            let fssaiCertUrl: string | null = null;
            let regCertUrl: string | null = null;

            if (role === 'student' && studentIdCard) {
                studentIdCardUrl = await uploadDocument(studentIdCard, 'student-id', 'studentIdCard');
            }
            if (role === 'restaurant') {
                if (fssaiCert) fssaiCertUrl = await uploadDocument(fssaiCert, 'fssai-cert', 'fssaiCertificate');
                if (regCert) regCertUrl = await uploadDocument(regCert, 'registration-cert', 'registrationCertificate');
            }

            // 2. Build registration payload
            const payload: any = { email: email.trim(), password, role, address: address.trim(), phoneNumber: phoneNumber.trim() };

            if (role === 'student') {
                payload.name = name.trim();
                payload.localGuardianName = localGuardianName.trim();
                payload.localGuardianPhone = localGuardianPhone.trim();
                payload.hometownAddress = hometownAddress.trim();
                if (studentIdCardUrl) payload.studentIdCard = studentIdCardUrl;
            } else {
                payload.ownerName = ownerName.trim();
                payload.restaurantName = restaurantName.trim();
                payload.openingYear = openingYear;
                payload.maxCapacity = maxCapacity;
                if (fssaiCertUrl) payload.fssaiCertificate = fssaiCertUrl;
                if (regCertUrl) payload.registrationCertificate = regCertUrl;
            }

            // 3. Register user
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data);
                navigation.replace(role === 'restaurant' ? 'RestaurantMain' : 'Main');
            } else {
                Alert.alert('Signup Failed', data.message || 'Could not create account');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Network request failed. Ensure your backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // ── Reusable field renderer ───────────────────────────────────────────────
    const renderField = (
        label: string,
        value: string,
        setter: (v: string) => void,
        fieldKey: string,
        opts: {
            placeholder?: string;
            keyboardType?: any;
            secureTextEntry?: boolean;
            autoCapitalize?: any;
        } = {},
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, errors[fieldKey] ? styles.inputError : null]}
                placeholder={opts.placeholder || `Enter ${label.toLowerCase()}`}
                placeholderTextColor="#aaa"
                value={value}
                onChangeText={(v) => { setter(v); validate(fieldKey, v); }}
                onBlur={() => validate(fieldKey, value)}
                keyboardType={opts.keyboardType}
                secureTextEntry={opts.secureTextEntry}
                autoCapitalize={opts.autoCapitalize ?? 'sentences'}
            />
            {!!errors[fieldKey] && <Text style={styles.errorText}>⚠ {errors[fieldKey]}</Text>}
        </View>
    );

    // ── Document picker renderer ──────────────────────────────────────────────
    const renderDocPicker = (
        label: string,
        doc: DocField,
        setter: React.Dispatch<React.SetStateAction<DocField>>,
        fieldKey: string,
        hint?: string,
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            {hint && <Text style={styles.hintText}>{hint}</Text>}
            <TouchableOpacity
                style={[styles.docPickerBtn, errors[fieldKey] ? styles.inputError : null]}
                onPress={() => pickDocument(setter, fieldKey)}
                activeOpacity={0.7}
            >
                {doc ? (
                    <View style={styles.docRow}>
                        <Image source={{ uri: doc.uri }} style={styles.docThumb} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                            <Text style={styles.docSize}>{(doc.size / 1024).toFixed(1)} KB</Text>
                        </View>
                        <Text style={styles.changeText}>Change</Text>
                    </View>
                ) : (
                    <Text style={styles.docPlaceholder}>📎  Tap to upload image (max 1 MB)</Text>
                )}
            </TouchableOpacity>
            {!!errors[fieldKey] && <Text style={styles.errorText}>⚠ {errors[fieldKey]}</Text>}
        </View>
    );

    // ── Render ────────────────────────────────────────────────────────────────
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
                    {/* Role Selector */}
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

                    {/* Common fields */}
                    {renderField('Email address', email, setEmail, 'email', {
                        placeholder: 'Enter your email',
                        keyboardType: 'email-address',
                        autoCapitalize: 'none',
                    })}
                    {renderField('Password', password, setPassword, 'password', {
                        placeholder: 'Min. 6 characters',
                        secureTextEntry: true,
                        autoCapitalize: 'none',
                    })}
                    {renderField('Phone Number', phoneNumber, setPhoneNumber, 'phoneNumber', {
                        placeholder: '10-digit mobile number',
                        keyboardType: 'phone-pad',
                        autoCapitalize: 'none',
                    })}
                    {renderField('Address', address, setAddress, 'address', {
                        placeholder: 'Enter current address',
                    })}

                    {/* Student-specific fields */}
                    {role === 'student' ? (
                        <>
                            {renderField('Full Name', name, setName, 'name', { placeholder: 'Enter your full name' })}
                            {renderField('Local Guardian Name', localGuardianName, setLocalGuardianName, 'localGuardianName', { placeholder: "Guardian's name" })}
                            {renderField('Local Guardian Phone', localGuardianPhone, setLocalGuardianPhone, 'localGuardianPhone', {
                                placeholder: "Guardian's 10-digit number",
                                keyboardType: 'phone-pad',
                                autoCapitalize: 'none',
                            })}
                            {renderField('Hometown Address', hometownAddress, setHometownAddress, 'hometownAddress', { placeholder: 'Permanent address' })}
                            {renderDocPicker(
                                'Student ID Card',
                                studentIdCard,
                                setStudentIdCard,
                                'studentIdCard',
                                'Upload a clear photo of your college/university ID card',
                            )}
                        </>
                    ) : (
                        <>
                            {renderField('Owner Name', ownerName, setOwnerName, 'ownerName', { placeholder: 'Enter owner full name' })}
                            {renderField('Restaurant Name', restaurantName, setRestaurantName, 'restaurantName', { placeholder: 'Restaurant / outlet name' })}
                            {renderField('Opening Year', openingYear, setOpeningYear, 'openingYear', {
                                placeholder: 'e.g. 2010',
                                keyboardType: 'numeric',
                                autoCapitalize: 'none',
                            })}
                            {renderField('Max Capacity', maxCapacity, setMaxCapacity, 'maxCapacity', {
                                placeholder: 'Number of seats, e.g. 50',
                                keyboardType: 'numeric',
                                autoCapitalize: 'none',
                            })}
                            {renderDocPicker(
                                'FSSAI Certificate',
                                fssaiCert,
                                setFssaiCert,
                                'fssaiCert',
                                'Upload a photo of your FSSAI food safety certificate',
                            )}
                            {renderDocPicker(
                                'Business Registration Certificate',
                                regCert,
                                setRegCert,
                                'regCert',
                                'Upload a photo of your official business registration document',
                            )}
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

    // Role toggle
    roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
    roleButton: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, alignItems: 'center', marginHorizontal: 4 },
    roleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    roleText: { color: Colors.text, fontWeight: '600' },
    roleTextActive: { color: Colors.white, fontWeight: '600' },

    // Input fields
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginLeft: 4 },
    hintText: { fontSize: 12, color: Colors.textLight, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: Colors.white, height: 54, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
    inputError: { borderColor: '#e53935', borderWidth: 1.5 },
    errorText: { fontSize: 12, color: '#e53935', marginTop: 4, marginLeft: 4 },

    // Document picker
    docPickerBtn: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', padding: 14, minHeight: 60, justifyContent: 'center' },
    docPlaceholder: { color: '#aaa', fontSize: 14, textAlign: 'center' },
    docRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    docThumb: { width: 48, height: 48, borderRadius: 6, resizeMode: 'cover' },
    docName: { fontSize: 13, color: Colors.text, fontWeight: '500' },
    docSize: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
    changeText: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginLeft: 4 },

    // Buttons & footer
    signupButton: { marginTop: Spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    footerText: { color: Colors.textLight, fontSize: 14 },
    signupText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

export default SignupScreen;
