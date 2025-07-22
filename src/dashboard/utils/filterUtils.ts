// ==============================================
// NEW: src/dashboard/utils/filterUtils.ts
// ==============================================

import { GenericSubmission, FieldType } from '../types';
import { FilterValue, FilterOperator } from '../components/GenericFilterPanel';


export function applyFilters(submissions: GenericSubmission[], filters: FilterValue[]): GenericSubmission[] {
    if (filters.length === 0) {
        return submissions;
    }

    return submissions.filter(submission => {
        return filters
            .filter(filter => filter.value && filter.value !== '') // Only apply filters with actual values
            .every(filter => {
                return applyFilter(submission, filter);
            });
    });
}

function applyFilter(submission: GenericSubmission, filter: FilterValue): boolean {
    const value = submission.submissions[filter.fieldName];
    return matchesFilter(value, filter);
}

function matchesFilter(value: any, filter: FilterValue): boolean {
    const { value: filterValue, operator = 'equals' } = filter;

    // Handle null/undefined values
    if (value == null || value === '') {
        if (operator === 'exists') {
            return filterValue === false; // Filter value false means "is empty"
        }
        return false;
    }

    // Handle exists operator
    if (operator === 'exists') {
        return filterValue === true; // Filter value true means "has value"
    }

    // Convert values to appropriate types for comparison
    const normalizedValue = normalizeValue(value);
    const normalizedFilterValue = normalizeValue(filterValue);

    switch (operator) {
        case 'equals':
            return compareValues(normalizedValue, normalizedFilterValue, 'equals');

        case 'contains':
            return String(normalizedValue).toLowerCase().includes(String(normalizedFilterValue).toLowerCase());

        case 'startsWith':
            return String(normalizedValue).toLowerCase().startsWith(String(normalizedFilterValue).toLowerCase());

        case 'endsWith':
            return String(normalizedValue).toLowerCase().endsWith(String(normalizedFilterValue).toLowerCase());

        case 'greaterThan':
            return compareValues(normalizedValue, normalizedFilterValue, 'greaterThan');

        case 'lessThan':
            return compareValues(normalizedValue, normalizedFilterValue, 'lessThan');

        case 'between':
            return isBetween(normalizedValue, normalizedFilterValue);

        case 'in':
            return isIn(normalizedValue, normalizedFilterValue);

        default:
            return false;
    }
}

function normalizeValue(value: any): any {
    if (value == null) return null;

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(v => String(v));
    }

    // Handle dates
    if (value instanceof Date || isDateString(value)) {
        return new Date(value);
    }

    // Handle numbers
    if (typeof value === 'number' || isNumberString(value)) {
        return typeof value === 'number' ? value : parseFloat(value);
    }

    // Handle booleans
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === 'yes' || lower === '1') return true;
        if (lower === 'false' || lower === 'no' || lower === '0') return false;
    }

    return String(value);
}

function compareValues(value: any, filterValue: any, operator: 'equals' | 'greaterThan' | 'lessThan'): boolean {
    // Handle dates
    if (value instanceof Date && filterValue instanceof Date) {
        const valueTime = value.getTime();
        const filterTime = filterValue.getTime();

        switch (operator) {
            case 'equals':
                // For dates, check if they're on the same day
                return value.toDateString() === filterValue.toDateString();
            case 'greaterThan':
                return valueTime > filterTime;
            case 'lessThan':
                return valueTime < filterTime;
        }
    }

    // Handle numbers
    if (typeof value === 'number' && typeof filterValue === 'number') {
        switch (operator) {
            case 'equals':
                return value === filterValue;
            case 'greaterThan':
                return value > filterValue;
            case 'lessThan':
                return value < filterValue;
        }
    }

    // Handle strings and other types
    switch (operator) {
        case 'equals':
            return String(value).toLowerCase() === String(filterValue).toLowerCase();
        case 'greaterThan':
            return String(value).toLowerCase() > String(filterValue).toLowerCase();
        case 'lessThan':
            return String(value).toLowerCase() < String(filterValue).toLowerCase();
        default:
            return false;
    }
}

function isBetween(value: any, filterValue: any): boolean {
    if (!filterValue || typeof filterValue !== 'object') return false;

    // Handle date ranges
    if (value instanceof Date) {
        const from = filterValue.from ? new Date(filterValue.from) : null;
        const to = filterValue.to ? new Date(filterValue.to) : null;

        if (from && to) {
            return value >= from && value <= to;
        }
        if (from) {
            return value >= from;
        }
        if (to) {
            return value <= to;
        }
        return true;
    }

    // Handle number ranges
    if (typeof value === 'number') {
        const min = filterValue.min != null ? filterValue.min : -Infinity;
        const max = filterValue.max != null ? filterValue.max : Infinity;
        return value >= min && value <= max;
    }

    return false;
}

function isIn(value: any, filterValue: any): boolean {
    if (!Array.isArray(filterValue)) return false;

    // Handle arrays in the data
    if (Array.isArray(value)) {
        return value.some(v =>
            filterValue.some(fv =>
                String(v).toLowerCase() === String(fv).toLowerCase()
            )
        );
    }

    // Handle single values
    return filterValue.some(fv =>
        String(value).toLowerCase() === String(fv).toLowerCase()
    );
}

function isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes('-') || value.includes('/');
}

function isNumberString(value: any): boolean {
    if (typeof value !== 'string') return false;
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}

export function getFilterSummary(filters: FilterValue[]): string {
    if (filters.length === 0) return 'No filters applied';
    if (filters.length === 1) return '1 filter applied';
    return `${filters.length} filters applied`;
}

export function serializeFilters(filters: FilterValue[]): string {
    try {
        return JSON.stringify(filters);
    } catch {
        return '[]';
    }
}

export function deserializeFilters(serialized: string): FilterValue[] {
    try {
        const parsed = JSON.parse(serialized);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}