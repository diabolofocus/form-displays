// // ==============================================
// // NEW: src/dashboard/components/CustomCharts.tsx
// // ==============================================

// import React, { useMemo } from 'react';
// import { Box, Text } from '@wix/design-system';
// import { GenericSubmission, FormField, FieldType } from '../types';
// import { ChartType } from '../pages/stores/AnalyticsSettingsStore';

// // Vibrant color palette
// const CHART_COLORS = [
//     '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
//     '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
//     '#0EA5E9', '#22C55E', '#FACC15', '#F87171', '#A78BFA'
// ];

// interface ChartData {
//     name: string;
//     value: number;
//     color?: string;
// }

// // Custom Pie Chart using CSS
// export const CustomPieChart: React.FC<{
//     data: ChartData[];
//     size?: number;
//     showLegend?: boolean;
// }> = ({ data, size = 120, showLegend = true }) => {
//     const total = data.reduce((sum, item) => sum + item.value, 0);

//     if (total === 0 || data.length === 0) {
//         return (
//             <Box align="center" verticalAlign="middle" height="100%">
//                 <Text size="medium" color="secondary">No data</Text>
//             </Box>
//         );
//     }

//     // Calculate percentages and create segments
//     let cumulativePercentage = 0;
//     const segments = data.map((item, index) => {
//         const percentage = (item.value / total) * 100;
//         const startAngle = (cumulativePercentage / 100) * 360;
//         const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
//         cumulativePercentage += percentage;

//         return {
//             ...item,
//             percentage,
//             startAngle,
//             endAngle,
//             color: CHART_COLORS[index % CHART_COLORS.length]
//         };
//     });

//     return (
//         <Box direction={showLegend ? "horizontal" : "vertical"} align="left" gap="16px" width="100%">
//             {/* Pie Chart */}
//             <Box style={{
//                 width: size,
//                 height: size,
//                 position: 'relative',
//                 flexShrink: 0
//             }}>
//                 <svg
//                     width={size}
//                     height={size}
//                     viewBox={`0 0 ${size} ${size}`}
//                     style={{ transform: 'rotate(-90deg)' }}
//                 >
//                     {segments.map((segment, index) => {
//                         const radius = size * 0.4;
//                         const centerX = size / 2;
//                         const centerY = size / 2;

//                         const startAngleRad = (segment.startAngle * Math.PI) / 180;
//                         const endAngleRad = (segment.endAngle * Math.PI) / 180;

//                         const x1 = centerX + radius * Math.cos(startAngleRad);
//                         const y1 = centerY + radius * Math.sin(startAngleRad);
//                         const x2 = centerX + radius * Math.cos(endAngleRad);
//                         const y2 = centerY + radius * Math.sin(endAngleRad);

//                         const largeArcFlag = segment.percentage > 50 ? 1 : 0;

//                         const pathData = [
//                             `M ${centerX} ${centerY}`,
//                             `L ${x1} ${y1}`,
//                             `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
//                             'Z'
//                         ].join(' ');

//                         return (
//                             <path
//                                 key={index}
//                                 d={pathData}
//                                 fill={segment.color}
//                                 stroke="white"
//                                 strokeWidth="2"
//                                 style={{
//                                     filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
//                                     transition: 'opacity 0.3s ease'
//                                 }}
//                             />
//                         );
//                     })}
//                 </svg>
//             </Box>

//             {/* Legend */}
//             {showLegend && (
//                 <Box direction="vertical" gap="8px" flex="1" verticalAlign="top">
//                     {segments.slice(0, 6).map((segment, index) => (
//                         <Box key={index} direction="horizontal" align="center" gap="8px" width="100%">
//                             <Box
//                                 style={{
//                                     width: '14px',
//                                     height: '14px',
//                                     backgroundColor: segment.color,
//                                     borderRadius: '50%',
//                                     flexShrink: 0,
//                                     boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
//                                 }}
//                             />
//                             <Text size="small" weight="normal" style={{ flex: 1 }}>
//                                 {segment.name.length > 15 ? segment.name.substring(0, 13) + '...' : segment.name}
//                             </Text>
//                             <Text size="small" weight="bold" style={{
//                                 color: segment.color,
//                                 minWidth: '25px'
//                             }}>
//                                 {segment.value}
//                             </Text>
//                         </Box>
//                     ))}
//                     {segments.length > 6 && (
//                         <Text size="small" color="secondary" weight="normal">
//                             +{segments.length - 6} more items
//                         </Text>
//                     )}
//                 </Box>
//             )}
//         </Box>
//     );
// };

// // Custom Bar Chart using CSS
// export const CustomBarChart: React.FC<{
//     data: ChartData[];
//     height?: number;
//     horizontal?: boolean;
// }> = ({ data, height = 200, horizontal = false }) => {
//     if (data.length === 0) {
//         return (
//             <Box align="center" verticalAlign="middle" height="100%">
//                 <Text size="medium" color="secondary">No data</Text>
//             </Box>
//         );
//     }

//     const maxValue = Math.max(...data.map(d => d.value));
//     const chartData = data.slice(0, 8); // Limit to 8 items

//     if (horizontal) {
//         return (
//             <Box direction="vertical" gap="12px" height="100%" style={{ alignItems: 'start' }} paddingTop="12px">
//                 {chartData.map((item, idx) => {
//                     const percentage = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 3) : 3;
//                     const color = CHART_COLORS[idx % CHART_COLORS.length];

//                     return (
//                         <Box key={idx} direction="horizontal" align="center" gap="12px" width="100%">
//                             <Text size="small" weight="normal" style={{
//                                 minWidth: '80px',
//                                 fontSize: '13px',
//                                 color: '#333'
//                             }}>
//                                 {item.name.substring(0, 12)}
//                             </Text>
//                             <Box
//                                 style={{
//                                     height: '18px',
//                                     backgroundColor: '#f5f6fa',
//                                     borderRadius: '9px',
//                                     flex: 1,
//                                     position: 'relative',
//                                     minWidth: '80px'
//                                 }}
//                             >
//                                 <Box
//                                     style={{
//                                         height: '18px',
//                                         width: `${percentage}%`,
//                                         background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
//                                         borderRadius: '9px',
//                                         transition: 'width 0.8s ease',
//                                         boxShadow: `0 3px 6px ${color}40`
//                                     }}
//                                 />
//                             </Box>
//                             <Text size="small" weight="bold" style={{
//                                 minWidth: '35px',
//                                 fontSize: '13px',
//                                 color: color,
//                                 fontWeight: '600'
//                             }}>
//                                 {item.value}
//                             </Text>
//                         </Box>
//                     );
//                 })}
//             </Box>
//         );
//     }

//     // Vertical bar chart
//     return (
//         <Box direction="vertical" height={`${height}px`} width="100%">
//             <Box direction="horizontal" align="right" gap="4px" height="80%" paddingBottom="8px">
//                 {chartData.map((item, idx) => {
//                     const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
//                     const color = CHART_COLORS[idx % CHART_COLORS.length];

//                     return (
//                         <Box key={idx} direction="vertical" align="center" flex="1" height="100%">
//                             <Box
//                                 style={{
//                                     width: '100%',
//                                     maxWidth: '40px',
//                                     height: `${percentage}%`,
//                                     background: `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)`,
//                                     borderRadius: '6px 6px 0 0',
//                                     transition: 'height 0.8s ease',
//                                     boxShadow: `0 -2px 8px ${color}30`,
//                                     alignSelf: 'end'
//                                 }}
//                             />
//                             <Text size="tiny" align="center" paddingTop="4px" style={{
//                                 color: color,
//                                 fontWeight: 'bold'
//                             }}>
//                                 {item.value}
//                             </Text>
//                         </Box>
//                     );
//                 })}
//             </Box>
//             <Box direction="horizontal" align="center" gap="4px" height="20%">
//                 {chartData.map((item, idx) => (
//                     <Text key={idx} size="tiny" align="center" flex="1" style={{
//                         fontSize: '10px',
//                         color: '#666',
//                         lineHeight: '1.2'
//                     }}>
//                         {item.name.substring(0, 8)}
//                     </Text>
//                 ))}
//             </Box>
//         </Box>
//     );
// };

// // Custom Line Chart using SVG
// export const CustomLineChart: React.FC<{
//     data: ChartData[];
//     height?: number;
//     color?: string;
// }> = ({ data, height = 120, color = '#3B82F6' }) => {
//     if (data.length === 0) {
//         return (
//             <Box align="center" verticalAlign="middle" height="100%">
//                 <Text size="medium" color="secondary">No data</Text>
//             </Box>
//         );
//     }

//     const maxValue = Math.max(...data.map(d => d.value));
//     const minValue = Math.min(...data.map(d => d.value));
//     const range = maxValue - minValue || 1;
//     const width = 300;
//     const padding = 20;

//     const points = data.map((item, index) => {
//         const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
//         const y = height - padding - ((item.value - minValue) / range) * (height - 2 * padding);
//         return { x, y, value: item.value };
//     });

//     const pathData = points.map((point, index) =>
//         `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
//     ).join(' ');

//     return (
//         <Box direction="vertical" height={`${height + 40}px`} width="100%">
//             <svg width={width} height={height} style={{ overflow: 'visible' }}>
//                 {/* Grid lines */}
//                 <defs>
//                     <linearGradient id={`lineGradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
//                         <stop offset="0%" stopColor={color} stopOpacity="0.8" />
//                         <stop offset="100%" stopColor={color} stopOpacity="0.4" />
//                     </linearGradient>
//                 </defs>

//                 {/* Area under curve */}
//                 <path
//                     d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
//                     fill={`url(#lineGradient-${color})`}
//                     opacity="0.2"
//                 />

//                 {/* Main line */}
//                 <path
//                     d={pathData}
//                     stroke={color}
//                     strokeWidth="3"
//                     fill="none"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     style={{
//                         filter: `drop-shadow(0 2px 4px ${color}40)`
//                     }}
//                 />

//                 {/* Data points */}
//                 {points.map((point, index) => (
//                     <circle
//                         key={index}
//                         cx={point.x}
//                         cy={point.y}
//                         r="4"
//                         fill="white"
//                         stroke={color}
//                         strokeWidth="2"
//                         style={{
//                             filter: `drop-shadow(0 2px 4px ${color}60)`
//                         }}
//                     />
//                 ))}
//             </svg>

//             {/* Stats below */}
//             <Box direction="horizontal" gap="16px" align="center" paddingTop="8px">
//                 <Box direction="vertical" align="center">
//                     <Text size="tiny" color="secondary">Total</Text>
//                     <Text size="small" weight="bold" style={{ color }}>
//                         {data.reduce((sum, item) => sum + item.value, 0)}
//                     </Text>
//                 </Box>
//                 <Box direction="vertical" align="center">
//                     <Text size="tiny" color="secondary">Peak</Text>
//                     <Text size="small" weight="bold" style={{ color: '#10B981' }}>
//                         {maxValue}
//                     </Text>
//                 </Box>
//                 <Box direction="vertical" align="center">
//                     <Text size="tiny" color="secondary">Points</Text>
//                     <Text size="small" weight="bold">
//                         {data.length}
//                     </Text>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };

// // Stats Card
// export const CustomStatsCard: React.FC<{
//     value: string | number;
//     label: string;
//     icon?: string;
//     color?: string;
//     subtitle?: string;
// }> = ({ value, label, icon, color = '#3B82F6', subtitle }) => {
//     return (
//         <Box direction="vertical" align="center" verticalAlign="middle" height="100%" gap="12px">
//             {icon && (
//                 <Text size="medium" style={{ fontSize: '24px' }}>{icon}</Text>
//             )}
//             <Text size="medium" weight="bold" style={{
//                 fontSize: '36px',
//                 color: color,
//                 lineHeight: '1'
//             }}>
//                 {value}
//             </Text>
//             <Text size="medium" weight="normal" color="secondary" align="center">
//                 {label}
//             </Text>
//             {subtitle && (
//                 <Text size="small" color="secondary" align="center">
//                     {subtitle}
//                 </Text>
//             )}
//         </Box>
//     );
// };