// ==============================================
// FIXED: src/dashboard/pages/hooks/useSettings.ts - Proper Form Association
// ==============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FormField, FieldType } from '../types';

export interface ColumnSetting {
    id: string;
    fieldName: string;
    label: string;
    type: FieldType;
    visible: boolean;
    order: number;
    width?: string;
}

export interface FormSettings {
    formId: string;
    columns: ColumnSetting[];
    lastUpdated: string;
}

export const useSettings = (formId: string | null, formFields: FormField[]) => {
    const [settings, setSettings] = useState<FormSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentFormId, setCurrentFormId] = useState<string | null>(null);

    // Reset settings when form changes
    useEffect(() => {
        if (formId !== currentFormId) {
            console.log('useSettings: Form changed from', currentFormId, 'to', formId);
            setCurrentFormId(formId);

            // Clear settings immediately to prevent wrong settings from being used
            setSettings(null);

            // Don't load if no form or no fields
            if (!formId || formFields.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            // Use a longer delay to ensure form selection is stable
            const timeoutId = setTimeout(() => {
                console.log('useSettings: Loading settings after form change delay for:', formId);
                loadSettingsForForm(formId, formFields);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [formId, currentFormId, formFields]);

    // Memoize the visible columns calculation to prevent unnecessary re-renders
    const visibleColumns = useMemo((): FormField[] => {
        console.log('useSettings: getVisibleColumns called for formId:', formId);
        console.log('useSettings: Current settings:', settings ? { formId: settings.formId, columnsCount: settings.columns.length } : null);

        // STRICT CHECK: Only return settings if they match the current form
        if (!settings || !formId || settings.formId !== formId) {
            console.log('useSettings: No settings or form ID mismatch, returning all formFields:', formFields.length);
            console.log('useSettings: Settings formId:', settings?.formId, 'vs Current formId:', formId);
            return formFields;
        }

        const visibleColumnSettings = settings.columns
            .filter(col => {
                console.log(`useSettings: Column ${col.fieldName}: visible=${col.visible}`);
                return col.visible;
            })
            .sort((a, b) => a.order - b.order);

        const visibleFields = visibleColumnSettings.map(col => ({
            name: col.fieldName,
            label: col.label,
            type: col.type
        }));

        console.log('useSettings: Returning visible columns for form', formId, ':', visibleFields.length, 'columns');
        return visibleFields;
    }, [settings, formFields, formId]);

    const loadSettingsForForm = (targetFormId: string, targetFormFields: FormField[]) => {
        if (!targetFormId || targetFormFields.length === 0) {
            console.log('useSettings: Skipping settings load - no formId or formFields');
            setSettings(null);
            setIsLoading(false);
            return;
        }

        try {
            console.log('useSettings: Loading settings for formId:', targetFormId);
            const savedSettings = getStoredSettings();
            console.log('useSettings: All saved settings:', savedSettings);

            const formSettings = savedSettings.find(s => s.formId === targetFormId);
            console.log('useSettings: Found form settings for', targetFormId, ':', formSettings);

            if (formSettings) {
                // Merge with current form fields to handle new/removed fields
                const mergedSettings = mergeWithCurrentFields(formSettings, targetFormFields);
                console.log('useSettings: Using merged settings:', mergedSettings);
                setSettings(mergedSettings);

                // Ensure the merged settings are saved
                storeFormSettings(mergedSettings);
            } else {
                // Create default settings
                console.log('useSettings: No existing settings found, creating defaults for', targetFormId);
                const defaultSettings = createDefaultSettings(targetFormId, targetFormFields);
                console.log('useSettings: Created default settings:', defaultSettings);
                setSettings(defaultSettings);
                // Save the default settings immediately
                storeFormSettings(defaultSettings);
            }
        } catch (error) {
            console.error('useSettings: Error loading settings:', error);
            const defaultSettings = createDefaultSettings(targetFormId, targetFormFields);
            setSettings(defaultSettings);
            storeFormSettings(defaultSettings);
        }

        setIsLoading(false);
    };

    const loadSettings = useCallback(() => {
        loadSettingsForForm(formId || '', formFields);
    }, [formId, formFields]);

    // Store individual form settings
    const storeFormSettings = useCallback((formSettings: FormSettings) => {
        try {
            console.log('useSettings: Storing settings for form:', formSettings.formId);
            const allSettings = getStoredSettings();
            const existingIndex = allSettings.findIndex(s => s.formId === formSettings.formId);

            if (existingIndex >= 0) {
                allSettings[existingIndex] = formSettings;
                console.log('useSettings: Updated existing settings for form:', formSettings.formId);
            } else {
                allSettings.push(formSettings);
                console.log('useSettings: Added new settings for form:', formSettings.formId);
            }

            storeSettings(allSettings);
            console.log('useSettings: All settings after update:', allSettings);
        } catch (error) {
            console.error('useSettings: Error storing form settings:', error);
        }
    }, []);

    // Save settings to memory
    const saveSettings = useCallback((newSettings: FormSettings) => {
        console.log('useSettings: Saving settings:', newSettings);

        // Ensure we're saving settings for the correct form
        if (newSettings.formId !== formId) {
            console.warn('useSettings: Attempted to save settings for wrong form!', {
                settingsFormId: newSettings.formId,
                currentFormId: formId
            });
            return;
        }

        setSettings(newSettings);
        storeFormSettings(newSettings);
    }, [formId, storeFormSettings]);

    // Update column visibility
    const updateColumnVisibility = useCallback((fieldName: string, visible: boolean) => {
        if (!settings || settings.formId !== formId) {
            console.warn('useSettings: Cannot update visibility - no settings or wrong form');
            return;
        }

        console.log('useSettings: Updating column visibility:', fieldName, visible);

        const updatedColumns = settings.columns.map(col =>
            col.fieldName === fieldName ? { ...col, visible } : col
        );

        const updatedSettings: FormSettings = {
            ...settings,
            columns: updatedColumns,
            lastUpdated: new Date().toISOString()
        };

        saveSettings(updatedSettings);
    }, [settings, formId, saveSettings]);

    // Update column order
    const updateColumnOrder = useCallback((reorderedColumns: ColumnSetting[]) => {
        if (!settings || settings.formId !== formId) {
            console.warn('useSettings: Cannot update order - no settings or wrong form');
            return;
        }

        console.log('useSettings: Updating column order');

        const updatedSettings: FormSettings = {
            ...settings,
            columns: reorderedColumns.map((col, index) => ({ ...col, order: index })),
            lastUpdated: new Date().toISOString()
        };

        saveSettings(updatedSettings);
    }, [settings, formId, saveSettings]);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        if (!formId) {
            console.warn('useSettings: Cannot reset - no formId');
            return;
        }

        console.log('useSettings: Resetting to defaults for form:', formId);
        const defaultSettings = createDefaultSettings(formId, formFields);
        saveSettings(defaultSettings);
    }, [formId, formFields, saveSettings]);

    // Load settings when formId or formFields change (initial load or when dependencies change)
    useEffect(() => {
        // Only load if we haven't already loaded for this form in the form change effect
        if (formId === currentFormId && formId && formFields.length > 0 && !settings) {
            console.log('useSettings: Initial loading settings effect triggered for formId:', formId);
            loadSettings();
        }
    }, [loadSettings, formId, currentFormId, settings]);

    // Add explicit save function
    const saveSettingsExplicitly = useCallback(() => {
        if (!settings) {
            console.warn('useSettings: Cannot save explicitly - no settings');
            return false;
        }

        if (settings.formId !== formId) {
            console.warn('useSettings: Cannot save explicitly - form ID mismatch', {
                settingsFormId: settings.formId,
                currentFormId: formId
            });
            return false;
        }

        try {
            storeFormSettings(settings);
            console.log('useSettings: Settings saved explicitly for form:', settings.formId);
            return true;
        } catch (error) {
            console.error('useSettings: Error saving settings explicitly:', error);
            return false;
        }
    }, [settings, formId, storeFormSettings]);

    return {
        settings,
        isLoading,
        updateColumnVisibility,
        updateColumnOrder,
        resetToDefaults,
        visibleColumns, // Return memoized visible columns directly
        saveSettings,
        saveSettingsExplicitly
    };
};

// Use the same pattern as wixCurrentFormId for persistence
declare global {
    interface Window {
        wixFormDashboardSettings?: FormSettings[];
        wixFormDashboardSettingsBackup?: string;
    }
}

function getStoredSettings(): FormSettings[] {
    if (typeof window !== 'undefined') {
        console.log('useSettings: Checking stored settings...');

        // Try primary storage first
        if (window.wixFormDashboardSettings && Array.isArray(window.wixFormDashboardSettings)) {
            const settings = window.wixFormDashboardSettings;
            console.log('useSettings: Found primary storage:', settings.map(s => ({ formId: s.formId, columns: s.columns.length })));

            if (settings.every(s => s.formId && s.columns)) {
                console.log('useSettings: Retrieved valid settings from primary storage:', settings);
                return [...settings];
            } else {
                console.log('useSettings: Primary storage invalid, clearing...');
                delete window.wixFormDashboardSettings;
            }
        }

        // Try backup storage (JSON string)
        if (window.wixFormDashboardSettingsBackup) {
            try {
                const backupSettings = JSON.parse(window.wixFormDashboardSettingsBackup);
                console.log('useSettings: Found backup storage:', backupSettings);

                if (Array.isArray(backupSettings) && backupSettings.every(s => s.formId && s.columns)) {
                    console.log('useSettings: Retrieved valid settings from backup storage:', backupSettings);
                    // Restore to primary storage
                    window.wixFormDashboardSettings = [...backupSettings];
                    return [...backupSettings];
                } else {
                    console.log('useSettings: Backup storage invalid, clearing...');
                    delete window.wixFormDashboardSettingsBackup;
                }
            } catch (error) {
                console.warn('useSettings: Failed to parse backup settings:', error);
                delete window.wixFormDashboardSettingsBackup;
            }
        }
    }

    console.log('useSettings: No valid settings found, returning empty array');
    return [];
}

function storeSettings(settings: FormSettings[]): void {
    if (typeof window !== 'undefined') {
        console.log('useSettings: Storing settings:', settings.map(s => ({ formId: s.formId, columns: s.columns.length, lastUpdated: s.lastUpdated })));

        try {
            // Store in primary location
            window.wixFormDashboardSettings = [...settings];
            console.log('useSettings: Primary storage updated');

            // Store backup as JSON string (more persistent)
            try {
                const jsonString = JSON.stringify(settings);
                window.wixFormDashboardSettingsBackup = jsonString;
                console.log('useSettings: Backup storage updated');
            } catch (jsonError) {
                console.warn('useSettings: Could not create backup settings:', jsonError);
            }

            // Verify storage worked
            if (window.wixFormDashboardSettings && window.wixFormDashboardSettings.length === settings.length) {
                console.log('useSettings: Storage verification successful');
            } else {
                console.error('useSettings: Storage verification failed!');
            }

        } catch (error) {
            console.error('useSettings: Error storing settings:', error);
        }
    } else {
        console.warn('useSettings: Window not available for storage');
    }
}

function createDefaultSettings(formId: string, formFields: FormField[]): FormSettings {
    console.log('useSettings: Creating default settings for form:', formId, 'with fields:', formFields);

    // Always include creation date first
    const createdDateColumn: ColumnSetting = {
        id: '_createdDate',
        fieldName: '_createdDate',
        label: 'Created',
        type: FieldType.DATE,
        visible: true,
        order: 0,
        width: '110px'
    };

    // Add form fields with default visibility and order
    const fieldColumns: ColumnSetting[] = formFields.map((field, index) => ({
        id: field.name,
        fieldName: field.name,
        label: field.label,
        type: field.type,
        visible: true, // All fields visible by default
        order: index + 1, // After creation date
        width: getDefaultColumnWidth(field)
    }));

    const defaultSettings = {
        formId,
        columns: [createdDateColumn, ...fieldColumns],
        lastUpdated: new Date().toISOString()
    };

    console.log('useSettings: Created default settings:', defaultSettings);
    return defaultSettings;
}

function mergeWithCurrentFields(savedSettings: FormSettings, currentFields: FormField[]): FormSettings {
    console.log('useSettings: Merging saved settings with current fields for form:', savedSettings.formId);

    const existingColumns = new Map(savedSettings.columns.map(col => [col.fieldName, col]));

    // Always include creation date
    const createdDateColumn: ColumnSetting = existingColumns.get('_createdDate') || {
        id: '_createdDate',
        fieldName: '_createdDate',
        label: 'Created',
        type: FieldType.DATE,
        visible: true,
        order: 0,
        width: '110px'
    };

    // Process current form fields
    const fieldColumns: ColumnSetting[] = currentFields.map((field, index) => {
        const existing = existingColumns.get(field.name);
        if (existing) {
            // Update label and type in case they changed, but keep visibility and order
            return {
                ...existing,
                label: field.label,
                type: field.type
            };
        } else {
            // New field - add with default settings
            return {
                id: field.name,
                fieldName: field.name,
                label: field.label,
                type: field.type,
                visible: true,
                order: savedSettings.columns.length + index,
                width: getDefaultColumnWidth(field)
            };
        }
    });

    // Remove columns for fields that no longer exist
    const currentFieldNames = new Set(['_createdDate', ...currentFields.map(f => f.name)]);
    const validColumns = [createdDateColumn, ...fieldColumns].filter(col =>
        currentFieldNames.has(col.fieldName)
    );

    // Reorder based on saved order
    validColumns.sort((a, b) => a.order - b.order);

    const mergedSettings = {
        ...savedSettings,
        columns: validColumns.map((col, index) => ({ ...col, order: index })),
        lastUpdated: new Date().toISOString()
    };

    console.log('useSettings: Merged settings:', mergedSettings);
    return mergedSettings;
}

function getDefaultColumnWidth(field: FormField): string {
    const fieldName = field.name.toLowerCase();

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
    if (fieldName.includes('name') || fieldName.includes('vorname') || fieldName.includes('nachname')) {
        return '280px';
    }

    if (fieldName.includes('address') || fieldName.includes('adresse')) {
        return '360px';
    }

    if (fieldName.includes('geschlecht') || fieldName.includes('gender')) {
        return '160px';
    }

    if (fieldName.includes('description') || fieldName.includes('beschreibung')) {
        return '400px';
    }

    if (fieldName.includes('id') || fieldName.includes('guid')) {
        return '200px';
    }

    // Default
    return '260px';
}