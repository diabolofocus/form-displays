// ==============================================
// FIXED: src/dashboard/pages/components/FormSelector.tsx
// ==============================================

import React from 'react';
import { Dropdown, Box, Text, Badge, Tooltip } from '@wix/design-system';
import { FormInfo } from '../types';
import { formatToGermanDate } from '../utils/helpers';

interface FormSelectorProps {
    availableForms: FormInfo[];
    selectedFormId: string | null;
    onFormSelect: (formId: string) => void;
    loading?: boolean;
}

export const FormSelector: React.FC<FormSelectorProps> = ({
    availableForms,
    selectedFormId,
    onFormSelect,
    loading = false
}) => {
    if (loading) {
        return (
            <Box direction="horizontal" gap="SP2" align="center">
                <Text size="medium" weight="bold">Loading forms...</Text>
            </Box>
        );
    }

    if (availableForms.length === 0) {
        return (
            <Box direction="horizontal" gap="SP2" align="center">
                <Text size="medium" weight="bold">No forms found</Text>
            </Box>
        );
    }

    const selectedForm = availableForms.find(form => form.formId === selectedFormId);

    const dropdownOptions = availableForms.map(form => ({
        id: form.formId,
        value: form.name,
        disabled: form.submissionCount === 0
    }));

    return (
        <Box direction="horizontal" gap="SP3">
            <Box direction="vertical" gap="SP1">
                <Dropdown
                    placeholder="Choose form..."
                    options={dropdownOptions}
                    selectedId={selectedFormId || undefined}
                    onSelect={(option) => {
                        const formId = String(option.id);
                        console.log('FormSelector: Form selected:', formId);

                        // Store immediately for navigation persistence
                        if (typeof window !== 'undefined') {
                            window.wixCurrentFormId = formId;
                            console.log('FormSelector: Stored form ID immediately:', formId);
                        }

                        onFormSelect(formId);
                    }}
                    disabled={loading}
                    size="medium"
                />
            </Box>

            <Box direction="horizontal" gap="SP2">
                {selectedForm && (
                    <Box direction="horizontal" gap="SP2" style={{ alignItems: "top" }}>
                        <Badge skin="standard" size="small">
                            {selectedForm.submissionCount} submissions
                        </Badge>

                        <Badge skin="neutralLight" size="small">
                            {selectedForm.fields.length} fields
                        </Badge>

                        <Badge skin="success" size="small">
                            Active
                        </Badge>
                        {/* <Box direction="horizontal" gap="SP2" align="center">
                            <Badge skin="neutralLight" size="small">
                                {safeVisibleColumns.length} of {(() => {
                                    const systemFields = ['_createdDate'];
                                    return formFields.length + systemFields.length;
                                })()} columns shown
                            </Badge>
                            {activeFiltersCount > 0 && (
                                <Badge skin="standard" size="small">
                                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                                </Badge>
                            )}
                        </Box> */}

                    </Box>
                )}
            </Box>
        </Box>
    );
};