// ==============================================
// FULLY FIXED: src/dashboard/pages/components/GenericSubmissionTable.tsx - Complete Fix
// ==============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
    Button,
    Text,
    Badge,
    Pagination,
    PopoverMenu,
    Box,
    Search,
    Card,
    TableToolbar,
    Input,
    IconButton,
    TextButton,
    TagList
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { GenericSubmission, FormField, FieldType } from '../types';
import { formatToGermanDate } from '../utils/helpers';
import { useSettings } from '../hooks/useSettings';

interface GenericSubmissionTableProps {
    submissions: GenericSubmission[];
    formFields: FormField[];
    formId: string | null;
    onViewSubmission: (submission: GenericSubmission) => void;
    onPrintSubmission: (submission: GenericSubmission) => void;
    onDeleteSubmission: (submissionId: string) => void;
    onEditSubmission: (submission: GenericSubmission) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    totalSubmissions: number;
}

const ITEMS_PER_PAGE = 40;

export const GenericSubmissionTable: React.FC<GenericSubmissionTableProps> = ({
    submissions,
    formFields,
    formId,
    onViewSubmission,
    onPrintSubmission,
    onDeleteSubmission,
    onEditSubmission,
    searchTerm,
    onSearchChange,
    totalSubmissions,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string>('_createdDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Use settings to get visible columns - now returns memoized visibleColumns directly
    const { visibleColumns, settings, isLoading: settingsLoading } = useSettings(formId, formFields);

    // CRITICAL: Ensure we only use settings that match the current form
    const safeVisibleColumns = useMemo(() => {
        if (!formId) {
            console.log('GenericSubmissionTable: No formId, using all fields');
            return formFields;
        }

        if (settings && settings.formId !== formId) {
            console.log('GenericSubmissionTable: Settings form mismatch!', {
                settingsFormId: settings.formId,
                currentFormId: formId
            });
            return formFields; // Use all fields if settings don't match
        }

        console.log('GenericSubmissionTable: Using visible columns for form', formId, ':', visibleColumns.length);
        return visibleColumns;
    }, [visibleColumns, settings, formId, formFields]);

    // Log when safeVisibleColumns change for debugging
    useEffect(() => {
        console.log('GenericSubmissionTable: safeVisibleColumns changed:', safeVisibleColumns.length);
        console.log('GenericSubmissionTable: settings:', settings ? { formId: settings.formId, valid: settings.formId === formId } : null);
    }, [safeVisibleColumns, settings, formId]);

    // Filter submissions based on search term
    const filteredSubmissions = submissions.filter(submission => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();

        // Search in all text fields
        return formFields.some(field => {
            const value = submission.submissions[field.name];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(searchLower);
            }
            if (Array.isArray(value)) {
                return value.some(v =>
                    typeof v === 'string' && v.toLowerCase().includes(searchLower)
                );
            }
            return false;
        });
    });

    // Reset to first page when submissions data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [submissions.length]);

    const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredSubmissions.length);

    // Sort submissions
    const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
        let aValue = getSortValue(a, sortField);
        let bValue = getSortValue(b, sortField);

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    const currentSubmissions = sortedSubmissions.slice(startIndex, endIndex);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Get column width from settings or use default
    const getColumnWidth = (field: FormField, index: number): string => {
        if (settings && settings.formId === formId) {
            const columnSetting = settings.columns.find(col => col.fieldName === field.name);
            if (columnSetting?.width) {
                return columnSetting.width;
            }
        }

        // Fallback to default widths
        return getDefaultColumnWidth(field, index);
    };

    const hasNoSubmissions = submissions.length === 0;

    // Show loading state while settings are loading OR if settings don't match current form
    if (settingsLoading) {
        return (
            <Box direction="vertical" gap="SP4">
                <Card>
                    <Box padding="40px" textAlign="center">
                        <Text>Loading table settings...</Text>
                    </Box>
                </Card>
            </Box>
        );
    }

    // Show warning if settings don't match current form
    if (settings && formId && settings.formId !== formId) {
        console.warn('GenericSubmissionTable: Settings form mismatch detected!', {
            settingsFormId: settings.formId,
            currentFormId: formId,
            usingFallback: true
        });
    }

    return (
        <Box direction="vertical" gap="SP4">
            <Box
                style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'auto',
                    minWidth: '100%',
                    minHeight: hasNoSubmissions ? '100px' : 'auto'
                }}
            >
                <style>{`
                    .generic-table-container table tbody tr {
                        transition: background-color 0.15s ease;
                    }
                    .generic-table-container table tbody tr:hover {
                        background-color: rgba(59, 130, 246, 0.08) !important;
                    }
                    .generic-table-container table tbody tr:hover td {
                        background-color: transparent !important;
                    }
                    
                    .table-row-hover:hover {
                        background-color: rgba(59, 130, 246, 0.08) !important;
                    }
                    
                    .table-container {
                        overflow-x: auto;
                        min-width: 100%;
                        scroll-behavior: smooth;
                    }
                    
                    table { 
                        min-width: max-content !important; 
                        width: max-content !important;
                        table-layout: fixed;
                    }
                    
                    .table-cell {
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .table-container::-webkit-scrollbar {
                        height: 8px;
                    }
                    
                    .table-container::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                    }
                    
                    .table-container::-webkit-scrollbar-thumb {
                        background: #c1c1c1;
                        border-radius: 4px;
                    }
                    
                    .table-container::-webkit-scrollbar-thumb:hover {
                        background: #a8a8a8;
                    }

                    .actions-column {
                        position: sticky !important;
                        right: 0px !important;
                        z-index: 1 !important;
                        background-color: white !important;
                        box-shadow: -2px 0 4px rgba(0,0,0,0.1);
                    }
                `}</style>

                <Card>
                    <TableToolbar>
                        <TableToolbar.ItemGroup position="start">
                            <TableToolbar.Item>
                                <Text size="medium" weight="normal">
                                    {filteredSubmissions.length !== totalSubmissions
                                        ? `${filteredSubmissions.length} of ${totalSubmissions} submissions`
                                        : `${totalSubmissions} submissions`
                                    }
                                </Text>
                            </TableToolbar.Item>
                            {safeVisibleColumns.length > 6 && (
                                <TableToolbar.Item>
                                    <Text size="small" color="secondary">
                                        {safeVisibleColumns.length} columns • Scroll horizontally for more →
                                    </Text>
                                </TableToolbar.Item>
                            )}
                            {settings && settings.formId === formId && (
                                <TableToolbar.Item>
                                    <Badge skin="neutralLight" size="small">
                                        {safeVisibleColumns.length} of {settings.columns.length} columns shown
                                    </Badge>
                                </TableToolbar.Item>
                            )}
                        </TableToolbar.ItemGroup>
                        <TableToolbar.ItemGroup position="end">
                            <TableToolbar.Item>
                                <Box width="300">
                                    <Search
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        placeholder="Search all fields..."
                                        size="small"
                                    />
                                </Box>
                            </TableToolbar.Item>
                        </TableToolbar.ItemGroup>
                    </TableToolbar>

                    <Box
                        direction="vertical"
                        style={{
                            overflowX: 'auto',
                            minWidth: '100%',
                            width: 'max-content'
                        }}
                        className="generic-table-container"
                    >
                        {/* Table Header */}
                        <Box
                            direction="horizontal"
                            padding="8px 0px"
                            backgroundColor="#d9e5fc"
                            style={{
                                alignItems: 'center',
                                borderTop: '1px solid #afc9fa',
                                borderBottom: '1px solid #afc9fa',
                                minWidth: 'max-content',
                                display: 'flex'
                            }}
                        >
                            {safeVisibleColumns.map((field, index) => (
                                <div
                                    key={field.name}
                                    style={{
                                        width: getColumnWidth(field, index),
                                        minWidth: getColumnWidth(field, index),
                                        maxWidth: getColumnWidth(field, index),
                                        flex: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: field.name === '_createdDate' || field.name === '_updatedDate' ? 'pointer' : 'default',
                                        padding: '0 16px',
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={() => {
                                        if (field.name === '_createdDate' || field.name === '_updatedDate') {
                                            handleSort(field.name);
                                        }
                                    }}
                                >
                                    <Text
                                        size="small"
                                        weight="normal"
                                        color="#1976D2"
                                        style={{
                                            cursor: field.name === '_createdDate' || field.name === '_updatedDate' ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '100%'
                                        }}
                                    >
                                        {field.label}
                                        {sortField === field.name && (
                                            <span style={{
                                                marginLeft: '4px',
                                                color: '#1976D2',
                                                fontWeight: 'bold'
                                            }}>
                                                {sortOrder === 'desc' ? '↓' : '↑'}
                                            </span>
                                        )}
                                    </Text>
                                </div>
                            ))}

                            {/* Actions Column Header */}
                            <div
                                style={{
                                    width: '100px',
                                    minWidth: '100px',
                                    maxWidth: '100px',
                                    flex: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 16px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <Text size="small" weight="normal" color="#1976D2">Actions</Text>
                            </div>
                        </Box>

                        {hasNoSubmissions && (
                            <Box
                                width="100%"
                                padding="20px"
                                textAlign="center"
                                borderTop="1px solid #e0e0e0"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '150px',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <Text size="medium" weight="normal">No submissions found</Text>
                            </Box>
                        )}

                        {/* Table Rows */}
                        <Box direction="vertical">
                            {currentSubmissions.map((submission) => (
                                <div
                                    key={submission._id}
                                    onClick={() => onViewSubmission(submission)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div
                                        style={{
                                            alignItems: 'center',
                                            minHeight: '56px',
                                            transition: 'background-color 0.15s ease',
                                            borderBottom: '1px solid #EAEAEA',
                                            display: 'flex',
                                            minWidth: 'max-content',
                                            backgroundColor: '#FFFFFF'
                                        }}
                                        className="table-row-hover"
                                    >
                                        {safeVisibleColumns.map((field, index) => (
                                            <div
                                                key={field.name}
                                                style={{
                                                    width: getColumnWidth(field, index),
                                                    minWidth: getColumnWidth(field, index),
                                                    maxWidth: getColumnWidth(field, index),
                                                    flex: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '8px 16px',
                                                    boxSizing: 'border-box',
                                                    height: '56px'
                                                }}
                                            >
                                                {renderFieldValue(submission, field, index === 0)}
                                            </div>
                                        ))}

                                        {/* Actions Column */}
                                        <div
                                            style={{
                                                width: '100px',
                                                minWidth: '100px',
                                                maxWidth: '100px',
                                                flex: 'none',
                                                padding: '8px 16px',
                                                boxSizing: 'border-box',
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                                height: '56px'
                                            }}
                                            className="actions-column"
                                        >
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <PopoverMenu
                                                    textSize="small"
                                                    triggerElement={
                                                        <IconButton
                                                            skin="inverted"
                                                            size="small"
                                                        >
                                                            <Icons.More />
                                                        </IconButton>
                                                    }
                                                    placement="top"
                                                >
                                                    <PopoverMenu.MenuItem
                                                        text="Preview"
                                                        onClick={() => onViewSubmission(submission)}
                                                        prefixIcon={<Icons.Visible />}
                                                    />
                                                    <PopoverMenu.MenuItem
                                                        text="Print"
                                                        onClick={() => onPrintSubmission(submission)}
                                                        prefixIcon={<Icons.Print />}
                                                    />
                                                    <PopoverMenu.MenuItem
                                                        text="Edit"
                                                        onClick={() => onEditSubmission(submission)}
                                                        prefixIcon={<Icons.Edit />}
                                                    />
                                                    <PopoverMenu.Divider />
                                                    <PopoverMenu.MenuItem
                                                        text="Delete"
                                                        onClick={() => onDeleteSubmission(submission._id)}
                                                        prefixIcon={<Icons.Delete />}
                                                        skin="destructive"
                                                    />
                                                </PopoverMenu>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Box>
                    </Box>
                </Card>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box direction="vertical" gap="SP1" align="center">
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onChange={(event) => setCurrentPage(event.page)}
                    />
                    <Box textAlign="center">
                        <Text size="small">
                            Showing {startIndex + 1} to {endIndex} of {filteredSubmissions.length} submissions
                            {searchTerm && ` (filtered from ${totalSubmissions} total)`}
                        </Text>
                    </Box>
                </Box>
            )}

            {totalPages <= 1 && (
                <Box align="center">
                    <Text size="small">
                        Showing all {submissions.length} submissions
                    </Text>
                </Box>
            )}
        </Box>
    );
};

// Default column width fallback function
function getDefaultColumnWidth(field: FormField, index: number): string {
    const fieldName = field.name.toLowerCase();

    // First column (Created date)
    if (index === 0) return '110px';

    // Name fields
    if (fieldName.includes('name') || fieldName.includes('vorname') || fieldName.includes('nachname')) {
        return '140px';
    }

    // Email fields
    if (field.type === FieldType.EMAIL || fieldName.includes('email') || fieldName.includes('mail')) {
        return '200px';
    }

    // Phone fields
    if (field.type === FieldType.PHONE || fieldName.includes('telefon') || fieldName.includes('phone')) {
        return '130px';
    }

    // Date fields
    if (field.type === FieldType.DATE || fieldName.includes('datum') || fieldName.includes('date') || fieldName.includes('birth')) {
        return '100px';
    }

    // Boolean/Short answer fields
    if (field.type === FieldType.BOOLEAN || fieldName.includes('activ') || fieldName.includes('mailbox')) {
        return '90px';
    }

    // Address fields
    if (fieldName.includes('address') || fieldName.includes('adresse') || fieldName.includes('street') || fieldName.includes('strasse')) {
        return '180px';
    }

    // Gender/short selection fields
    if (fieldName.includes('geschlecht') || fieldName.includes('gender')) {
        return '80px';
    }

    // Array fields
    if (field.type === FieldType.ARRAY) {
        return '120px';
    }

    // Textarea/long text fields
    if (field.type === FieldType.TEXTAREA) {
        return '200px';
    }

    // Default width for other fields
    return '120px';
}

function renderFieldValue(submission: GenericSubmission, field: FormField, isFirstColumn: boolean): React.ReactNode {
    const value = field.name.startsWith('_') ? submission[field.name as keyof GenericSubmission] : submission.submissions[field.name];

    if (value == null || value === '') {
        return <Text size="small" color="disabled">-</Text>;
    }

    if (isFirstColumn) {
        return (
            <Text size="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatValue(value, field.type)}
            </Text>
        );
    }

    return (
        <Box style={{ width: '100%', overflow: 'hidden' }}>
            {renderValueByType(value, field)}
        </Box>
    );
}

function renderValueByType(value: any, field: FormField): React.ReactNode {
    if (typeof value === 'string' && isImageUrl(value)) {
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <img
                    src={value}
                    alt="Image"
                    style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0'
                    }}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <Text size="small" color="secondary">Image</Text>
            </Box>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <Text size="small" color="disabled">Empty array</Text>;
        }

        if (value.length > 4) {
            return (
                <Box direction="horizontal" gap="SP1" align="center">
                    <Badge skin="neutralLight" size="small">{value.length} items</Badge>
                </Box>
            );
        }

        const tagData = value.slice(0, 4).map((item, index) => ({
            id: `tag-${index}`,
            children: String(item).substring(0, 25)
        }));

        return (
            <TagList
                tags={tagData}
                size="small"
                maxVisibleTags={4}
            />
        );
    }

    if (typeof value === 'object' && value !== null) {
        return <Text size="small" ellipsis>Object</Text>;
    }

    if (field.type === FieldType.BOOLEAN) {
        return (
            <Badge skin={value ? 'success' : 'neutralLight'} size="small">
                {value ? 'Yes' : 'No'}
            </Badge>
        );
    }

    return <Text size="small" ellipsis>{formatValue(value, field.type)}</Text>;
}

function isImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|avif)(\?|$|#)/i.test(url);
}

function formatValue(value: any, type: FieldType): string {
    if (value == null) return '';

    switch (type) {
        case FieldType.DATE:
            return formatToGermanDate(String(value));
        case FieldType.BOOLEAN:
            return value ? 'Yes' : 'No';
        case FieldType.ARRAY:
            return Array.isArray(value) ? `${value.length} items` : String(value);
        case FieldType.OBJECT:
            return typeof value === 'object' ? 'Object' : String(value);
        default:
            const str = String(value);
            return str.length > 30 ? str.substring(0, 27) + '...' : str;
    }
}

function getSortValue(submission: GenericSubmission, field: string): any {
    if (field.startsWith('_')) {
        return submission[field as keyof GenericSubmission] || '';
    }
    return submission.submissions[field] || '';
}