// ==============================================
// ENHANCED: src/dashboard/components/AnalyticsCharts.tsx - Using Recharts
// ==============================================

import React, { useMemo } from 'react';
import { Card, Text, Box, Heading, Badge } from '@wix/design-system';
import { GenericSubmission, FormField, FieldType } from '../types';
import { ChartType } from '../pages/stores/AnalyticsSettingsStore';
import { formatToGermanDate } from '../utils/helpers';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';

// Vibrant color palette for charts
const CHART_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#0EA5E9', '#22C55E', '#FACC15', '#F87171', '#A78BFA'
];

// Field Distribution Chart
export const FieldDistributionChart: React.FC<{
    submissions: GenericSubmission[];
    field: FormField;
    chartType: ChartType;
    showPercentages?: boolean;
    compact?: boolean;
}> = ({ submissions, field, chartType, showPercentages = false, compact = false }) => {
    const data = useMemo(() => {
        const counts = new Map<string, number>();

        submissions.forEach(submission => {
            const value = submission.submissions[field.name];
            let key: string;

            if (value == null || value === '') {
                key = '(Empty)';
            } else if (field.type === FieldType.BOOLEAN) {
                key = value ? 'Yes' : 'No';
            } else if (field.type === FieldType.DATE) {
                const date = new Date(value as string);
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = String(value);
            }

            counts.set(key, (counts.get(key) || 0) + 1);
        });

        const total = submissions.length;
        return Array.from(counts.entries())
            .map(([name, value]) => ({
                name: name.length > 15 ? name.substring(0, 12) + '...' : name,
                value,
                percentage: showPercentages ? Math.round((value / total) * 100) : undefined
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [submissions, field, showPercentages]);

    if (data.length === 0) {
        return (
            <Box align="center" verticalAlign="middle" height="180px">
                <Text color="secondary">No data available</Text>
            </Box>
        );
    }

    if (chartType === ChartType.PIE) {
        return (
            <Box height="180px" width="100%">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => showPercentages ? `${name} (${percentage}%)` : name}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [value, 'Count']}
                            contentStyle={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '6px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        );
    }

    // Bar Chart
    return (
        <Box height="180px" width="100%">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <Tooltip
                        formatter={(value: number) => [value, 'Count']}
                        contentStyle={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '6px'
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

// Submissions Over Time Chart
export const SubmissionsOverTimeChart: React.FC<{
    submissions: GenericSubmission[];
    granularity: 'day' | 'week' | 'month';
    compact?: boolean;
}> = ({ submissions, granularity = 'day', compact = false }) => {
    const data = useMemo(() => {
        const counts = new Map<string, number>();

        submissions.forEach(submission => {
            const date = new Date(submission._createdDate);
            let key: string;

            switch (granularity) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
            }

            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([date, count]) => ({
                name: formatDateForDisplay(date, granularity),
                value: count,
                date
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [submissions, granularity]);

    if (data.length === 0) {
        return (
            <Box align="center" verticalAlign="middle" height="180px">
                <Text color="secondary">No submissions yet</Text>
            </Box>
        );
    }

    return (
        <Box height="180px" width="100%">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <Tooltip
                        formatter={(value: number) => [value, 'Submissions']}
                        contentStyle={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '6px'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="url(#colorGradient)"
                        strokeWidth={3}
                    />
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};

// Top Values Chart
export const TopValuesChart: React.FC<{
    submissions: GenericSubmission[];
    field: FormField;
    topCount: number;
    chartType: ChartType;
    compact?: boolean;
}> = ({ submissions, field, topCount, chartType, compact = false }) => {
    const data = useMemo(() => {
        const counts = new Map<string, number>();

        submissions.forEach(submission => {
            const value = submission.submissions[field.name];
            if (value != null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        const key = String(item);
                        counts.set(key, (counts.get(key) || 0) + 1);
                    });
                } else {
                    const key = String(value);
                    counts.set(key, (counts.get(key) || 0) + 1);
                }
            }
        });

        return Array.from(counts.entries())
            .map(([name, value]) => ({
                name: name.length > 12 ? name.substring(0, 9) + '...' : name,
                value
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, topCount);
    }, [submissions, field, topCount]);

    if (data.length === 0) {
        return (
            <Box align="center" verticalAlign="middle" height="180px">
                <Text color="secondary">No data available</Text>
            </Box>
        );
    }

    if (chartType === ChartType.PIE) {
        return (
            <Box height="180px" width="100%">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [value, 'Count']}
                            contentStyle={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '6px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        );
    }

    return (
        <Box height="180px" width="100%">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <Tooltip
                        formatter={(value: number) => [value, 'Count']}
                        contentStyle={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '6px'
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

// Field Stats Card - Enhanced
export const FieldStatsCard: React.FC<{
    submissions: GenericSubmission[];
    field: FormField;
    title: string;
}> = ({ submissions, field, title }) => {
    const stats = useMemo(() => {
        const values = submissions
            .map(s => s.submissions[field.name])
            .filter(v => v != null && v !== '')
            .map(v => Number(v))
            .filter(v => !isNaN(v));

        if (values.length === 0) {
            return null;
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
            average: avg.toFixed(2),
            min: min.toString(),
            max: max.toString(),
            count: values.length.toString()
        };
    }, [submissions, field]);

    if (!stats) {
        return (
            <Box align="center" verticalAlign="middle" height="180px">
                <Text color="secondary">No numeric data available</Text>
            </Box>
        );
    }

    return (
        <Box direction="vertical" gap="SP4" height="180px" padding="SP3" verticalAlign="middle">
            {/* Main stat - Average */}
            <Box direction="vertical" align="center" gap="SP1">
                <Text size="small" color="secondary">Average</Text>
                <Heading size="large" color="primary" style={{ fontSize: '36px', color: '#3B82F6' }}>
                    {stats.average}
                </Heading>
            </Box>

            {/* Secondary stats in a grid */}
            <Box direction="horizontal" gap="SP3" align="center" style={{ justifyContent: 'space-around' }}>
                <Box direction="vertical" align="center">
                    <Text size="tiny" color="secondary">Min</Text>
                    <Text size="medium" weight="bold" style={{ color: '#10B981' }}>
                        {stats.min}
                    </Text>
                </Box>
                <Box direction="vertical" align="center">
                    <Text size="tiny" color="secondary">Max</Text>
                    <Text size="medium" weight="bold" style={{ color: '#F59E0B' }}>
                        {stats.max}
                    </Text>
                </Box>
                <Box direction="vertical" align="center">
                    <Text size="tiny" color="secondary">Count</Text>
                    <Text size="medium" weight="bold" style={{ color: '#8B5CF6' }}>
                        {stats.count}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

// Completion Rate Chart
export const CompletionRateChart: React.FC<{
    submissions: GenericSubmission[];
    formFields: FormField[];
    compact?: boolean;
}> = ({ submissions, formFields, compact = false }) => {
    const data = useMemo(() => {
        if (submissions.length === 0) return [];

        return formFields.map(field => {
            const completed = submissions.filter(submission => {
                const value = submission.submissions[field.name];
                return value != null && value !== '';
            }).length;

            const rate = Math.round((completed / submissions.length) * 100);

            return {
                name: field.label.length > 12 ? field.label.substring(0, 9) + '...' : field.label,
                value: rate,
                completed,
                total: submissions.length
            };
        }).sort((a, b) => b.value - a.value);
    }, [submissions, formFields]);

    if (data.length === 0) {
        return (
            <Box align="center" verticalAlign="middle" height="180px">
                <Text color="secondary">No data available</Text>
            </Box>
        );
    }

    return (
        <Box height="180px" width="100%">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                        domain={[0, 100]}
                    />
                    <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                            `${value}% (${props.payload.completed}/${props.payload.total})`,
                            'Completion Rate'
                        ]}
                        contentStyle={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '6px'
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#8B5CF6"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

// Helper function to format dates for display
function formatDateForDisplay(dateStr: string, granularity: string): string {
    const date = new Date(dateStr);

    switch (granularity) {
        case 'day':
            return date.toLocaleDateString('de-DE', {
                month: 'short',
                day: 'numeric'
            });
        case 'week':
            return `Week ${date.toLocaleDateString('de-DE', {
                month: 'short',
                day: 'numeric'
            })}`;
        case 'month':
            return date.toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'short'
            });
        default:
            return dateStr;
    }
}