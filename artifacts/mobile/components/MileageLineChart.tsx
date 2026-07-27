import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface ChartPoint {
  label: string;
  value: number;
}

interface MileageLineChartProps {
  data: ChartPoint[];
  height?: number;
}

export function MileageLineChart({ data, height = 160 }: MileageLineChartProps) {
  const colors = useColors();

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Add more fuel entries to see the trend chart
        </Text>
      </View>
    );
  }

  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 28;

  // We need width - but we'll use a fixed width based on number of points
  const chartWidth = Math.max(data.length * 48, 260);
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) * 0.85;
  const maxVal = Math.max(...values) * 1.1;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: paddingLeft + (i / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight),
    y: paddingTop + chartHeight - ((d.value - minVal) / range) * chartHeight,
    value: d.value,
    label: d.label,
  }));

  // SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Fill path (closed to bottom)
  const fillD =
    pathD +
    ` L ${points[points.length - 1].x} ${paddingTop + chartHeight}` +
    ` L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const svgHeight = height;
  const svgWidth = chartWidth;

  return (
    <View style={{ height }}>
      <Svg width={svgWidth} height={svgHeight}>
        <Defs>
          <SvgGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.neonPurple} />
            <Stop offset="100%" stopColor={colors.neonPink} />
          </SvgGradient>
          <SvgGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.neonPurple} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.neonPurple} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Y-axis grid lines */}
        {[0, 0.5, 1].map((t) => {
          const y = paddingTop + chartHeight * (1 - t);
          const val = (minVal + range * t).toFixed(1);
          return (
            <React.Fragment key={t}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                fontSize={9}
                fill={colors.mutedForeground}
                textAnchor="end"
                fontFamily="Inter_400Regular"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Fill area */}
        <Path d={fillD} fill="url(#fillGrad)" />

        {/* Line */}
        <Path d={pathD} stroke="url(#lineGrad)" strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={5} fill={colors.background} stroke={colors.neonPink} strokeWidth={2} />
            <SvgText
              x={p.x}
              y={svgHeight - 4}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="middle"
              fontFamily="Inter_400Regular"
            >
              {p.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
