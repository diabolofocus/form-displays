// ==============================================
// FIXED: src/dashboard/pages/hooks/useForms.ts - Better Form Selection Persistence
// ==============================================

import { useState, useEffect, useMemo } from 'react';
import { GenericSubmission, FormInfo, FormField, FieldType } from '../types';
import { formTableSettingsStore } from '../pages/stores/FormTableSettingsStore';



export const useForms = (allSubmissions: GenericSubmission[]) => {
    const [selectedFormId, setSelectedFormIdState] = useState<string | null>(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Extract all available forms from submissions
    const availableForms = useMemo(() => {
        const formsMap = new Map<string, {
            formId: string;
            submissions: GenericSubmission[];
            lastSubmissionDate: string;
        }>();

        allSubmissions.forEach(submission => {
            const formId = submission.formId;
            if (!formsMap.has(formId)) {
                formsMap.set(formId, {
                    formId,
                    submissions: [],
                    lastSubmissionDate: submission._createdDate
                });
            }

            const formData = formsMap.get(formId)!;
            formData.submissions.push(submission);

            // Keep track of the latest submission date
            if (new Date(submission._createdDate) > new Date(formData.lastSubmissionDate)) {
                formData.lastSubmissionDate = submission._createdDate;
            }
        });

        return Array.from(formsMap.values()).map((formData, index) =>
            analyzeFormStructure(formData.formId, formData.submissions, formData.lastSubmissionDate, index)
        ).sort((a, b) => new Date(b.lastSubmissionDate!).getTime() - new Date(a.lastSubmissionDate!).getTime());
    }, [allSubmissions]);

    // Get submissions for selected form
    const selectedFormSubmissions = useMemo(() => {
        if (!selectedFormId) return [];
        return allSubmissions.filter(submission => submission.formId === selectedFormId);
    }, [allSubmissions, selectedFormId]);

    // Get selected form info
    const selectedForm = useMemo(() => {
        return availableForms.find(form => form.formId === selectedFormId) || null;
    }, [availableForms, selectedFormId]);

    // Enhanced form selection function with persistence
    const setSelectedFormId = (formId: string) => {
        console.log('useForms: Setting form ID to:', formId);

        // Store IMMEDIATELY in window for persistence across navigation
        if (typeof window !== 'undefined') {
            window.wixCurrentFormId = formId;
            console.log('useForms: Stored form ID in window IMMEDIATELY:', formId);
        }

        // Also update the store
        formTableSettingsStore.setSelectedFormId(formId);
        setSelectedFormIdState(formId);
    };

    // Force restoration check on every render when forms are available
    useEffect(() => {
        if (availableForms.length === 0) return;

        console.log('useForms: Checking form selection...');
        console.log('useForms: Current selectedFormId:', selectedFormId);
        console.log('useForms: Available forms:', availableForms.map(f => ({ id: f.formId, name: f.name })));

        // Always check window storage first
        if (typeof window !== 'undefined' && window.wixCurrentFormId) {
            const storedFormId = window.wixCurrentFormId;
            const formExists = availableForms.some(form => form.formId === storedFormId);

            console.log('useForms: Found stored form ID:', storedFormId);
            console.log('useForms: Form exists in available forms:', formExists);

            if (formExists && storedFormId !== selectedFormId) {
                console.log('useForms: Restoring form selection from storage:', storedFormId);
                setSelectedFormIdState(storedFormId);
                // Also update the store immediately
                formTableSettingsStore.setSelectedFormId(storedFormId);
                return;
            }
        }

        // If no stored selection or stored selection doesn't exist, auto-select first form
        if (!selectedFormId && availableForms.length > 0) {
            const firstFormId = availableForms[0].formId;
            console.log('useForms: Auto-selecting first form:', firstFormId);
            setSelectedFormIdState(firstFormId);
            if (typeof window !== 'undefined') {
                window.wixCurrentFormId = firstFormId;
            }
        }

        // Validate current selection still exists
        if (selectedFormId && !availableForms.some(form => form.formId === selectedFormId)) {
            console.log('useForms: Current selection invalid, resetting');
            const firstFormId = availableForms[0].formId;
            setSelectedFormIdState(firstFormId);
            if (typeof window !== 'undefined') {
                window.wixCurrentFormId = firstFormId;
            }
        }
    }, [availableForms, selectedFormId]);

    // Reset when submissions change significantly
    useEffect(() => {
        if (allSubmissions.length === 0) {
            setSelectedFormIdState(null);
            if (typeof window !== 'undefined') {
                delete window.wixCurrentFormId;
            }
        }
    }, [allSubmissions.length]);

    // Debug logging
    useEffect(() => {
        console.log('useForms: Current state:', {
            selectedFormId,
            availableFormsCount: availableForms.length,
            selectedFormSubmissionsCount: selectedFormSubmissions.length,
            windowFormId: typeof window !== 'undefined' ? window.wixCurrentFormId : 'undefined'
        });
    }, [selectedFormId, availableForms.length, selectedFormSubmissions.length]);

    // Apply custom names from the store
    const availableFormsWithCustomNames = useMemo(() => {
        return availableForms.map(form => ({
            ...form,
            name: formTableSettingsStore.getCustomFormName(form.formId) || form.name
        }));
    }, [availableForms]);

    return {
        availableForms: availableFormsWithCustomNames,
        selectedFormId,
        setSelectedFormId,
        selectedForm: availableFormsWithCustomNames.find(f => f.formId === selectedFormId) || null,
        selectedFormSubmissions
    };
};

// Rest of the functions remain the same...
function analyzeFormStructure(formId: string, submissions: GenericSubmission[], lastSubmissionDate: string, formIndex: number = 0): FormInfo {
    const fieldMap = new Map<string, {
        name: string;
        values: any[];
        types: Set<string>;
    }>();

    // Analyze all submission fields
    submissions.forEach(submission => {
        if (submission.submissions) {
            Object.entries(submission.submissions).forEach(([fieldName, value]) => {
                if (!fieldMap.has(fieldName)) {
                    fieldMap.set(fieldName, {
                        name: fieldName,
                        values: [],
                        types: new Set()
                    });
                }

                const fieldData = fieldMap.get(fieldName)!;
                fieldData.values.push(value);
                fieldData.types.add(getValueType(value));
            });
        }
    });

    // Convert to FormField objects
    const fields: FormField[] = Array.from(fieldMap.entries()).map(([fieldName, fieldData]) => {
        const type = inferFieldType(fieldName, fieldData.values, fieldData.types);
        const label = generateFieldLabel(fieldName);
        const sampleValues = getUniqueSampleValues(fieldData.values);

        return {
            name: fieldName,
            label,
            type,
            sampleValues,
            options: type === FieldType.SELECT ? getSelectOptions(fieldData.values) : undefined
        };
    }).sort((a, b) => {
        // Sort fields by priority (common fields first)
        const priorityA = getFieldPriority(a.name);
        const priorityB = getFieldPriority(b.name);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.label.localeCompare(b.label);
    });

    return {
        formId,
        name: generateFormName(formId, fields, formIndex),
        submissionCount: submissions.length,
        fields,
        lastSubmissionDate
    };
}

// Get JavaScript type of value
function getValueType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

// Infer field type from field name and values
function inferFieldType(fieldName: string, values: any[], types: Set<string>): FieldType {
    const name = fieldName.toLowerCase();
    const nonNullValues = values.filter(v => v != null && v !== '');

    // Check field name patterns
    if (name.includes('email')) return FieldType.EMAIL;
    if (name.includes('phone') || name.includes('telefon')) return FieldType.PHONE;
    if (name.includes('date') || name.includes('datum')) return FieldType.DATE;
    if (name.includes('url') || name.includes('website')) return FieldType.URL;
    if (name.includes('beschreibung') || name.includes('kommentar') || name.includes('notiz') || name.includes('text')) {
        return FieldType.TEXTAREA;
    }

    // Check value patterns
    if (types.has('boolean')) return FieldType.BOOLEAN;
    if (types.has('array')) return FieldType.ARRAY;
    if (types.has('object')) return FieldType.OBJECT;

    // Check for email pattern in values
    if (nonNullValues.some(v => typeof v === 'string' && /\S+@\S+\.\S+/.test(v))) {
        return FieldType.EMAIL;
    }

    // Check for date pattern in values
    if (nonNullValues.some(v => typeof v === 'string' && !isNaN(Date.parse(v)))) {
        return FieldType.DATE;
    }

    // Check for phone pattern in values
    if (nonNullValues.some(v => typeof v === 'string' && /^[\+\d\s\-\(\)]+$/.test(v) && v.length > 5)) {
        return FieldType.PHONE;
    }

    // Check for select field (limited unique values)
    const uniqueValues = new Set(nonNullValues.filter(v => typeof v === 'string'));
    if (uniqueValues.size <= 10 && uniqueValues.size >= 2 && nonNullValues.length > uniqueValues.size * 2) {
        return FieldType.SELECT;
    }

    if (types.has('number')) return FieldType.NUMBER;

    return FieldType.TEXT;
}

// Generate human-readable field label
function generateFieldLabel(fieldName: string): string {
    // Convert field name to readable label
    let label = fieldName
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase();

    // Capitalize first letter of each word
    label = label.replace(/\b\w/g, l => l.toUpperCase());

    // Handle common field name patterns
    const mappings: Record<string, string> = {
        'email 726a': 'E-Mail',
        'name 1': 'Nachname',
        'vorname': 'Vorname',
        'geburtsdatum': 'Geburtsdatum',
        'geschlecht': 'Geschlecht',
        'date 5bd8': 'Datum',
        'address 51bd': 'Adresse',
        'telefon': 'Telefon'
    };

    return mappings[label.toLowerCase()] || label;
}

// Get field priority for sorting
function getFieldPriority(fieldName: string): number {
    const priorityFields = [
        'vorname', 'name_1', 'email', 'telefon', 'geburtsdatum', 'geschlecht',
        'address', 'date', '_createdDate', '_updatedDate'
    ];

    const index = priorityFields.findIndex(field =>
        fieldName.toLowerCase().includes(field.toLowerCase())
    );

    return index >= 0 ? index : 999;
}

// Get unique sample values for a field
function getUniqueSampleValues(values: any[]): any[] {
    const nonNullValues = values.filter(v => v != null && v !== '');
    const uniqueValues = Array.from(new Set(nonNullValues.map(v => JSON.stringify(v))))
        .map(v => JSON.parse(v))
        .slice(0, 10); // Limit to 10 sample values

    return uniqueValues;
}

// Get select options from values
function getSelectOptions(values: any[]): string[] {
    const stringValues = values
        .filter(v => typeof v === 'string' && v.trim() !== '')
        .map(v => v.trim());

    const uniqueValues = Array.from(new Set(stringValues))
        .sort()
        .slice(0, 20); // Limit to 20 options

    return uniqueValues;
}

// Generate simple form name with incrementing number
function generateFormName(formId: string, fields: FormField[], formIndex: number): string {
    return `Form ${formIndex + 1}`;
}