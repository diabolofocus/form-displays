
// ==============================================
// FIXED: 8. src/dashboard/pages/components/StatisticsCards.tsx
// ==============================================

import React from 'react';
import { Card, Text, Box, Heading } from '@wix/design-system';
import { PatientSubmission, AgeGroups, GenderGroups, WaitingTime } from '../types';
import { AgeDistributionPieChart, GenderDistributionPieChart } from './Charts';


interface StatisticsCardsProps {
    totalPatients: number;
    waitingTime: WaitingTime;
    ageGroups: AgeGroups;
    genderGroups: GenderGroups;
    currentTime: string;
    currentDate: string;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
    totalPatients,
    waitingTime,
    ageGroups,
    genderGroups,
    currentTime,
    currentDate,
}) => {
    return (
        <Box width="100%" backgroundColor="white" borderRadius="8px" style={{
            overflowX: 'auto',
            minWidth: '1200px'
        }}>
            <Card>
                <Card.Content>
                    <Box direction="horizontal" gap="SP6" align="center" width="100%" minWidth="1200px">
                        {/* Patienten Insgesamt */}
                        <Box gap="SP2" direction="vertical" flexGrow={1} align="center">
                            <Text size="small" color="secondary">Patienten Insgesamt</Text>
                            <Box padding="SP1" backgroundColor="#eceff3" width="100%" height="70px" borderRadius="8px" direction="vertical" align="center" verticalAlign="middle">
                                <Text size="medium" weight="normal">{totalPatients} Patienten</Text>
                            </Box>

                        </Box>
                        {/* Wartelistendauer */}
                        <Box gap="SP2" direction="vertical" flexGrow={1} align="center">
                            <Text size="small" color="secondary">Wartelistendauer</Text>
                            <Box padding="SP1" backgroundColor="#eceff3" width="100%" height="70px" borderRadius="8px" direction="vertical" align="center" verticalAlign="middle">
                                <Text size="medium" weight="normal">{waitingTime.months} Monate {waitingTime.days} Tage</Text>
                            </Box>
                        </Box>
                        {/* Altersverteilung */}
                        <Box gap="SP2" direction="vertical" flexGrow={1} minWidth={100} align="center">
                            <Text size="small" color="secondary">Altersverteilung</Text>
                            <Box
                                backgroundColor="#eceff3"
                                width="100%"
                                height="70px"
                                borderRadius="8px"
                                padding="SP1"
                                direction="vertical"
                                align="center"
                                verticalAlign="middle"
                                style={{
                                    fontFamily: 'HelveticaNeueW01-45Ligh, HelveticaNeueW02-45Ligh, HelveticaNeueW10-45Ligh, Helvetica Neue, Helvetica, Arial, sans-serif',
                                    fontWeight: '400',
                                    fontSize: '10px !important',
                                    color: '#162D3D'
                                }}
                            >
                                <AgeDistributionPieChart ageGroups={ageGroups} />
                            </Box>
                        </Box>
                        {/* Geschlechterverteilung */}
                        <Box gap="SP2" direction="vertical" flexGrow={1} minWidth={100} align="center">
                            <Text size="small" color="secondary">Geschlechterverteilung</Text>
                            <Box backgroundColor="#eceff3" width="100%" padding="SP1" height="70px" borderRadius="8px" direction="vertical" align="center" verticalAlign="middle" style={{
                                fontFamily: 'HelveticaNeueW01-45Ligh, HelveticaNeueW02-45Ligh, HelveticaNeueW10-45Ligh, Helvetica Neue, Helvetica, Arial, sans-serif',
                                fontWeight: '400',
                                fontSize: '10px !important',
                                color: '#162D3D'
                            }}>
                                <GenderDistributionPieChart genderGroups={genderGroups} />
                            </Box>
                        </Box>
                        {/* Datum/Uhrzeit */}
                        <Box gap="SP2" direction="vertical" flexGrow={1} minWidth={100} align="center">
                            <Box marginTop="30px" padding="SP1" backgroundColor="#eceff3" width="100%" height="70px" borderRadius="8px" direction="vertical" align="center" verticalAlign="middle">
                                <Text size="tiny" weight="normal" color="secondary">{currentDate}</Text>
                                <Text size="medium" weight="normal">{currentTime}</Text>
                            </Box>
                        </Box>
                    </Box>
                </Card.Content>
            </Card>
        </Box>
    );
};