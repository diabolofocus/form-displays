// ==============================================
// NEW: src/dashboard/pages/stores/FilterSettingsStore.ts
// ==============================================

import { makeAutoObservable } from 'mobx';
import { FormField, FieldType } from '../../types';

export interface FilterSetting {
    id: string;
    fieldName: string;
    label: string;
    type: FieldType;
    enabled: boolean;
    visible: boolean;
    order: number;
}

export interface FilterSettings {
    formId: string;
    filters: FilterSetting[];
    lastUpdated: string;
}

class FilterSettingsStore {
    formFilters = new Map<string, FilterSettings>();
    selectedFormId: string | null = null;
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
        this.loadSettings();
    }

    setSelectedFormId(formId: string) {
        this.selectedFormId = formId;
    }

    setFormFilters(formId: string, formFields: FormField[]) {
        console.log('FilterSettingsStore: Setting up filters for form:', formId);

        if (!formId || formFields.length === 0) {
            console.warn('FilterSettingsStore: Invalid formId or empty formFields');
            return;
        }

        const existingSettings = this.formFilters.get(formId);

        if (!existingSettings) {
            // Create default filter settings
            const defaultSettings = this.createDefaultSettings(formId, formFields);
            this.formFilters.set(formId, defaultSettings);
            this.saveSettings();
            console.log('FilterSettingsStore: Created default filter settings for form:', formId);
        } else {
            // Merge with existing settings
            const mergedSettings = this.mergeWithCurrentFields(existingSettings, formFields);
            this.formFilters.set(formId, mergedSettings);
            this.saveSettings();
            console.log('FilterSettingsStore: Merged filter settings for form:', formId);
        }
    }

    getFormFilters(formId: string): FilterSettings | null {
        return this.formFilters.get(formId) || null;
    }

    getVisibleFilters(formId: string): FormField[] {
        const settings = this.formFilters.get(formId);
        if (!settings) return [];

        return settings.filters
            .filter(filter => filter.enabled && filter.visible)
            .sort((a, b) => a.order - b.order)
            .map(filter => ({
                name: filter.fieldName,
                label: filter.label,
                type: filter.type
            }));
    }

    updateFilterEnabled(formId: string, fieldName: string, enabled: boolean) {
        const settings = this.formFilters.get(formId);
        if (!settings) return;

        const filter = settings.filters.find(f => f.fieldName === fieldName);
        if (filter) {
            filter.enabled = enabled;
            settings.lastUpdated = new Date().toISOString();
            this.saveSettings();
        }
    }

    updateFilterVisibility(formId: string, fieldName: string, visible: boolean) {
        const settings = this.formFilters.get(formId);
        if (!settings) return;

        const filter = settings.filters.find(f => f.fieldName === fieldName);
        if (filter) {
            filter.visible = visible;
            settings.lastUpdated = new Date().toISOString();
            this.saveSettings();
        }
    }

    updateFilterOrder(formId: string, reorderedFilters: FilterSetting[]) {
        const settings = this.formFilters.get(formId);
        if (!settings) return;

        settings.filters = reorderedFilters.map((filter, index) => ({
            ...filter,
            order: index
        }));
        settings.lastUpdated = new Date().toISOString();
        this.saveSettings();
    }

    resetFormToDefaults(formId: string, formFields: FormField[]) {
        console.log('FilterSettingsStore: Resetting form to defaults:', formId);
        const defaultSettings = this.createDefaultSettings(formId, formFields);
        this.formFilters.set(formId, defaultSettings);
        this.saveSettings();
    }

    saveSettings() {
        try {
            const settingsArray = Array.from(this.formFilters.values());
            if (typeof window !== 'undefined') {
                window.wixFormDashboardFilterSettings = settingsArray;
                window.wixFormDashboardFilterSettingsBackup = JSON.stringify(settingsArray);
                console.log('FilterSettingsStore: Settings saved to memory');
            }
        } catch (error) {
            console.error('FilterSettingsStore: Error saving settings:', error);
        }
    }

    private loadSettings() {
        try {
            if (typeof window !== 'undefined') {
                // Try primary storage first
                if (window.wixFormDashboardFilterSettings && Array.isArray(window.wixFormDashboardFilterSettings)) {
                    const settings = window.wixFormDashboardFilterSettings;
                    settings.forEach(setting => {
                        this.formFilters.set(setting.formId, setting);
                    });
                    console.log('FilterSettingsStore: Loaded settings from primary storage');
                    return;
                }

                // Try backup storage
                if (window.wixFormDashboardFilterSettingsBackup) {
                    const backupSettings = JSON.parse(window.wixFormDashboardFilterSettingsBackup);
                    if (Array.isArray(backupSettings)) {
                        backupSettings.forEach(setting => {
                            this.formFilters.set(setting.formId, setting);
                        });
                        console.log('FilterSettingsStore: Loaded settings from backup storage');
                        return;
                    }
                }
            }
            console.log('FilterSettingsStore: No existing settings found');
        } catch (error) {
            console.warn('FilterSettingsStore: Error loading settings:', error);
        }
    }

    private createDefaultSettings(formId: string, formFields: FormField[]): FilterSettings {
        console.log('FilterSettingsStore: Creating default filter settings for form:', formId);

        const filters: FilterSetting[] = formFields.map((field, index) => ({
            id: field.name,
            fieldName: field.name,
            label: field.label,
            type: field.type,
            enabled: this.shouldEnableByDefault(field.type),
            visible: true,
            order: index
        }));

        return {
            formId,
            filters,
            lastUpdated: new Date().toISOString()
        };
    }

    private mergeWithCurrentFields(existingSettings: FilterSettings, currentFields: FormField[]): FilterSettings {
        console.log('FilterSettingsStore: Merging existing settings with current fields');

        const existingFilters = new Map(existingSettings.filters.map(filter => [filter.fieldName, filter]));
        const currentFieldNames = new Set(currentFields.map(field => field.name));

        // Process current form fields
        const mergedFilters: FilterSetting[] = currentFields.map((field, index) => {
            const existing = existingFilters.get(field.name);
            if (existing) {
                // Update label and type in case they changed, but keep other settings
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
                    enabled: this.shouldEnableByDefault(field.type),
                    visible: true,
                    order: existingSettings.filters.length + index
                };
            }
        });

        // Remove filters for fields that no longer exist
        const validFilters = mergedFilters.filter(filter =>
            currentFieldNames.has(filter.fieldName)
        );

        // Reorder based on saved order
        validFilters.sort((a, b) => a.order - b.order);

        return {
            ...existingSettings,
            filters: validFilters.map((filter, index) => ({ ...filter, order: index })),
            lastUpdated: new Date().toISOString()
        };
    }

    private shouldEnableByDefault(fieldType: FieldType): boolean {
        // Enable filters by default for commonly filtered field types
        const commonlyFilteredTypes = [
            FieldType.TEXT,
            FieldType.EMAIL,
            FieldType.PHONE,
            FieldType.SELECT,
            FieldType.BOOLEAN,
            FieldType.DATE,
            FieldType.NUMBER,
            FieldType.ARRAY
        ];

        return commonlyFilteredTypes.includes(fieldType);
    }
}

// Declare global types
declare global {
    interface Window {
        wixFormDashboardFilterSettings?: FilterSettings[];
        wixFormDashboardFilterSettingsBackup?: string;
    }
}

export const filterSettingsStore = new FilterSettingsStore();