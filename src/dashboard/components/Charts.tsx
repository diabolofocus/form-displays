import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Types for props
export interface AgeGroups {
    kids: number;
    teenagers: number;
    adults: number;
}

export interface GenderGroups {
    men: number;
    women: number;
    divers: number;
}

// Colors for charts
const AGE_COLORS = ['#C8DEFD', '#5093FF', '#0D52BF'];
const GENDER_COLORS = ['#ccdefa', '#c7b2fa', '#ccc'];

// Type casting to fix TypeScript issues
const ResponsiveContainerTyped = ResponsiveContainer as any;
const PieChartTyped = PieChart as any;
const PieTyped = Pie as any;
const CellTyped = Cell as any;

// Age Distribution Pie Chart
export const AgeDistributionPieChart: React.FC<{ ageGroups: AgeGroups }> = ({ ageGroups }) => {
    const data = [
        { name: 'Kinder (0-12)', value: ageGroups.kids, color: AGE_COLORS[0] },
        { name: 'Jugendliche (13-17)', value: ageGroups.teenagers, color: AGE_COLORS[1] },
        { name: 'Erwachsene (18+)', value: ageGroups.adults, color: AGE_COLORS[2] },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            {/* Pie Chart */}
            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                <ResponsiveContainerTyped width="100%" height="100%">
                    <PieChartTyped>
                        <PieTyped
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={35}
                            innerRadius={0}
                        >
                            {data.map((entry, idx) => (
                                <CellTyped key={`age-cell-${idx}`} fill={AGE_COLORS[idx % AGE_COLORS.length]} />
                            ))}
                        </PieTyped>
                    </PieChartTyped>
                </ResponsiveContainerTyped>
            </div>

            {/* Custom Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {data.map((entry, idx) => (
                    <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: entry.color,
                                borderRadius: '50%',
                                flexShrink: 0
                            }}
                        />
                        <span style={{ fontSize: '13px', color: '#333' }}>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Gender Distribution Pie Chart
export const GenderDistributionPieChart: React.FC<{ genderGroups: GenderGroups }> = ({ genderGroups }) => {
    const data = [
        { name: 'Männlich', value: genderGroups.men, color: GENDER_COLORS[0] },
        { name: 'Weiblich', value: genderGroups.women, color: GENDER_COLORS[1] },
        { name: 'Divers', value: genderGroups.divers, color: GENDER_COLORS[2] },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            {/* Pie Chart */}
            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                <ResponsiveContainerTyped width="100%" height="100%">
                    <PieChartTyped>
                        <PieTyped
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={35}
                            innerRadius={0}
                        >
                            {data.map((entry, idx) => (
                                <CellTyped key={`gender-cell-${idx}`} fill={GENDER_COLORS[idx % GENDER_COLORS.length]} />
                            ))}
                        </PieTyped>
                    </PieChartTyped>
                </ResponsiveContainerTyped>
            </div>

            {/* Custom Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {data.map((entry, idx) => (
                    <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: entry.color,
                                borderRadius: '50%',
                                flexShrink: 0
                            }}
                        />
                        <span style={{ fontSize: '13px', color: '#333' }}>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};