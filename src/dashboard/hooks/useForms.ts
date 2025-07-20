// ==============================================
// NEW: src/dashboard/pages/hooks/useForms.ts
// ==============================================

import { useState, useEffect, useMemo } from 'react';
import { GenericSubmission, FormInfo, FormField, FieldType } from '../types';

export const useForms = (allSubmissions: GenericSubmission[]) => {
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

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

        return Array.from(formsMap.values()).map(formData =>
            analyzeFormStructure(formData.formId, formData.submissions, formData.lastSubmissionDate)
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

    // Auto-select the form with the most submissions if none selected
    useEffect(() => {
        if (!selectedFormId && availableForms.length > 0) {
            setSelectedFormId(availableForms[0].formId);
        }
    }, [availableForms, selectedFormId]);

    return {
        availableForms,
        selectedFormId,
        setSelectedFormId,
        selectedForm,
        selectedFormSubmissions
    };
};

// Analyze form structure from submissions
function analyzeFormStructure(formId: string, submissions: GenericSubmission[], lastSubmissionDate: string): FormInfo {
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
        name: generateFormName(formId, fields),
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

// Generate form name based on formId and fields
function generateFormName(formId: string, fields: FormField[]): string {
    // Try to find a descriptive field that might indicate form purpose
    const nameFields = fields.filter(field =>
        field.name.toLowerCase().includes('title') ||
        field.name.toLowerCase().includes('name') ||
        field.name.toLowerCase().includes('bezeichnung')
    );

    if (nameFields.length > 0) {
        const titleField = nameFields[0];
        if (titleField.sampleValues && titleField.sampleValues.length > 0) {
            const sampleTitle = titleField.sampleValues[0];
            if (typeof sampleTitle === 'string' && sampleTitle.length < 50) {
                return `${sampleTitle} (${formId.slice(0, 8)})`;
            }
        }
    }

    // Fallback: use formId with field count
    return `Form ${formId.slice(0, 8)} (${fields.length} fields)`;
}