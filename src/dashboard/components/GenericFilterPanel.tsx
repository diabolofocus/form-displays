// ==============================================
// FIXED: src/dashboard/components/GenericFilterPanel.tsx
// ==============================================

import React, { useState, useEffect } from 'react';
import {
    Box,
    Text,
    Button,
    Input,
    Dropdown,
    MultiSelectCheckbox,
    DatePicker,
    Range,
    Checkbox,
    Slider,
    FormField,
    TextButton,
    Accordion,
    accordionItemBuilder,
    Badge,
    IconButton,
    MultiSelect
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { FormField as FormFieldType, FieldType, GenericSubmission } from '../types';

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'exists';

export interface FilterValue {
    fieldName: string;
    value: any;
    operator?: FilterOperator;
}


// Type guard function to check if a string is a valid FilterOperator
const isValidFilterOperator = (value: string): value is FilterOperator => {
    const validOperators: FilterOperator[] = [
        'equals', 'contains', 'startsWith', 'endsWith',
        'greaterThan', 'lessThan', 'between', 'in', 'exists'
    ];
    return validOperators.includes(value as FilterOperator);
};

export interface GenericFilterPanelProps {
    availableFilters: FormFieldType[];
    activeFilters: FilterValue[];
    onFiltersChange: (filters: FilterValue[]) => void;
    onClearAll: () => void;
    submissions: GenericSubmission[]; // For generating filter options
}

export const GenericFilterPanel: React.FC<GenericFilterPanelProps> = ({
    availableFilters,
    activeFilters,
    onFiltersChange,
    onClearAll,
    submissions
}) => {
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
    const [filterUIState, setFilterUIState] = useState<Map<string, { value: any, operator: FilterOperator }>>(new Map());

    // Generate unique values for each field to create filter options
    const getFieldOptions = (field: FormFieldType): Array<{ id: any, value: string }> => {
        const values = new Set<any>();

        submissions.forEach(submission => {
            const value = submission.submissions[field.name];
            if (value != null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(v => values.add(String(v)));
                } else {
                    values.add(String(value));
                }
            }
        });

        return Array.from(values)
            .slice(0, 100) // Limit to 100 options for performance
            .sort()
            .map(value => ({ id: value, value: value }));
    };

    const updateFilter = (fieldName: string, value: any, operator: FilterOperator = 'equals') => {
        const newFilters = activeFilters.filter(f => f.fieldName !== fieldName);

        if (value != null && value !== '' && value !== false &&
            (!Array.isArray(value) || value.length > 0)) {
            newFilters.push({ fieldName, value, operator: operator as FilterOperator });
        }

        onFiltersChange(newFilters);
    };

    const getFilterValue = (fieldName: string): any => {
        // First check UI state, then active filters
        const uiState = filterUIState.get(fieldName);
        if (uiState) return uiState.value;

        const filter = activeFilters.find(f => f.fieldName === fieldName);
        return filter?.value || '';
    };

    const getFilterOperator = (fieldName: string): FilterOperator => {
        // First check UI state, then active filters
        const uiState = filterUIState.get(fieldName);
        if (uiState) return uiState.operator;

        const filter = activeFilters.find(f => f.fieldName === fieldName);
        return filter?.operator || 'equals';
    };

    const removeFilter = (fieldName: string) => {
        const newFilters = activeFilters.filter(f => f.fieldName !== fieldName);
        onFiltersChange(newFilters);
    };

    const toggleFilterExpanded = (fieldName: string) => {
        const newExpanded = new Set(expandedFilters);
        if (newExpanded.has(fieldName)) {
            newExpanded.delete(fieldName);
        } else {
            newExpanded.add(fieldName);
        }
        setExpandedFilters(newExpanded);
    };

    const renderTextFilter = (field: FormFieldType) => {
        const currentFilter = activeFilters.find(f => f.fieldName === field.name);
        const value = currentFilter?.value || '';
        const operator = currentFilter?.operator || 'equals';

        return (
            <Box direction="vertical" gap="SP2">
                <FormField label="Search mode">
                    <Dropdown
                        size="small"
                        selectedId={operator}
                        onSelect={(option) => {
                            if (option && option.id) {
                                const operatorValue = String(option.id);
                                if (isValidFilterOperator(operatorValue)) {
                                    const newFilters = activeFilters.filter(f => f.fieldName !== field.name);
                                    newFilters.push({
                                        fieldName: field.name,
                                        value: value,
                                        operator: operatorValue
                                    });
                                    onFiltersChange(newFilters);
                                }
                            }
                        }}
                        options={[
                            { id: 'equals', value: 'Equals' },
                            { id: 'contains', value: 'Contains' },
                            { id: 'startsWith', value: 'Starts with' },
                            { id: 'endsWith', value: 'Ends with' }
                        ]}
                    />
                </FormField>
                <FormField label="Value">
                    <Input
                        size="small"
                        value={value}
                        placeholder={`Search ${field.label.toLowerCase()}...`}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            const newFilters = activeFilters.filter(f => f.fieldName !== field.name);

                            // Always add the filter to preserve the state, even with empty values
                            newFilters.push({
                                fieldName: field.name,
                                value: newValue,
                                operator: operator
                            });

                            onFiltersChange(newFilters);
                        }}
                        suffix={value && (
                            <IconButton
                                size="tiny"
                                onClick={() => removeFilter(field.name)}
                            >
                                <Icons.X />
                            </IconButton>
                        )}
                    />
                </FormField>
            </Box>
        );
    };

    const renderSelectFilter = (field: FormFieldType) => {
        const options = getFieldOptions(field);
        const selectedValues = getFilterValue(field.name) || [];

        if (options.length === 0) {
            return (
                <Text size="small" color="secondary">
                    No options available
                </Text>
            );
        }

        return (
            <FormField label="Select values">
                <MultiSelect
                    size="small"
                    placeholder="Choose values..."
                    options={options}
                    tags={selectedValues.map((val: any) => ({ id: val, label: String(val) }))}
                    onSelect={(option: any) => {
                        const optionValue = option?.id || option;
                        const newValues = [...selectedValues, optionValue];
                        updateFilter(field.name, newValues, 'in');
                    }}
                    onRemoveTag={(tagId: string) => {
                        const newValues = selectedValues.filter((v: any) => String(v) !== String(tagId));
                        updateFilter(field.name, newValues, 'in');
                    }}
                />
            </FormField>
        );
    };

    const renderDateFilter = (field: FormFieldType) => {
        const value = getFilterValue(field.name);
        const operator = getFilterOperator(field.name);

        if (operator === 'between') {
            return (
                <Box direction="vertical" gap="SP2">
                    <FormField label="Date range">
                        <Range>
                            <DatePicker
                                size="small"
                                placeholderText="From"
                                value={value?.from}
                                onChange={(date: Date) => {
                                    updateFilter(field.name, { ...value, from: date }, 'between');
                                }}
                            />
                            <DatePicker
                                size="small"
                                placeholderText="To"
                                value={value?.to}
                                onChange={(date: Date) => {
                                    updateFilter(field.name, { ...value, to: date }, 'between');
                                }}
                            />
                        </Range>
                    </FormField>
                    <TextButton
                        size="small"
                        onClick={() => updateFilter(field.name, null, 'equals')}
                    >
                        Switch to single date
                    </TextButton>
                </Box>
            );
        }

        return (
            <Box direction="vertical" gap="SP2">
                <FormField label="Filter by">
                    <Dropdown
                        size="small"
                        selectedId={operator}
                        onSelect={(option) => {
                            const operatorValue = String(option?.id);
                            if (operatorValue === 'between') {
                                updateFilter(field.name, { from: null, to: null }, 'between');
                            } else if (isValidFilterOperator(operatorValue)) {
                                updateFilter(field.name, value, operatorValue);
                            }
                        }}
                        options={[
                            { id: 'equals', value: 'On date' },
                            { id: 'greaterThan', value: 'After date' },
                            { id: 'lessThan', value: 'Before date' },
                            { id: 'between', value: 'Date range' }
                        ]}
                    />
                </FormField>
                <FormField label="Date">
                    <DatePicker
                        size="small"
                        value={value}
                        onChange={(date: Date) => updateFilter(field.name, date, operator)}
                        placeholderText="Select date..."
                    />
                </FormField>
            </Box>
        );
    };

    const renderNumberFilter = (field: FormFieldType) => {
        const value = getFilterValue(field.name);
        const operator = getFilterOperator(field.name);

        if (operator === 'between') {
            return (
                <Box direction="vertical" gap="SP2">
                    <FormField label="Number range">
                        <Range>
                            <Input
                                size="small"
                                type="number"
                                placeholder="Min"
                                value={value?.min || ''}
                                onChange={(e) => {
                                    const newValue = e.target.value ? parseFloat(e.target.value) : null;
                                    updateFilter(field.name, { ...value, min: newValue }, 'between');
                                }}
                            />
                            <Input
                                size="small"
                                type="number"
                                placeholder="Max"
                                value={value?.max || ''}
                                onChange={(e) => {
                                    const newValue = e.target.value ? parseFloat(e.target.value) : null;
                                    updateFilter(field.name, { ...value, max: newValue }, 'between');
                                }}
                            />
                        </Range>
                    </FormField>
                    <TextButton
                        size="small"
                        onClick={() => updateFilter(field.name, '', 'equals')}
                    >
                        Switch to single value
                    </TextButton>
                </Box>
            );
        }

        return (
            <Box direction="vertical" gap="SP2">
                <FormField label="Filter by">
                    <Dropdown
                        size="small"
                        selectedId={operator}
                        onSelect={(option) => {
                            const operatorValue = String(option?.id);
                            if (operatorValue === 'between') {
                                updateFilter(field.name, { min: null, max: null }, 'between');
                            } else if (isValidFilterOperator(operatorValue)) {
                                updateFilter(field.name, value, operatorValue);
                            }
                        }}
                        options={[
                            { id: 'equals', value: 'Equals' },
                            { id: 'greaterThan', value: 'Greater than' },
                            { id: 'lessThan', value: 'Less than' },
                            { id: 'between', value: 'Between' }
                        ]}
                    />
                </FormField>
                <FormField label="Value">
                    <Input
                        size="small"
                        type="number"
                        value={value || ''}
                        placeholder="Enter number..."
                        onChange={(e) => {
                            const newValue = e.target.value ? parseFloat(e.target.value) : null;
                            updateFilter(field.name, newValue, operator);
                        }}
                    />
                </FormField>
            </Box>
        );
    };

    const renderBooleanFilter = (field: FormFieldType) => {
        const value = getFilterValue(field.name);

        return (
            <FormField label="Value">
                <Dropdown
                    size="small"
                    selectedId={value}
                    onSelect={(option) => {
                        const boolValue = String(option.id) === 'true';
                        updateFilter(field.name, boolValue, 'equals');
                    }}
                    clearButton
                    onClear={() => removeFilter(field.name)}
                    placeholder="Select value..."
                    options={[
                        { id: 'true', value: 'Yes / True' },
                        { id: 'false', value: 'No / False' }
                    ]}
                />
            </FormField>
        );
    };

    const renderExistsFilter = (field: FormFieldType) => {
        const value = getFilterValue(field.name);

        return (
            <FormField label="Field status">
                <Dropdown
                    size="small"
                    selectedId={value}
                    onSelect={(option) => {
                        updateFilter(field.name, String(option.id) === 'exists', 'exists');
                    }}
                    clearButton
                    onClear={() => removeFilter(field.name)}
                    placeholder="Select status..."
                    options={[
                        { id: 'exists', value: 'Has value' },
                        { id: 'empty', value: 'Is empty' }
                    ]}
                />
            </FormField>
        );
    };

    const renderFilterContent = (field: FormFieldType) => {
        switch (field.type) {
            case FieldType.TEXT:
            case FieldType.EMAIL:
            case FieldType.PHONE:
            case FieldType.URL:
            case FieldType.TEXTAREA:
                return renderTextFilter(field);

            case FieldType.SELECT:
            case FieldType.ARRAY:
                return renderSelectFilter(field);

            case FieldType.DATE:
                return renderDateFilter(field);

            case FieldType.NUMBER:
                return renderNumberFilter(field);

            case FieldType.BOOLEAN:
                return renderBooleanFilter(field);

            default:
                return renderExistsFilter(field);
        }
    };

    const isFilterActive = (field: FormFieldType): boolean => {
        const filter = activeFilters.find(f => f.fieldName === field.name);
        if (!filter) return false;

        // Check if there's a meaningful value
        if (filter.value == null || filter.value === '') return false;
        if (Array.isArray(filter.value) && filter.value.length === 0) return false;
        if (filter.operator === 'exists') return true; // Exists filter is always meaningful

        return true;
    };

    const getActiveFilterCount = () => {
        return activeFilters.length;
    };

    const accordionItems = availableFilters.map(field =>
        accordionItemBuilder({
            title: (
                <Box direction="horizontal" gap="SP2" align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Box direction="horizontal" gap="SP2" align="center">
                        <Text size="small" weight="normal">
                            {field.label}
                        </Text>
                        {isFilterActive(field) && (
                            <Badge skin="success" size="tiny">Active</Badge>
                        )}
                    </Box>
                    <Box direction="horizontal" gap="SP1" align="center">
                        <Text size="tiny" color="secondary">
                            {field.type}
                        </Text>
                        {isFilterActive(field) && (
                            <IconButton
                                size="tiny"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFilter(field.name);
                                }}
                            >
                                <Icons.X />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            ),
            children: renderFilterContent(field),
            initiallyOpen: isFilterActive(field)
        })
    );

    return (
        <Box direction="vertical" gap="SP3">
            {/* Header */}
            <Box direction="horizontal" gap="SP2" align="center" style={{ justifyContent: 'space-between' }}>
                <Box direction="horizontal" gap="SP2" align="center">
                    <Text size="medium" weight="bold">
                        Filters
                    </Text>
                    {getActiveFilterCount() > 0 && (
                        <Badge skin="primary" size="small">
                            {getActiveFilterCount()} active
                        </Badge>
                    )}
                </Box>
                {getActiveFilterCount() > 0 && (
                    <TextButton
                        size="small"
                        onClick={onClearAll}
                        skin="destructive"
                    >
                        Clear All
                    </TextButton>
                )}
            </Box>

            {/* No filters available */}
            {availableFilters.length === 0 && (
                <Box padding="SP4" textAlign="center">
                    <Text size="small" color="secondary">
                        No filters available for this form
                    </Text>
                </Box>
            )}

            {/* Filter Accordion */}
            {availableFilters.length > 0 && (
                <Accordion
                    items={accordionItems}
                    multiple={true}
                    skin="light"
                    size="small"
                />
            )}
        </Box>
    );
};