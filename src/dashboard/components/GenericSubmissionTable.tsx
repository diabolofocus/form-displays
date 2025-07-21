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
    TagList,
    Table,
    Tooltip
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { GenericSubmission, FormField, FieldType } from '../types';
import { formatToGermanDate } from '../utils/helpers';

interface GenericSubmissionTableProps {
    submissions: GenericSubmission[];
    formFields: FormField[];
    visibleColumns: FormField[];
    columnSettings?: any[]; // Add column settings with width info
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
    visibleColumns, // Use this instead of calculating internally
    columnSettings,
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

    // Simply use the passed visibleColumns
    const safeVisibleColumns = visibleColumns;

    useEffect(() => {
        // Removed console logging to reduce noise
    }, [safeVisibleColumns]);

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
        if (columnSettings) {
            const columnSetting = columnSettings.find(col => col.fieldName === field.name);
            if (columnSetting && columnSetting.width) {
                return columnSetting.width;
            }
        }
        return getDefaultColumnWidth(field, index);
    };

    const hasNoSubmissions = submissions.length === 0;
    return (
        <Box direction="vertical" gap="SP4">
            <Card hideOverflow>
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
                    }

                    /* Keep actions column background transparent on hover */
                    [data-hook="table-cell"]:last-child {
                        background-color: transparent !important;
                    }
                    
                    [data-hook="table-cell"]:last-child:hover {
                        background-color: transparent !important;
                    }
                    
                    /* More specific selector for Wix Table actions column */
                    table tbody tr td:last-child {
                        background-color: transparent !important;
                    }
                    
                    table tbody tr:hover td:last-child {
                        background-color: transparent !important;
                    }

                    /* Custom scrollbar for media gallery tooltip */
                    .media-gallery-tooltip::-webkit-scrollbar {
                        height: 6px;
                    }
                    
                    .media-gallery-tooltip::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 3px;
                    }
                    
                    .media-gallery-tooltip::-webkit-scrollbar-thumb {
                        background: #c1c1c1;
                        border-radius: 3px;
                    }
                    
                    .media-gallery-tooltip::-webkit-scrollbar-thumb:hover {
                        background: #a8a8a8;
                    }

                    /* Force tooltip to be wider */
                    [data-hook="tooltip-content"] {
                        max-width: none !important;
                        min-width: 300px !important;
                        width: auto !important;
                    }

                    /* Override Wix tooltip wrapper constraints */
                    [role="tooltip"] {
                        max-width: 485px !important;
                    }
                
                `}</style>

                <Table
                    horizontalScroll={safeVisibleColumns.length > 4} // Only use horizontal scroll when many columns
                    data={currentSubmissions.map((submission, index) => ({
                        ...submission,
                        _index: index,
                        _submissionData: submission
                    }))}
                    columns={[
                        ...safeVisibleColumns.map((field, index) => ({
                            title: field.name === '_createdDate' || field.name === '_updatedDate' ? (
                                <div
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onClick={() => handleSort(field.name)}
                                >
                                    <Text size="small">
                                        {field.label}
                                    </Text>
                                    {sortField === field.name && (
                                        <Text size="small" color="primary" >
                                            {sortOrder === 'desc' ? '↓' : '↑'}
                                        </Text>
                                    )}
                                </div>
                            ) : (
                                <Text size="small">
                                    {field.label}
                                </Text>
                            ),
                            render: (row: any) => renderFieldValue(row._submissionData, field, index === 0),
                            width: getColumnWidth(field, index),
                            align: 'start' as const
                        })),
                        {
                            title: (
                                <Text size="small" weight="normal">
                                    Actions
                                </Text>
                            ),
                            render: (row: any) => (
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
                                            onClick={() => onViewSubmission(row._submissionData)}
                                            prefixIcon={<Icons.Visible />}
                                        />
                                        <PopoverMenu.MenuItem
                                            text="Print"
                                            onClick={() => onPrintSubmission(row._submissionData)}
                                            prefixIcon={<Icons.Print />}
                                        />
                                        <PopoverMenu.MenuItem
                                            text="Edit"
                                            onClick={() => onEditSubmission(row._submissionData)}
                                            prefixIcon={<Icons.Edit />}
                                        />
                                        <PopoverMenu.Divider />
                                        <PopoverMenu.MenuItem
                                            text="Delete"
                                            onClick={() => onDeleteSubmission(row._submissionData._id)}
                                            prefixIcon={<Icons.Delete />}
                                            skin="destructive"
                                        />
                                    </PopoverMenu>
                                </div>
                            ),
                            align: 'end' as const,
                            stickyActionCell: safeVisibleColumns.length > 4 // Only sticky when many columns
                        }
                    ]}
                >
                    <TableToolbar>
                        <TableToolbar.ItemGroup position="start">
                            <TableToolbar.Item>
                                <Text size="medium" weight="normal">
                                    {filteredSubmissions.length !== totalSubmissions
                                        ? `${filteredSubmissions.length} of ${totalSubmissions} Submissions`
                                        : `${totalSubmissions} Submissions`
                                    }
                                </Text>
                            </TableToolbar.Item>
                            <TableToolbar.Item>
                                {(() => {
                                    // Count total possible columns (form fields + system fields)
                                    const systemFields = ['_createdDate'];
                                    const totalPossibleColumns = formFields.length + systemFields.length;

                                    return (
                                        <Badge skin="neutralLight" size="small">
                                            {safeVisibleColumns.length} of {totalPossibleColumns} columns shown
                                        </Badge>
                                    );
                                })()}
                            </TableToolbar.Item>
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

                    {hasNoSubmissions ? (
                        <Table.EmptyState
                            title="No submissions found"
                            subtitle="There are no submissions for the selected form"
                        />
                    ) : (
                        <Table.Content />
                    )}
                </Table>
            </Card>
            {/* Pagination */}
            {
                totalPages > 1 && (
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
                )
            }

            {
                totalPages <= 1 && (
                    <Box align="center">
                        <Text size="small">
                            Showing all {submissions.length} submissions
                        </Text>
                    </Box>
                )
            }
        </Box >
    );
};

// Default column width fallback function
function getDefaultColumnWidth(field: FormField, index: number): string {
    const fieldName = field.name.toLowerCase();

    // First column (Created date)
    if (index === 0) return '220px';

    // PRIORITY 1: Field Type-based widths
    switch (field.type) {
        case FieldType.EMAIL:
            return '300px';
        case FieldType.PHONE:
            return '260px';
        case FieldType.DATE:
            return '200px';
        case FieldType.BOOLEAN:
            return '180px';
        case FieldType.ARRAY:
            return '320px'; // Arrays need more space for multiple values
        case FieldType.OBJECT:
            return '280px'; // Objects need space for structured data
        case FieldType.TEXTAREA:
            return '400px'; // Long text needs more space
        case FieldType.URL:
            return '300px'; // URLs can be long
        case FieldType.NUMBER:
            return '160px'; // Numbers are typically shorter
        case FieldType.SELECT:
            return '200px'; // Select options are usually medium length
        case FieldType.TEXT:
            // Fall through to check field name patterns for TEXT type
            break;
        default:
            // Fall through to check field name patterns
            break;
    }

    // PRIORITY 2: Field Name Pattern-based widths (only for TEXT and unknown types)
    // Name fields
    if (fieldName.includes('name')) {
        return '280px';
    }

    // Address fields (if not already caught by type)
    if (fieldName.includes('address')) {
        return '360px';
    }

    // Description/comment fields
    if (fieldName.includes('description')) {
        return '400px';
    }

    // ID fields
    if (fieldName.includes('id') || fieldName.includes('guid')) {
        return '200px';
    }

    // Default width for other fields
    return '240px';
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

        // Check if this is a media gallery (array of objects with url/filename)
        const isMediaGallery = value.some(item =>
            typeof item === 'object' &&
            item !== null &&
            (item.url || item.filename || item.name)
        );

        if (isMediaGallery) {
            // Show first 3 media items horizontally, then count if more
            const mediaItems = value.slice(0, 3);
            const remainingCount = Math.max(0, value.length - 3);

            const tooltipContent = (
                <Box
                    direction="horizontal"
                    gap="SP2"
                    padding="12px"
                    className="media-gallery-tooltip"
                    style={{
                        minWidth: '600px',
                        overflowX: 'auto',
                        scrollBehavior: 'smooth'
                    }}
                >
                    {value.map((item, index) => {
                        const imageUrl = item.url || item.src;
                        const fileName = item.filename || item.name || `File ${index + 1}`;

                        return (
                            <Box key={index} direction="vertical" gap="SP1" align="center">
                                {imageUrl && isImageUrl(imageUrl) ? (
                                    <img
                                        src={imageUrl}
                                        alt={fileName}
                                        style={{
                                            width: '200px',
                                            height: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0',
                                            flexShrink: 0
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <Box
                                        width="200px"
                                        height="200px"
                                        backgroundColor="neutralLight"
                                        borderRadius="8px"
                                        align="center"
                                        verticalAlign="middle"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <Icons.Document size="64px" />
                                    </Box>
                                )}
                                <Text size="tiny" ellipsis style={{ maxWidth: '200px', textAlign: 'center' }}>
                                    {fileName}
                                </Text>
                            </Box>
                        );
                    })}
                </Box>
            );

            return (
                <Tooltip content={tooltipContent} placement="top" size="medium">
                    <Box direction="horizontal" gap="SP1" align="center" style={{ cursor: 'pointer' }}>
                        {mediaItems.map((item, index) => {
                            const imageUrl = item.url || item.src;
                            const fileName = item.filename || item.name || `File ${index + 1}`;

                            return (
                                <Box key={index}>
                                    {imageUrl && isImageUrl(imageUrl) ? (
                                        <img
                                            src={imageUrl}
                                            alt={fileName}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #e0e0e0'
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Box
                                            width="36px"
                                            height="36px"
                                            backgroundColor="neutralLight"
                                            borderRadius="4px"
                                            align="center"
                                            verticalAlign="middle"
                                        >
                                            <Icons.Document size="16px" />
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                        {remainingCount > 0 && (
                            <Badge skin="neutralLight" size="small">
                                +{remainingCount}
                            </Badge>
                        )}
                    </Box>
                </Tooltip>
            );
        }

        // Regular array handling for non-media arrays
        const tagData = value.map((item, index) => ({
            id: `tag-${index}`,
            children: String(item).substring(0, 25),
            removable: false
        }));

        const maxVisibleTags = 4;

        return (
            <TagList
                tags={tagData}
                size="small"
                maxVisibleTags={maxVisibleTags}
                toggleMoreButton={
                    value.length > maxVisibleTags
                        ? (amountOfHiddenTags, isExpanded) => ({
                            label: isExpanded ? 'Show Less' : `+${amountOfHiddenTags} More`,
                            tooltipContent: !isExpanded ? 'Show More' : 'Show Less',
                            skin: 'standard' as const,
                            priority: 'secondary' as const,
                        })
                        : undefined
                }
                onTagRemove={() => { }} // Required prop but won't be used since removable: false
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