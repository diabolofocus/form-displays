// ==============================================
// UPDATED: src/dashboard/pages/components/GenericSubmissionTable.tsx - Fixed Errors
// ==============================================

import React, { useState, useEffect } from 'react';
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

interface GenericSubmissionTableProps {
    submissions: GenericSubmission[];
    formFields: FormField[];
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

    // Display all fields plus creation date
    const displayFields = getDisplayFields(formFields);

    const hasNoSubmissions = submissions.length === 0;

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
                    
                    /* Ensure consistent cell alignment */
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
                            {displayFields.length > 6 && (
                                <TableToolbar.Item>
                                    <Text size="small" color="secondary">
                                        {displayFields.length} columns • Scroll horizontally for more →
                                    </Text>
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
                            {displayFields.map((field, index) => (
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
                                        {displayFields.map((field, index) => (
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

// Helper functions

function getDisplayFields(formFields: FormField[]): FormField[] {
    // Always include creation date first
    const createdDateField: FormField = {
        name: '_createdDate',
        label: 'Created',
        type: FieldType.DATE
    };

    // Sort form fields by priority for better column ordering
    const sortedFields = [...formFields].sort((a, b) => {
        const priorityA = getFieldPriority(a.name);
        const priorityB = getFieldPriority(b.name);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.label.localeCompare(b.label);
    });

    // Return creation date + all form fields
    return [createdDateField, ...sortedFields];
}

function getFieldPriority(fieldName: string): number {
    const name = fieldName.toLowerCase();

    // Higher priority (lower number) for important fields
    if (name.includes('name') || name.includes('vorname') || name.includes('nachname')) return 1;
    if (name.includes('email') || name.includes('mail')) return 2;
    if (name.includes('telefon') || name.includes('phone')) return 3;
    if (name.includes('geburt') || name.includes('birth') || name.includes('age')) return 4;
    if (name.includes('geschlecht') || name.includes('gender')) return 5;
    if (name.includes('datum') || name.includes('date')) return 6;
    if (name.includes('adresse') || name.includes('address')) return 7;

    return 999; // Default priority for other fields
}

function getColumnWidth(field: FormField, index: number): string {
    // Fixed widths for better alignment between headers and data
    const fieldName = field.name.toLowerCase();

    // First column (Created date)
    if (index === 0) return '110px';

    // Name fields - need more space for full names
    if (fieldName.includes('name') || fieldName.includes('vorname') || fieldName.includes('nachname')) {
        return '140px';
    }

    // Email fields - need space for full email addresses
    if (field.type === FieldType.EMAIL || fieldName.includes('email') || fieldName.includes('mail')) {
        return '200px';
    }

    // Phone fields - consistent width for phone numbers
    if (field.type === FieldType.PHONE || fieldName.includes('telefon') || fieldName.includes('phone')) {
        return '130px';
    }

    // Date fields - consistent width for dates
    if (field.type === FieldType.DATE || fieldName.includes('datum') || fieldName.includes('date') || fieldName.includes('birth')) {
        return '100px';
    }

    // Boolean/Short answer fields - smaller width
    if (field.type === FieldType.BOOLEAN || fieldName.includes('activ') || fieldName.includes('mailbox')) {
        return '90px';
    }

    // Address fields - need more space
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

    // Special rendering for first column (creation date WITHOUT avatar)
    if (isFirstColumn) {
        return (
            <Text size="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatValue(value, field.type)}
            </Text>
        );
    }

    // Enhanced rendering based on field type and value analysis
    return (
        <Box style={{ width: '100%', overflow: 'hidden' }}>
            {renderValueByType(value, field)}
        </Box>
    );
}

function renderValueByType(value: any, field: FormField): React.ReactNode {
    // Handle different data types with appropriate rendering

    // Check for string URLs that might be images
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

    // Arrays - render as tags or list items with smart content detection
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <Text size="small" color="disabled">Empty array</Text>;
        }

        // Check if array contains images
        const hasImages = value.some(item =>
            (typeof item === 'string' && isImageUrl(item)) ||
            (typeof item === 'object' && item && item.url && isImageUrl(item.url))
        );

        if (hasImages && value.length <= 3) {
            return (
                <Box direction="horizontal" gap="SP1" style={{ flexWrap: 'wrap' }}>
                    {value.slice(0, 3).map((item, index) => {
                        if (typeof item === 'string' && isImageUrl(item)) {
                            return (
                                <img
                                    key={index}
                                    src={item}
                                    alt="Image"
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            );
                        }
                        if (typeof item === 'object' && item && item.url && isImageUrl(item.url)) {
                            return (
                                <img
                                    key={index}
                                    src={item.url}
                                    alt="Image"
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            );
                        }
                        return null;
                    })}
                </Box>
            );
        }

        // If array has many items, show count with preview
        if (value.length > 4) {
            const previewItems = value.slice(0, 2);
            const previewText = previewItems.map(item => getItemPreview(item)).join(', ');
            return (
                <Box direction="horizontal" gap="SP1" align="center">
                    <Badge skin="neutralLight" size="small">{value.length} items</Badge>
                    <Text size="tiny" color="secondary" ellipsis title={previewText}>
                        {previewText}...
                    </Text>
                </Box>
            );
        }

        // For manageable arrays, show as tags with rich content
        const tagData = value.slice(0, 4).map((item, index) => ({
            id: `tag-${index}`,
            children: getItemPreview(item, 25) // Limit tag content length
        }));

        return (
            <TagList
                tags={tagData}
                size="small"
                maxVisibleTags={4}
            />
        );
    }

    // Objects - handle special object types and rich content
    if (typeof value === 'object' && value !== null) {
        return renderObjectValue(value);
    }

    // Strings - check for special patterns and rich content
    if (typeof value === 'string') {
        return renderStringValue(value, field);
    }

    // Numbers
    if (typeof value === 'number') {
        return <Text size="small">{value.toLocaleString()}</Text>;
    }

    // Handle other specific field types
    switch (field.type) {
        case FieldType.DATE:
            if (typeof value === 'string') {
                return <Text size="small">{formatToGermanDate(value)}</Text>;
            }
            break;

        case FieldType.BOOLEAN:
            return (
                <Badge skin={value ? 'success' : 'neutralLight'} size="small">
                    {value ? 'Yes' : 'No'}
                </Badge>
            );
    }

    // Default rendering
    return <Text size="small" ellipsis>{formatValue(value, field.type)}</Text>;
}

// Enhanced helper to get meaningful preview of any item
function getItemPreview(item: any, maxLength: number = 30): string {
    if (item === null || item === undefined) {
        return 'null';
    }

    if (typeof item === 'string') {
        return item.length > maxLength ? item.substring(0, maxLength - 3) + '...' : item;
    }

    if (typeof item === 'number' || typeof item === 'boolean') {
        return String(item);
    }

    if (typeof item === 'object') {
        // Handle special object types
        if (item.url) {
            if (isImageUrl(item.url)) {
                return '🖼️ Image';
            }
            return '📄 File';
        }

        if (item.street || item.city || item.zipCode) {
            const parts = [item.street, item.city, item.zipCode].filter(Boolean);
            const address = parts.join(', ');
            return address.length > maxLength ? address.substring(0, maxLength - 3) + '...' : address;
        }

        if (item.name || item.title || item.label) {
            const name = item.name || item.title || item.label;
            return String(name).length > maxLength ? String(name).substring(0, maxLength - 3) + '...' : String(name);
        }

        if (item.value !== undefined) {
            return getItemPreview(item.value, maxLength);
        }

        // For generic objects, show key count and first meaningful key
        const keys = Object.keys(item);
        if (keys.length === 0) {
            return 'Empty object';
        }

        const firstKey = keys[0];
        const firstValue = item[firstKey];
        if (typeof firstValue === 'string' && firstValue.length > 0) {
            return `${firstKey}: ${firstValue.substring(0, 15)}`;
        }

        return `Object (${keys.length} keys)`;
    }

    return String(item).substring(0, maxLength);
}

// Enhanced object rendering
function renderObjectValue(obj: any): React.ReactNode {
    // Image/File objects - improved detection
    if (obj.url && typeof obj.url === 'string') {
        if (isImageUrl(obj.url)) {
            return (
                <Box direction="horizontal" gap="SP1" align="center">
                    <img
                        src={obj.url}
                        alt="Image"
                        style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0'
                        }}
                        onError={(e) => {
                            // If image fails to load, show a placeholder
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            if (target.nextSibling) {
                                (target.nextSibling as HTMLElement).textContent = '🖼️ Image (failed)';
                            }
                        }}
                    />
                    <Text size="small" color="secondary">
                        {obj.name ? obj.name.substring(0, 20) : 'Image'}
                    </Text>
                </Box>
            );
        } else {
            return (
                <Box direction="horizontal" gap="SP1" align="center">
                    <Icons.ExternalLink size="16px" />
                    <Text size="small" ellipsis>
                        {obj.name || 'File'}
                    </Text>
                    {obj.size && (
                        <Text size="tiny" color="secondary">
                            ({formatFileSize(obj.size)})
                        </Text>
                    )}
                </Box>
            );
        }
    }

    // Check if the object itself might be an image with different structure
    if (obj.type && typeof obj.type === 'string' && obj.type.startsWith('image/')) {
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Text size="small">🖼️ Image</Text>
                {obj.name && (
                    <Text size="tiny" color="secondary" ellipsis>
                        {obj.name}
                    </Text>
                )}
            </Box>
        );
    }

    // Address objects
    if (obj.street || obj.city || obj.zipCode || obj.country) {
        const addressParts = [obj.street, obj.city, obj.state, obj.zipCode, obj.country].filter(Boolean);
        const fullAddress = addressParts.join(', ');
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Icons.Home size="16px" />
                <Text size="small" ellipsis title={fullAddress}>
                    {fullAddress.length > 35 ? fullAddress.substring(0, 32) + '...' : fullAddress}
                </Text>
            </Box>
        );
    }

    // Contact objects
    if (obj.email || obj.phone) {
        return (
            <Box direction="vertical" gap="SP0">
                {obj.email && (
                    <Text size="small" ellipsis>{obj.email}</Text>
                )}
                {obj.phone && (
                    <Text size="tiny" color="secondary">{obj.phone}</Text>
                )}
            </Box>
        );
    }

    // Named objects (with name, title, or label)
    if (obj.name || obj.title || obj.label) {
        const displayName = obj.name || obj.title || obj.label;
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Text size="small" ellipsis>{displayName}</Text>
                {obj.value !== undefined && (
                    <Text size="tiny" color="secondary" ellipsis>
                        ({getItemPreview(obj.value, 15)})
                    </Text>
                )}
            </Box>
        );
    }

    // Date objects
    if (obj.date || obj.timestamp || obj.created || obj.updated) {
        const dateValue = obj.date || obj.timestamp || obj.created || obj.updated;
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Icons.Date size="16px" />
                <Text size="small">{formatToGermanDate(dateValue)}</Text>
            </Box>
        );
    }

    // Generic object with meaningful content
    const keys = Object.keys(obj);
    if (keys.length === 0) {
        return <Text size="small" color="disabled">Empty object</Text>;
    }

    // Show first meaningful key-value pair
    const meaningfulKey = keys.find(key => {
        const value = obj[key];
        return typeof value === 'string' && value.length > 0 && value.length < 50;
    }) || keys[0];

    const value = obj[meaningfulKey];

    return (
        <Box direction="horizontal" gap="SP1" align="center">
            <Badge skin="neutralLight" size="small">{keys.length} fields</Badge>
            <Text size="tiny" color="secondary" ellipsis>
                {meaningfulKey}: {getItemPreview(value, 15)}
            </Text>
        </Box>
    );
}

// Enhanced string rendering
function renderStringValue(value: string, field: FormField): React.ReactNode {
    // Email
    if (field.type === FieldType.EMAIL || isEmail(value)) {
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Icons.Email size="16px" />
                <Text size="small" ellipsis>{value}</Text>
            </Box>
        );
    }

    // Phone
    if (field.type === FieldType.PHONE || isPhone(value)) {
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Icons.Phone size="16px" />
                <Text size="small">{value}</Text>
            </Box>
        );
    }

    // URL
    if (field.type === FieldType.URL || isUrl(value)) {
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Icons.ExternalLink size="16px" />
                <Text size="small" ellipsis>{value}</Text>
            </Box>
        );
    }

    // Long text / textarea
    if (field.type === FieldType.TEXTAREA || value.length > 100) {
        return (
            <Text size="small" ellipsis title={value}>
                {value.substring(0, 40)}...
            </Text>
        );
    }

    // Rich text detection (HTML)
    if (value.includes('<') && value.includes('>')) {
        const textContent = value.replace(/<[^>]*>/g, '').trim();
        return (
            <Box direction="horizontal" gap="SP1" align="center">
                <Icons.Text size="16px" />
                <Text size="small" ellipsis title={textContent}>
                    {textContent.substring(0, 30)}...
                </Text>
            </Box>
        );
    }

    // Default string
    return <Text size="small" ellipsis>{value}</Text>;
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper functions for type detection
function isImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|avif)(\?|$|#)/i;
    if (imageExtensions.test(url)) return true;

    // Check for data URLs
    if (url.startsWith('data:image/')) return true;

    // Check for Wix media URLs
    if (url.includes('wixmp.com') || url.includes('wixstatic.com')) return true;

    // Check for common image hosting services
    const imageHosts = /(imgur|cloudinary|unsplash|pexels|pixabay|amazonaws|googleusercontent)/i;
    if (imageHosts.test(url)) return true;

    return false;
}

function isEmail(value: string): boolean {
    return /\S+@\S+\.\S+/.test(value);
}

function isPhone(value: string): boolean {
    return /^[\+\d\s\-\(\)]+$/.test(value) && value.length > 5;
}

function isUrl(value: string): boolean {
    try {
        new URL(value);
        return true;
    } catch {
        return /^https?:\/\/.+/.test(value);
    }
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
            // Shorter truncation for tables with many columns
            return str.length > 30 ? str.substring(0, 27) + '...' : str;
    }
}

function getSortValue(submission: GenericSubmission, field: string): any {
    if (field.startsWith('_')) {
        return submission[field as keyof GenericSubmission] || '';
    }
    return submission.submissions[field] || '';
}