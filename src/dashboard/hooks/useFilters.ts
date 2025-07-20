
// ==============================================
// FIXED: 4. src/dashboard/pages/hooks/useFilters.ts
// ==============================================

import { useState, useMemo } from 'react';
import { PatientSubmission, FilterState } from '../types';
import { determineAgeGroup } from '../utils/helpers';

const TIME_SLOT_MAPPING: Record<string, string> = {
    '8': '8-9',
    '9': '9-10',
    '10': '10-11',
    '11': '11-12',
    '12': '12-13',
    '13': '13-14',
    '14': '14-15',
    '15': '15-16',
    '16': '16-17',
    '17': '17-18',
    '18': '18-19'
};

const DAY_FIELD_MAPPING: Record<string, string> = {
    'monday': 'montag',
    'tuesday': 'dienstag',
    'wednesday': 'mittwoch',
    'thursday': 'donnerstag',
    'friday': 'freitag'
};

export const useFilters = (allSubmissions: PatientSubmission[]) => {
    const [filters, setFilters] = useState<FilterState>({
        selectedDay: null,
        selectedTimeSlots: [],
        selectedHomeVisit: [],
        selectedAgeGroups: [],
        selectedTreatment: [],
        searchTerm: '',
        showDuplicatesOnly: false,
    });

    const filteredSubmissions = useMemo(() => {
        let filtered = allSubmissions;

        // Search filter
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(item => {
                const fieldsToSearch = [
                    item.submissions.name_1,
                    item.submissions.vorname,
                ];
                return fieldsToSearch.some(field => field?.toLowerCase().includes(searchTerm));
            });
        }

        // Day filter
        if (filters.selectedDay) {
            filtered = filtered.filter(item => {
                // If patient is flexible, they're available all days
                if ((item.submissions as any).form_field_ab01) {
                    return true;
                }

                const germanDay = DAY_FIELD_MAPPING[filters.selectedDay!.toLowerCase()];
                return item.submissions[germanDay as keyof typeof item.submissions] &&
                    (item.submissions[germanDay as keyof typeof item.submissions] as string[])?.length > 0;
            });
        }

        // Time slots filter
        if (filters.selectedTimeSlots.length > 0) {
            filtered = filtered.filter(item => {
                // If patient is flexible, they're available for all time slots
                if ((item.submissions as any).form_field_ab01) {
                    return true;
                }

                if (!filters.selectedDay) {
                    return Object.values(DAY_FIELD_MAPPING).some(germanDay => {
                        const dayAvailability = item.submissions[germanDay as keyof typeof item.submissions] as string[] || [];
                        return filters.selectedTimeSlots.every(slot => {
                            const timeRange = TIME_SLOT_MAPPING[slot];
                            return dayAvailability.includes(timeRange);
                        });
                    });
                } else {
                    const germanDay = DAY_FIELD_MAPPING[filters.selectedDay!.toLowerCase()];
                    const dayAvailability = item.submissions[germanDay as keyof typeof item.submissions] as string[] || [];
                    return filters.selectedTimeSlots.every(slot => {
                        const timeRange = TIME_SLOT_MAPPING[slot];
                        return dayAvailability.includes(timeRange);
                    });
                }
            });
        }

        // Home visit filter
        if (filters.selectedHomeVisit.length > 0) {
            filtered = filtered.filter(item => {
                const homeVisitAnswer = item.submissions.wurde_ein_hausbesuch_verordnet;
                if (!homeVisitAnswer) return false;

                return filters.selectedHomeVisit.some(selected =>
                    homeVisitAnswer.toLowerCase() === selected.toLowerCase()
                );
            });
        }

        // Treatment filter
        if (filters.selectedTreatment.length > 0) {
            filtered = filtered.filter(item => {
                const treatmentAnswer = item.submissions.waren_sie_schon_einmal_bei_uns_in_behandlung;
                if (!treatmentAnswer) return false;

                return filters.selectedTreatment.some(selected =>
                    treatmentAnswer.toLowerCase() === selected.toLowerCase()
                );
            });
        }

        // Age groups filter
        if (filters.selectedAgeGroups.length > 0) {
            filtered = filtered.filter(item => {
                const birthDate = item.submissions.geburtsdatum;
                const ageGroup = determineAgeGroup(birthDate);
                return ageGroup && filters.selectedAgeGroups.includes(ageGroup);
            });
        }

        // Duplicate names filter
        if (filters.showDuplicatesOnly) {
            // Create a map to count name occurrences
            const nameCounts = new Map<string, number>();

            // First pass: count occurrences of each full name
            allSubmissions.forEach(item => {
                const firstName = item.submissions?.vorname || '';
                const lastName = item.submissions?.name_1 || '';
                const fullName = `${firstName} ${lastName}`.toLowerCase().trim();

                if (fullName.trim()) {  // Only count if we have at least one name part
                    nameCounts.set(fullName, (nameCounts.get(fullName) || 0) + 1);
                }
            });

            // Filter to only include submissions with duplicate names
            filtered = filtered.filter(item => {
                const firstName = item.submissions?.vorname || '';
                const lastName = item.submissions?.name_1 || '';
                const fullName = `${firstName} ${lastName}`.toLowerCase().trim();

                return fullName && (nameCounts.get(fullName) || 0) > 1;
            });
        }

        return filtered;
    }, [allSubmissions, filters]);

    const updateFilter = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            selectedDay: null,
            selectedTimeSlots: [],
            selectedHomeVisit: [],
            selectedAgeGroups: [],
            selectedTreatment: [],
            searchTerm: '',
            showDuplicatesOnly: false,
        });
    };

    return {
        filters,
        filteredSubmissions,
        updateFilter,
        clearFilters,
    };
};