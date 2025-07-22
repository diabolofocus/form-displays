// ==============================================
// NEW: src/dashboard/components/FilterSidePanel.tsx
// ==============================================

import React, { useState, useEffect } from 'react';
import {
    SidePanel,
    Button,
    Box,
    Text,
    Badge
} from '@wix/design-system';
import { GenericFilterPanel, FilterValue } from './GenericFilterPanel';
import { FormField as FormFieldType, GenericSubmission } from '../types';
import { useFilterSettings } from '../hooks/useFilterSettings';

export interface FilterSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    formId: string | null;
    formFields: FormFieldType[];
    submissions: GenericSubmission[];
    onFiltersApply: (filters: FilterValue[]) => void;
    currentFilters: FilterValue[];
}

export const FilterSidePanel: React.FC<FilterSidePanelProps> = ({
    isOpen,
    onClose,
    formId,
    formFields,
    submissions,
    onFiltersApply,
    currentFilters
}) => {
    const [tempFilters, setTempFilters] = useState<FilterValue[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    const { visibleFilters } = useFilterSettings(formId, formFields);

    // Initialize temp filters when panel opens or current filters change
    useEffect(() => {
        if (isOpen) {
            setTempFilters([...currentFilters]);
            setHasChanges(false);
        }
    }, [isOpen, currentFilters]);

    // Check for changes
    useEffect(() => {
        const filtersChanged = JSON.stringify(tempFilters) !== JSON.stringify(currentFilters);
        setHasChanges(filtersChanged);
    }, [tempFilters, currentFilters]);

    const handleFiltersChange = (filters: FilterValue[]) => {
        setTempFilters(filters);
    };

    const handleClearAll = () => {
        setTempFilters([]);
    };

    const handleApply = () => {
        onFiltersApply(tempFilters);
        onClose();
    };

    const handleCancel = () => {
        setTempFilters([...currentFilters]);
        onClose();
    };

    const getActiveFilterCount = () => {
        return tempFilters.length;
    };

    const getAppliedFilterCount = () => {
        return currentFilters.length;
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: '420px',
                zIndex: 1000,
                boxShadow: '0 3px 24px 0 rgba(22, 45, 61, 0.18), 0 8px 8px 0 rgba(22, 45, 61, 0.12)',
                backgroundColor: 'white'
            }}
        >
            <SidePanel onCloseButtonClick={handleCancel}>
                <SidePanel.Header
                    title="Filters"
                    subtitle={
                        getAppliedFilterCount() > 0
                            ? `${getAppliedFilterCount()} filter${getAppliedFilterCount() !== 1 ? 's' : ''} applied`
                            : 'No filters applied'
                    }
                />

                <SidePanel.Content>
                    <GenericFilterPanel
                        availableFilters={visibleFilters}
                        activeFilters={tempFilters}
                        onFiltersChange={handleFiltersChange}
                        onClearAll={handleClearAll}
                        submissions={submissions}
                    />
                </SidePanel.Content>

                <SidePanel.Footer>
                    <Box direction="horizontal" gap="SP2" style={{ width: '100%' }}>
                        <Button
                            priority="secondary"
                            onClick={handleCancel}
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            priority="primary"
                            onClick={handleApply}
                            disabled={!hasChanges}
                            fullWidth
                        >
                            {getActiveFilterCount() > 0
                                ? `Apply ${getActiveFilterCount()} Filter${getActiveFilterCount() !== 1 ? 's' : ''}`
                                : 'Clear Filters'
                            }
                        </Button>
                    </Box>
                </SidePanel.Footer>
            </SidePanel>
        </div>
    );
};