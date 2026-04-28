export const Colors = {
    // Core brand — warm saffron/orange gradient pair
    primary:    '#F97316',   // vibrant saffron-orange
    primaryDark:'#C2410C',   // deep burnt orange
    primaryLight:'#FFEDD5',  // very light peach

    secondary:  '#FCD34D',   // turmeric yellow
    secondaryLight: '#FFFBEB',

    // Backgrounds
    background: '#FAFAF9',   // off-white warm
    surface:    '#FFFFFF',
    surfaceAlt: '#F5F0EB',   // warm card tint

    // Text
    text:       '#1C1917',   // near-black warm
    textSecondary: '#57534E', // warm medium grey
    textLight:  '#A8A29E',   // warm light grey

    // Borders
    border:     '#E7E5E4',
    borderLight:'#F5F5F4',

    // Semantic
    success:    '#16A34A',
    successLight:'#DCFCE7',
    error:      '#DC2626',
    errorLight: '#FEE2E2',
    warning:    '#D97706',
    warningLight:'#FEF3C7',
    info:       '#0EA5E9',
    infoLight:  '#E0F2FE',

    white:      '#FFFFFF',
    black:      '#000000',

    // Gradients (start/end pairs used in LinearGradient if needed, or for reference)
    gradientStart: '#F97316',
    gradientEnd:   '#EF4444',

    cardBg:     '#FFFFFF',
};

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
        color: '#1C1917',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: '#1C1917',
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 17,
        fontWeight: '600' as const,
        color: '#1C1917',
    },
    body: {
        fontSize: 15,
        color: '#57534E',
        lineHeight: 22,
    },
    caption: {
        fontSize: 13,
        color: '#A8A29E',
        lineHeight: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: '#A8A29E',
        letterSpacing: 0.8,
        textTransform: 'uppercase' as const,
    },
};
