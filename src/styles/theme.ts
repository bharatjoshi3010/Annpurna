import { useColorScheme } from 'react-native';

// ─── Light palette ─────────────────────────────────────────────────────────────
export const LightColors = {
    // Core brand — warm saffron/orange gradient pair
    primary:      '#F97316',
    primaryDark:  '#C2410C',
    primaryLight: '#FFEDD5',

    secondary:      '#FCD34D',
    secondaryLight: '#FFFBEB',

    // Backgrounds
    background:  '#FAFAF9',
    surface:     '#FFFFFF',
    surfaceAlt:  '#F5F0EB',

    // Text
    text:          '#1C1917',
    textSecondary: '#57534E',
    textLight:     '#A8A29E',

    // Borders
    border:      '#E7E5E4',
    borderLight: '#F5F5F4',

    // Semantic
    success:      '#16A34A',
    successLight: '#DCFCE7',
    error:        '#DC2626',
    errorLight:   '#FEE2E2',
    warning:      '#D97706',
    warningLight: '#FEF3C7',
    info:         '#0EA5E9',
    infoLight:    '#E0F2FE',

    white: '#FFFFFF',
    black: '#000000',

    gradientStart: '#F97316',
    gradientEnd:   '#EF4444',

    cardBg: '#FFFFFF',

    // Input specific
    inputBg:          '#FFFFFF',
    inputText:        '#1C1917',
    inputPlaceholder: '#A8A29E',
    inputBorder:      '#E7E5E4',
};

// ─── Dark palette ──────────────────────────────────────────────────────────────
export const DarkColors = {
    // Core brand stays the same (orange pops on dark too)
    primary:      '#FB923C',   // slightly lighter orange for dark bg
    primaryDark:  '#EA580C',
    primaryLight: '#431407',   // deep burnt tint for dark surfaces

    secondary:      '#FBBF24',
    secondaryLight: '#292524',

    // Backgrounds
    background:  '#0F0E0D',   // near-black warm
    surface:     '#1C1A18',   // dark warm card
    surfaceAlt:  '#28231E',   // slightly lighter surface

    // Text — flip to light
    text:          '#F5F0EB',
    textSecondary: '#C4B5A8',
    textLight:     '#78716C',

    // Borders
    border:      '#3D3530',
    borderLight: '#2A2420',

    // Semantic — same hues, adjusted lightness
    success:      '#4ADE80',
    successLight: '#052E16',
    error:        '#F87171',
    errorLight:   '#450A0A',
    warning:      '#FBBF24',
    warningLight: '#451A03',
    info:         '#38BDF8',
    infoLight:    '#082F49',

    white: '#FFFFFF',
    black: '#000000',

    gradientStart: '#FB923C',
    gradientEnd:   '#EF4444',

    cardBg: '#1C1A18',

    // Input specific — crucial for password dot visibility
    inputBg:          '#28231E',   // dark input background
    inputText:        '#F5F0EB',   // light text so dots show
    inputPlaceholder: '#78716C',
    inputBorder:      '#3D3530',
};

// ─── Backwards-compat export (always light) ───────────────────────────────────
export const Colors = LightColors;

// ─── Hook: pick palette by OS appearance ──────────────────────────────────────
export const useThemeColors = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? DarkColors : LightColors;
};

// ─── Static tokens (unchanged) ────────────────────────────────────────────────
export const Spacing = {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    xxl: 48,
};

export const BorderRadius = {
    xs:    6,
    sm:    10,
    md:    14,
    lg:    20,
    xl:    28,
    round: 999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 5,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 10,
    },
    primary: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
};

export const Typography = {
    h1: {
        fontSize: 28,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as const,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 17,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
    },
    caption: {
        fontSize: 13,
        lineHeight: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: '700' as const,
        letterSpacing: 0.8,
        textTransform: 'uppercase' as const,
    },
};
