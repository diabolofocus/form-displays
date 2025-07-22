// ==============================================
// ENHANCED: src/dashboard/components/AnalyticsCards.tsx - With Recharts
// ==============================================

import React from 'react';
import { Card, Text, Box, Heading, Loader, Badge } from '@wix/design-system';
import { observer } from 'mobx-react-lite';
import { GenericSubmission, FormField, FieldType } from '../types';
import { AnalyticSetting, AnalyticType, ChartType } from '../pages/stores/AnalyticsSettingsStore';
import {
    FieldDistributionChart,
    SubmissionsOverTimeChart,
    TopValuesChart,
    FieldStatsCard,
    CompletionRateChart
} from './AnalyticsCharts';

interface AnalyticsCardsProps {
    submissions: GenericSubmission[];
    formFields: FormField[];
    visibleAnalytics: AnalyticSetting[];
    formName?: string;
    isLoading?: boolean;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = observer(({
    submissions,
    formFields,
    visibleAnalytics,
    formName,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <Card>
                <Card.Content>
                    <Box align="center" padding="SP4">
                        <Loader />
                        <Text>Loading analytics...</Text>
                    </Box>
                </Card.Content>
            </Card>
        );
    }

    if (visibleAnalytics.length === 0) {
        return (
            <Card>
                <Card.Header title="Analytics" subtitle={formName} />
                <Card.Content>
                    <Box align="center" padding="SP4">
                        <Text color="secondary">No analytics configured for this form.</Text>
                        <Text size="small" color="secondary">Configure analytics in Table Settings.</Text>
                    </Box>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card>
            <Card.Header
                title="Analytics"
                subtitle={`${formName || 'Form'} • ${submissions.length} submissions`}
                suffix={
                    <Badge size="small" skin="neutralLight">
                        {visibleAnalytics.length} metrics
                    </Badge>
                }
            />
            <Card.Content>
                <Box
                    direction="horizontal"
                    gap="SP4"
                    style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        paddingBottom: '12px',
                        scrollBehavior: 'smooth',
                        display: 'flex',
                        flexWrap: 'nowrap', // Prevent wrapping
                        width: '100%'
                    }}
                    className="scrollbar-container"
                >
                    {visibleAnalytics.map(analytic => (
                        <Box
                            key={analytic.id}
                            style={{
                                minWidth: getCardMinWidth(analytic.chartType),
                                maxWidth: getCardMinWidth(analytic.chartType),
                                flexShrink: 0,
                                flexGrow: 0
                            }}
                        >
                            {renderAnalytic(analytic, submissions, formFields)}
                        </Box>
                    ))}
                </Box>
            </Card.Content>

            {/* Custom scrollbar styles */}
            <style>{`
                .wix-design-system-cards .scrollbar-container::-webkit-scrollbar {
                    height: 8px;
                }
                
                .wix-design-system-cards .scrollbar-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                
                .wix-design-system-cards .scrollbar-container::-webkit-scrollbar-thumb {
                    background: #3B82F6;
                    border-radius: 4px;
                }
                
                .wix-design-system-cards .scrollbar-container::-webkit-scrollbar-thumb:hover {
                    background: #2563EB;
                }
                
                /* Hide scrollbar for Firefox */
                .wix-design-system-cards .scrollbar-container {
                    scrollbar-width: thin;
                    scrollbar-color: #3B82F6 #f1f1f1;
                }
            `}</style>
        </Card>
    );
});

function renderAnalytic(
    analytic: AnalyticSetting,
    submissions: GenericSubmission[],
    formFields: FormField[]
): React.ReactNode {
    const field = analytic.fieldName ? formFields.find(f => f.name === analytic.fieldName) : null;

    switch (analytic.type) {
        case AnalyticType.TOTAL_SUBMISSIONS:
            return (
                <Box style={{ height: '240px', width: '100%', backgroundColor: 'red' }}>
                    <Card>
                        <Card.Content>
                            <Box
                                direction="vertical"
                                align="center"
                                verticalAlign="middle"
                                height="100%"
                                gap="SP3"
                            >
                                <Text size="medium" weight="bold" style={{
                                    fontSize: '36px',
                                    color: '#3B82F6',
                                    lineHeight: '1'
                                }}>
                                    {submissions.length}
                                </Text>
                                <Text size="medium" weight="normal" color="secondary" align="center">
                                    Total Submissions
                                </Text>
                            </Box>
                        </Card.Content>
                    </Card>
                </Box >
            );

        case AnalyticType.SUBMISSIONS_OVER_TIME:
            return (
                <Box style={{ height: '200px', width: '100%' }}>
                    <Card>
                        <Card.Header title={analytic.label} />
                        <Card.Content>
                            <SubmissionsOverTimeChart
                                submissions={submissions}
                                granularity={analytic.options?.timeGranularity || 'day'}
                                compact={false}
                            />
                        </Card.Content>
                    </Card>
                </Box>
            );

        case AnalyticType.FIELD_DISTRIBUTION:
            if (!field) return null;
            return (
                <Box style={{ height: '200px', width: '100%' }}>
                    <Card>
                        <Card.Header title={analytic.label} />
                        <Card.Content>
                            <FieldDistributionChart
                                submissions={submissions}
                                field={field}
                                chartType={analytic.chartType || ChartType.PIE}
                                showPercentages={analytic.options?.showPercentages}
                                compact={false}
                            />
                        </Card.Content>
                    </Card>
                </Box>
            );

        case AnalyticType.TOP_VALUES:
            if (!field) return null;
            return (
                <Box style={{ height: '200px', width: '100%' }}>
                    <Card>
                        <Card.Header title={analytic.label} />
                        <Card.Content>
                            <TopValuesChart
                                submissions={submissions}
                                field={field}
                                topCount={analytic.options?.topCount || 5}
                                chartType={analytic.chartType || ChartType.PIE}
                                compact={false}
                            />
                        </Card.Content>
                    </Card>
                </Box>
            );

        case AnalyticType.FIELD_STATS:
            if (!field) return null;
            return (
                <Box style={{ height: '200px', width: '100%' }}>
                    <Card>
                        <Card.Header title={analytic.label} />
                        <Card.Content>
                            <FieldStatsCard
                                submissions={submissions}
                                field={field}
                                title={analytic.label}
                            />
                        </Card.Content>
                    </Card>
                </Box>
            );

        case AnalyticType.COMPLETION_RATE:
            return (
                <Box style={{ height: '200px', width: '100%' }}>
                    <Card>
                        <Card.Header title={analytic.label} />
                        <Card.Content>
                            <CompletionRateChart
                                submissions={submissions}
                                formFields={formFields}
                                compact={false}
                            />
                        </Card.Content>
                    </Card>
                </Box>
            );

        default:
            return (
                <Box style={{ height: '200px', width: '100%' }}>
                    <Card >
                        <Card.Content>
                            <Box align="center" verticalAlign="middle" height="100%">
                                <Text color="secondary">Unknown analytic type: {analytic.type}</Text>
                            </Box>
                        </Card.Content>
                    </Card>
                </Box>
            );
    }
}

function getCardMinWidth(chartType?: ChartType): string {
    switch (chartType) {
        case ChartType.STAT_CARD:
            return '280px';
        case ChartType.PIE:
            return '320px';
        case ChartType.BAR:
            return '350px';
        case ChartType.LINE:
            return '450px';
        default:
            return '320px';
    }
}

export default AnalyticsCards;