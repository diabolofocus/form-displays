// ==============================================
// NEW: src/dashboard/pages/components/FormSelector.tsx
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
        <Box direction="horizontal" gap="SP3" align="center">
            <Box direction="vertical" gap="SP1">
                <Text size="tiny" color="secondary">Select form</Text>
                <Dropdown
                    placeholder="Choose form..."
                    options={dropdownOptions}
                    selectedId={selectedFormId || undefined}
                    onSelect={(option) => onFormSelect(String(option.id))}
                    disabled={loading}
                    size="medium"
                />
            </Box>

            {selectedForm && (
                <Box direction="horizontal" gap="SP2" align="center">
                    <Badge skin="standard" size="small">
                        {selectedForm.submissionCount} submissions
                    </Badge>

                    <Badge skin="neutralLight" size="small">
                        {selectedForm.fields.length} fields
                    </Badge>

                    {selectedForm.lastSubmissionDate && (
                        <Tooltip
                            content={`Last submission: ${formatToGermanDate(selectedForm.lastSubmissionDate)}`}
                            placement="bottom"
                        >
                            <Badge skin="successLight" size="small">
                                Active
                            </Badge>
                        </Tooltip>
                    )}
                </Box>
            )}
        </Box>
    );
};