/**
 * MealStatusBadge.tsx
 *
 * Displays a live badge at the top of the customer home screen showing:
 *   🍳 PREPARING   — within the booking window, cutoff not yet hit
 *   🍽️  SERVING     — meal service is actively ongoing
 *   ⏳ ENDS SOON   — service window closing in < 30 min
 *   😴 RESTING     — no meal is active or upcoming (late night / early morning)
 *
 * Meal windows (IST):
 *   Breakfast  →  serving 08:00–10:30,  cutoff 07:30
 *   Lunch      →  serving 12:30–15:30,  cutoff 12:30
 *   Dinner     →  serving 19:30–22:30,  cutoff 18:45
 *
 * Updates automatically every 30 seconds.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { useThemeColors } from '../styles/theme';

// ── Meal schedule ─────────────────────────────────────────────────────────────
const MEALS = [
    {
        name:         'Breakfast',
        emoji:        '🍳',
        // Cutoff = last minute you can still book / change restaurant
        cutoffH: 7,  cutoffM: 30,
        // Service window
        startH: 8,   startM: 0,
        endH:   10,  endM:   30,
    },
    {
        name:    'Lunch',
        emoji:   '🍱',
        cutoffH: 12, cutoffM: 30,
        startH:  12, startM:  30,
        endH:    15, endM:    30,
    },
    {
        name:    'Dinner',
        emoji:   '🌙',
        cutoffH: 18, cutoffM: 45,
        startH:  19, startM:  30,
        endH:    22, endM:    30,
    },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const toMins = (h: number, m: number) => h * 60 + m;

const fmt12 = (h: number, m: number) => {
    const period = h < 12 ? 'AM' : 'PM';
    const hour   = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

// ── state machine ─────────────────────────────────────────────────────────────
type BadgeState =
    | { phase: 'preparing'; meal: string; emoji: string; cutoffAt: string; cutoffInMins: number }
    | { phase: 'serving';   meal: string; emoji: string; endsAt: string;   minsLeft: number }
    | { phase: 'endssoon';  meal: string; emoji: string; endsAt: string;   minsLeft: number }
    | { phase: 'resting';   nextMeal: string; nextAt: string }
    | { phase: 'done' };

const computeState = (): BadgeState => {
    const now  = new Date();
    const curr = toMins(now.getHours(), now.getMinutes());

    for (const meal of MEALS) {
        const cutoff = toMins(meal.cutoffH, meal.cutoffM);
        const start  = toMins(meal.startH,  meal.startM);
        const end    = toMins(meal.endH,    meal.endM);

        // Preparing: after midnight up to the cutoff
        if (curr < cutoff) {
            return {
                phase:       'preparing',
                meal:        meal.name,
                emoji:       meal.emoji,
                cutoffAt:    fmt12(meal.cutoffH, meal.cutoffM),
                cutoffInMins: cutoff - curr,
            };
        }

        // Service window
        if (curr >= start && curr < end) {
            const minsLeft = end - curr;
            return minsLeft <= 30
                ? { phase: 'endssoon', meal: meal.name, emoji: meal.emoji, endsAt: fmt12(meal.endH, meal.endM), minsLeft }
                : { phase: 'serving',  meal: meal.name, emoji: meal.emoji, endsAt: fmt12(meal.endH, meal.endM), minsLeft };
        }

        // Between cutoff and service start (very narrow gap for Dinner: 18:45–19:30)
        if (curr >= cutoff && curr < start) {
            return {
                phase:       'preparing',
                meal:        meal.name,
                emoji:       meal.emoji,
                cutoffAt:    fmt12(meal.startH, meal.startM),
                cutoffInMins: start - curr,
            };
        }
    }

    // After Dinner ends — restaurant is resting
    return { phase: 'resting', nextMeal: 'Breakfast', nextAt: '8:00 AM' };
};

// ── Component ─────────────────────────────────────────────────────────────────
const MealStatusBadge: React.FC = () => {
    const [state, setState] = useState<BadgeState>(computeState);
    const [pulse]           = useState(new Animated.Value(1));
    const C = useThemeColors();
    const isDark = C.background === '#0F0E0D';

    // Re-compute every 30 seconds
    useEffect(() => {
        const id = setInterval(() => setState(computeState()), 30_000);
        return () => clearInterval(id);
    }, []);

    // Gentle pulse for the dot when SERVING / ENDSSOON
    useEffect(() => {
        if (state.phase === 'serving' || state.phase === 'endssoon') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulse.setValue(1);
        }
    }, [state.phase]);

    // ── Render helpers ────────────────────────────────────────────────────────
    const config = (() => {
        switch (state.phase) {
            case 'preparing':
                return {
                    bg:        isDark ? '#291E00' : '#FFF8E1',
                    border:    isDark ? '#856404' : '#FFD54F',
                    dot:       '#FFC107',
                    label:     `PREPARING  ${state.meal.toUpperCase()}`,
                    sub:       `Booking open · cutoff at ${state.cutoffAt}`,
                    emoji:     state.emoji,
                    textColor: isDark ? '#FDE68A' : '#795300',
                };
            case 'serving':
                return {
                    bg:        isDark ? '#052E16' : '#E8F5E9',
                    border:    isDark ? '#166534' : '#66BB6A',
                    dot:       '#4CAF50',
                    label:     `NOW SERVING  ${state.meal.toUpperCase()}`,
                    sub:       `Ends at ${state.endsAt} · ${state.minsLeft} min left`,
                    emoji:     state.emoji,
                    textColor: isDark ? '#4ADE80' : '#2E7D32',
                };
            case 'endssoon':
                return {
                    bg:        isDark ? '#450A0A' : '#FBE9E7',
                    border:    isDark ? '#991B1B' : '#EF9A9A',
                    dot:       '#F44336',
                    label:     `SERVING ENDS SOON`,
                    sub:       `${state.meal} wraps up at ${state.endsAt} · ${state.minsLeft} min left`,
                    emoji:     state.emoji,
                    textColor: isDark ? '#F87171' : '#B71C1C',
                };
            case 'resting':
                return {
                    bg:        isDark ? C.surfaceAlt : '#F3F4F6',
                    border:    isDark ? C.border     : '#D1D5DB',
                    dot:       '#9CA3AF',
                    label:     `RESTAURANT RESTING`,
                    sub:       `${state.nextMeal} service starts at ${state.nextAt}`,
                    emoji:     '😴',
                    textColor: isDark ? C.textLight : '#374151',
                };
            default:
                return null;
        }
    })();

    if (!config) return null;

    return (
        <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
            {/* Left: emoji */}
            <Text style={styles.emoji}>{config.emoji}</Text>

            {/* Middle: label + sub */}
            <View style={styles.textBlock}>
                <View style={styles.labelRow}>
                    <Animated.View style={[styles.dot, { backgroundColor: config.dot, opacity: pulse }]} />
                    <Text style={[styles.label, { color: config.textColor }]}>
                        {config.label}
                    </Text>
                </View>
                <Text style={[styles.sub, { color: C.textSecondary }]}>{config.sub}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection:  'row',
        alignItems:     'center',
        borderWidth:    1.5,
        borderRadius:   12,
        paddingVertical:   10,
        paddingHorizontal: 14,
        marginBottom:   16,
        gap: 12,
    },
    emoji: {
        fontSize: 26,
    },
    textBlock: {
        flex: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems:    'center',
        gap: 6,
    },
    dot: {
        width:        7,
        height:       7,
        borderRadius: 4,
    },
    label: {
        fontSize:    11,
        fontWeight:  '800',
        letterSpacing: 0.8,
    },
    sub: {
        fontSize:   12,
        marginTop:  3,
        lineHeight: 16,
    },
});

export default MealStatusBadge;
