// trends. bar chart of co2 per day this week

import React, { useContext, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppContext } from '../state/context';
import { Screen, Card, Title, Muted, Chip, Spacer } from '../ui/components';
import { colors } from '../ui/theme';
import { weekKeyISO, startOfWeekISO, addDaysISO } from '../utils/time';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);

export default function TrendsScreen() {
  const { state } = useContext(AppContext);

  const data = useMemo(() => {
    const logs = state?.logs || [];
    const wk = weekKeyISO(new Date());
    const startISO = startOfWeekISO(new Date());

    // one bucket per day of the current week, starting at 0 kg
    const daily = Array.from({ length: 7 }).map((_, i) => ({
      day: addDaysISO(startISO, i),
      kg: 0,
    }));

    // add each of this week's logs into its day bucket
    for (const l of logs) {
      if (weekKeyISO(new Date(l.dateISO)) !== wk) continue;
      const bucket = daily.find((d) => d.day === dayKey(l.dateISO));
      if (bucket) bucket.kg += l.co2Kg || 0;
    }

    const total = daily.reduce((a, d) => a + d.kg, 0);
    const max = Math.max(1, ...daily.map((d) => d.kg));
    return { daily, total, max, startISO };
  }, [state]);

  const target = state?.targetKgPerWeek ?? 10;
  const perDayTarget = target / 7;

  return (
    <Screen>
      <Card>
        <Title>Weekly emissions</Title>
        <Muted style={{ marginTop: 6 }}>Week starting {data.startISO}</Muted>
        <View style={styles.chipRow}>
          <Chip kind="brand" label={`Total: ${data.total.toFixed(2)} kg CO₂`} />
          <Chip label={`Target: ${target.toFixed(1)} kg`} />
          <Chip label={`Daily guide: ${perDayTarget.toFixed(2)} kg/day`} />
        </View>
      </Card>

      <Spacer />
      <Card>
        <Title style={{ fontSize: 18 }}>Trend chart</Title>
        <Muted style={{ marginTop: 6 }}>Simple bar chart (kg CO₂ per day).</Muted>
        <Spacer />
        {data.daily.map((d) => {
          const widthPct = clamp(d.kg / data.max, 0, 1) * 100;
          const dayLabel = new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' });
          return (
            <View key={d.day} style={{ marginBottom: 10 }}>
              <View style={styles.dayRow}>
                <Text style={styles.day}>{dayLabel}</Text>
                <Text style={styles.kg}>{d.kg.toFixed(2)} kg</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${widthPct}%` }]} />
              </View>
            </View>
          );
        })}
        <View style={{ marginTop: 8 }}>
          <Muted>
            Suggestions: If you're over target, try 1-2 days of walking/cycling, public transport, or carpooling.
          </Muted>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: { color: colors.text, fontWeight: '900' },
  kg: { color: colors.muted, fontWeight: '900' },
  barBg: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 6,
  },
  barFill: { height: '100%', backgroundColor: colors.brand2 },
});
