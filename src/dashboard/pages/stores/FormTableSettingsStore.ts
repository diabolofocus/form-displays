// ==============================================
// NEW: src/dashboard/pages/stores/FormTableSettingsStore.ts
// ==============================================

import { makeAutoObservable, runInAction } from 'mobx';
import { FormField, FieldType } from '../../types';

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
    customName?: string;
    columns: ColumnSetting[];
    lastUpdated: string;
}

interface FormTableSettings {
    selectedFormId: string | null;
    formSettings: { [formId: string]: FormSettings };
    initialized: boolean;
}

const DEFAULT_STATE: FormTableSettings = {
    selectedFormId: null,
    formSettings: {},
    initialized: false
};

export class FormTableSettingsStore {
    private settings: FormTableSettings = { ...DEFAULT_STATE };
    public isLoading = false;

    constructor() {
        makeAutoObservable(this);
        // Don't initialize automatically - let it be called explicitly
    }
    public initialize() {
        if (this.settings.initialized) {
            console.log('FormTableSettingsStore: Already initialized, skipping');
            return;
        }

        console.log('FormTableSettingsStore: Initializing...');

        runInAction(() => {
            this.isLoading = true;
        });

        try {
            this.loadSettings();
        } catch (error) {
            console.error('Failed to initialize FormTableSettingsStore:', error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
                this.settings.initialized = true;
            });
        }

        console.log('FormTableSettingsStore: Initialization complete');
    }

    private loadSettings() {
        runInAction(() => {
            try {
                let allFormSettings: FormSettings[] | null = null;
                let selectedFormId: string | null = null;

                // Try window storage first
                if (typeof window !== 'undefined') {
                    console.log('FormTableSettingsStore: Checking storage sources...');
                    console.log('  - window.wixFormDashboardSettings:', !!window.wixFormDashboardSettings);
                    console.log('  - window.wixFormDashboardSettingsBackup:', !!window.wixFormDashboardSettingsBackup);

                    if (window.wixFormDashboardSettings && Array.isArray(window.wixFormDashboardSettings)) {
                        allFormSettings = window.wixFormDashboardSettings;
                        selectedFormId = window.wixCurrentFormId || null;
                        console.log('FormTableSettingsStore: Found primary window storage with', allFormSettings.length, 'settings');
                    }
                    // Try backup if primary failed
                    else if (window.wixFormDashboardSettingsBackup) {
                        try {
                            allFormSettings = JSON.parse(window.wixFormDashboardSettingsBackup);
                            selectedFormId = window.wixCurrentFormId || null;
                            console.log('FormTableSettingsStore: Restored from backup window storage with', allFormSettings?.length || 0, 'settings');
                            // Restore primary storage
                            if (allFormSettings) {
                                window.wixFormDashboardSettings = allFormSettings;
                            }
                        } catch (error) {
                            console.warn('Failed to parse backup settings:', error);
                        }
                    }
                    // Try sessionStorage as last resort
                    else {
                        try {
                            const sessionSettings = sessionStorage.getItem('wixFormDashboardSettings');
                            const sessionFormId = sessionStorage.getItem('wixCurrentFormId');
                            if (sessionSettings) {
                                allFormSettings = JSON.parse(sessionSettings);
                                selectedFormId = sessionFormId || null;
                                console.log('FormTableSettingsStore: Restored from sessionStorage with', allFormSettings?.length || 0, 'settings');
                                // Restore to window storage
                                if (allFormSettings) {
                                    window.wixFormDashboardSettings = allFormSettings;
                                    window.wixFormDashboardSettingsBackup = sessionSettings;
                                }
                                if (selectedFormId) {
                                    window.wixCurrentFormId = selectedFormId;
                                }
                            }
                        } catch (sessionError) {
                            console.warn('Failed to load from sessionStorage:', sessionError);
                        }
                    }
                }

                if (allFormSettings && allFormSettings.length > 0) {
                    // Convert array to object format for our store
                    const formSettingsMap: { [formId: string]: FormSettings } = {};
                    allFormSettings.forEach(setting => {
                        formSettingsMap[setting.formId] = setting;
                        const visibleCount = setting.columns.filter(c => c.visible).length;
                        console.log('FormTableSettingsStore: Loaded settings for form:', setting.formId.slice(0, 8), 'with', visibleCount, '/', setting.columns.length, 'visible columns');
                    });

                    this.settings = {
                        selectedFormId: selectedFormId,
                        formSettings: formSettingsMap,
                        initialized: true
                    };

                    console.log('FormTableSettingsStore: Successfully loaded', Object.keys(formSettingsMap).length, 'form settings from storage');
                } else {
                    this.settings = { ...DEFAULT_STATE, initialized: true };
                    console.log('FormTableSettingsStore: No saved settings found in any storage, using defaults');
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                this.settings = { ...DEFAULT_STATE, initialized: true };
            }
        });
    }

    saveSettings() {
        try {
            if (typeof window !== 'undefined') {
                // Convert our object format back to array for window storage
                const settingsArray = Object.values(this.settings.formSettings);
                window.wixFormDashboardSettings = settingsArray;

                // Also save backup as string
                window.wixFormDashboardSettingsBackup = JSON.stringify(settingsArray);

                // Save selected form
                if (this.settings.selectedFormId) {
                    window.wixCurrentFormId = this.settings.selectedFormId;
                }

                // Additional persistence - save to sessionStorage as well
                try {
                    sessionStorage.setItem('wixFormDashboardSettings', JSON.stringify(settingsArray));
                    sessionStorage.setItem('wixCurrentFormId', this.settings.selectedFormId || '');
                } catch (sessionError) {
                    console.warn('Could not save to sessionStorage:', sessionError);
                }

                console.log('FormTableSettingsStore: Settings saved to window storage and sessionStorage, total forms:', settingsArray.length);
                settingsArray.forEach(setting => {
                    console.log(`  - Form ${setting.formId.slice(0, 8)}: ${setting.columns.filter(c => c.visible).length}/${setting.columns.length} visible columns`);
                });
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Selected form management
    get selectedFormId(): string | null {
        return this.settings.selectedFormId;
    }

    setSelectedFormId(formId: string | null) {
        runInAction(() => {
            console.log('FormTableSettingsStore: Setting selected form ID to:', formId);
            this.settings.selectedFormId = formId;
            this.saveSettings();
        });
    }

    // Form settings management
    getFormSettings(formId: string): FormSettings | null {
        if (!formId) return null;
        return this.settings.formSettings[formId] || null;
    }

    setFormSettings(formId: string, formFields: FormField[]): FormSettings {
        if (!formId || !formFields.length) {
            throw new Error('Invalid formId or formFields');
        }

        runInAction(() => {
            // Check if settings already exist
            let formSettings = this.settings.formSettings[formId];

            if (!formSettings) {
                // Create new settings
                formSettings = this.createDefaultSettings(formId, formFields);
                console.log('FormTableSettingsStore: Created new settings for form:', formId, 'with', formSettings.columns.filter(c => c.visible).length, 'visible columns');
                this.settings.formSettings[formId] = formSettings;
                this.saveSettings();
            } else {
                // Settings exist - merge with current fields but don't overwrite visibility
                formSettings = this.mergeWithCurrentFields(formSettings, formFields);
                console.log('FormTableSettingsStore: Merged existing settings for form:', formId, 'with', formSettings.columns.filter(c => c.visible).length, 'visible columns');
                this.settings.formSettings[formId] = formSettings;
                this.saveSettings();
            }
        });

        return this.settings.formSettings[formId];
    }

    private createDefaultSettings(formId: string, formFields: FormField[]): FormSettings {
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

        // Add form fields with default visibility - show all fields by default
        const fieldColumns: ColumnSetting[] = formFields.map((field, index) => ({
            id: field.name,
            fieldName: field.name,
            label: field.label,
            type: field.type,
            visible: true, // Show all fields by default
            order: index + 1,
            width: this.getDefaultColumnWidth(field)
        }));

        const defaultSettings = {
            formId,
            columns: [createdDateColumn, ...fieldColumns],
            lastUpdated: new Date().toISOString()
        };

        console.log('FormTableSettingsStore: Created default settings:', {
            formId: defaultSettings.formId,
            totalColumns: defaultSettings.columns.length,
            visibleColumns: defaultSettings.columns.filter(c => c.visible).length,
            note: 'All columns visible by default'
        });

        return defaultSettings;
    }

    private mergeWithCurrentFields(savedSettings: FormSettings, currentFields: FormField[]): FormSettings {
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
                // Keep existing settings but update label/type in case they changed
                return {
                    ...existing,
                    label: field.label,
                    type: field.type
                };
            } else {
                // New field - add with default settings (visible by default)
                return {
                    id: field.name,
                    fieldName: field.name,
                    label: field.label,
                    type: field.type,
                    visible: true,
                    order: savedSettings.columns.length + index,
                    width: this.getDefaultColumnWidth(field)
                };
            }
        });

        // Remove columns for fields that no longer exist
        const currentFieldNames = new Set(['_createdDate', ...currentFields.map(f => f.name)]);
        const validColumns = [createdDateColumn, ...fieldColumns].filter(col =>
            currentFieldNames.has(col.fieldName)
        );

        // Sort by order
        validColumns.sort((a, b) => a.order - b.order);

        const mergedSettings = {
            ...savedSettings,
            columns: validColumns.map((col, index) => ({ ...col, order: index })),
            lastUpdated: new Date().toISOString()
        };

        console.log('FormTableSettingsStore: Merged settings result:', {
            formId: mergedSettings.formId,
            totalColumns: mergedSettings.columns.length,
            visibleColumns: mergedSettings.columns.filter(c => c.visible).length
        });

        return mergedSettings;
    }

    private getDefaultColumnWidth(field: FormField): string {
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
        if (fieldName.includes('name') || fieldName.includes('vorname')) return '280px';
        if (fieldName.includes('address') || fieldName.includes('adresse')) return '360px';
        if (fieldName.includes('description')) return '400px';
        if (fieldName.includes('id') || fieldName.includes('guid')) return '200px';

        return '260px';
    }

    updateColumnVisibility(formId: string, fieldName: string, visible: boolean) {
        if (!formId || !this.settings.formSettings[formId]) {
            console.warn('FormTableSettingsStore: Cannot update visibility - no settings for form:', formId);
            return;
        }

        runInAction(() => {
            const formSettings = this.settings.formSettings[formId];
            const updatedColumns = formSettings.columns.map(col =>
                col.fieldName === fieldName ? { ...col, visible } : col
            );

            this.settings.formSettings[formId] = {
                ...formSettings,
                columns: updatedColumns,
                lastUpdated: new Date().toISOString()
            };

            // Force save the settings
            this.saveSettings();
            console.log('FormTableSettingsStore: Updated visibility for', fieldName, ':', visible);
            console.log('FormTableSettingsStore: Settings after update:', this.settings.formSettings[formId]);
        });
    }

    updateColumnWidth(formId: string, fieldName: string, width: string) {
        if (!formId || !this.settings.formSettings[formId]) {
            console.warn('FormTableSettingsStore: Cannot update width - no settings for form:', formId);
            return;
        }

        runInAction(() => {
            const formSettings = this.settings.formSettings[formId];
            const updatedColumns = formSettings.columns.map(col =>
                col.fieldName === fieldName ? { ...col, width: width || undefined } : col
            );

            this.settings.formSettings[formId] = {
                ...formSettings,
                columns: updatedColumns,
                lastUpdated: new Date().toISOString()
            };

            // Force save the settings
            this.saveSettings();
            console.log('FormTableSettingsStore: Updated width for', fieldName, ':', width);
        });
    }

    // Get visible columns for a form
    getVisibleColumns(formId: string): FormField[] {
        if (!formId) return [];

        const formSettings = this.settings.formSettings[formId];
        if (!formSettings) return [];

        const visibleColumns = formSettings.columns
            .filter(col => col.visible)
            .sort((a, b) => a.order - b.order)
            .map(col => ({
                name: col.fieldName,
                label: col.label,
                type: col.type
            }));

        console.log('FormTableSettingsStore: Returning', visibleColumns.length, 'visible columns for form:', formId);
        return visibleColumns;
    }

    // Reset settings for a form
    resetFormToDefaults(formId: string, formFields: FormField[]) {
        if (!formId || !formFields.length) {
            console.warn('FormTableSettingsStore: Cannot reset - invalid formId or formFields');
            return;
        }

        console.log('FormTableSettingsStore: Starting reset to defaults for form:', formId);

        runInAction(() => {
            // Delete existing settings first to ensure clean reset
            if (this.settings.formSettings[formId]) {
                delete this.settings.formSettings[formId];
                console.log('FormTableSettingsStore: Cleared existing settings for form:', formId);
            }

            // Create fresh default settings
            const defaultSettings = this.createDefaultSettings(formId, formFields);
            this.settings.formSettings[formId] = defaultSettings;

            console.log('FormTableSettingsStore: Created new default settings with', defaultSettings.columns.filter(c => c.visible).length, '/', defaultSettings.columns.length, 'visible columns');

            // Save immediately
            this.saveSettings();

            console.log('FormTableSettingsStore: Reset complete for form:', formId);
        });
    }

    // Update column order for a form
    updateColumnOrder(formId: string, reorderedColumns: ColumnSetting[]) {
        if (!formId || !this.settings.formSettings[formId]) {
            console.warn('FormTableSettingsStore: Cannot update order - no settings for form:', formId);
            return;
        }

        runInAction(() => {
            const formSettings = this.settings.formSettings[formId];
            const updatedColumns = reorderedColumns.map((col, index) => ({ ...col, order: index }));

            this.settings.formSettings[formId] = {
                ...formSettings,
                columns: updatedColumns,
                lastUpdated: new Date().toISOString()
            };

            this.saveSettings();
            console.log('FormTableSettingsStore: Updated column order for form:', formId);
        });
    }

    // Update custom form name
    updateFormName(formId: string, customName: string) {
        if (!formId) {
            console.warn('FormTableSettingsStore: Cannot update name - no formId');
            return;
        }

        runInAction(() => {
            if (this.settings.formSettings[formId]) {
                this.settings.formSettings[formId] = {
                    ...this.settings.formSettings[formId],
                    customName: customName.trim() || undefined,
                    lastUpdated: new Date().toISOString()
                };
                this.saveSettings();
                console.log('FormTableSettingsStore: Updated form name for:', formId, 'to:', customName);
            }
        });
    }

    // Get custom form name
    getCustomFormName(formId: string): string | undefined {
        return this.settings.formSettings[formId]?.customName;
    }

    // Utility getters
    get isReady(): boolean {
        return this.settings.initialized;
    }

    get allFormIds(): string[] {
        return Object.keys(this.settings.formSettings);
    }

    // Clear all settings (for debugging)
    clearAllSettings() {
        runInAction(() => {
            this.settings = { ...DEFAULT_STATE, initialized: true };

            // Clear window storage
            if (typeof window !== 'undefined') {
                delete window.wixFormDashboardSettings;
                delete window.wixFormDashboardSettingsBackup;
                delete window.wixCurrentFormId;
            }

            console.log('FormTableSettingsStore: Cleared all settings');
        });
    }
}
// Singleton pattern to ensure only one store instance
let storeInstance: FormTableSettingsStore | null = null;

export const getFormTableSettingsStore = (): FormTableSettingsStore => {
    if (!storeInstance) {
        storeInstance = new FormTableSettingsStore();
        // Initialize synchronously to ensure settings are loaded immediately
        storeInstance.initialize();
    }
    return storeInstance;
};

// Create the singleton instance immediately when this module loads
export const formTableSettingsStore = getFormTableSettingsStore();

// Ensure settings are loaded immediately
if (typeof window !== 'undefined') {
    // Force initialization on module load
    formTableSettingsStore.initialize();
}