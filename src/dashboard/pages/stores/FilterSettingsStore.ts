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
    visible: boolean;
    order: number;
    enabled: boolean; // Whether this filter is enabled for use
}

export interface FilterFormSettings {
    formId: string;
    filters: FilterSetting[];
    lastUpdated: string;
}

class FilterSettingsStore {
    private settings: Map<string, FilterFormSettings> = new Map();
    selectedFormId: string | null = null;
    isLoading: boolean = false;

    constructor() {
        makeAutoObservable(this);
        this.loadFromStorage();
    }

    setSelectedFormId(formId: string) {
        this.selectedFormId = formId;
    }

    setFormFilters(formId: string, formFields: FormField[]) {
        if (!formId || formFields.length === 0) return;

        const existingSettings = this.settings.get(formId);

        if (existingSettings) {
            // Merge with existing settings
            const mergedSettings = this.mergeWithCurrentFields(existingSettings, formFields);
            this.settings.set(formId, mergedSettings);
        } else {
            // Create default settings
            const defaultSettings = this.createDefaultFilterSettings(formId, formFields);
            this.settings.set(formId, defaultSettings);
        }

        this.saveToStorage();
    }

    getFormFilters(formId: string): FilterFormSettings | null {
        return this.settings.get(formId) || null;
    }

    getVisibleFilters(formId: string): FormField[] {
        const filterSettings = this.settings.get(formId);
        if (!filterSettings) return [];

        return filterSettings.filters
            .filter(filter => filter.visible && filter.enabled)
            .sort((a, b) => a.order - b.order)
            .map(filter => ({
                name: filter.fieldName,
                label: filter.label,
                type: filter.type
            }));
    }

    updateFilterVisibility(formId: string, fieldName: string, visible: boolean) {
        const filterSettings = this.settings.get(formId);
        if (!filterSettings) return;

        const updatedFilters = filterSettings.filters.map(filter =>
            filter.fieldName === fieldName ? { ...filter, visible } : filter
        );

        this.settings.set(formId, {
            ...filterSettings,
            filters: updatedFilters,
            lastUpdated: new Date().toISOString()
        });

        this.saveToStorage();
    }

    updateFilterEnabled(formId: string, fieldName: string, enabled: boolean) {
        const filterSettings = this.settings.get(formId);
        if (!filterSettings) return;

        const updatedFilters = filterSettings.filters.map(filter =>
            filter.fieldName === fieldName ? { ...filter, enabled } : filter
        );

        this.settings.set(formId, {
            ...filterSettings,
            filters: updatedFilters,
            lastUpdated: new Date().toISOString()
        });

        this.saveToStorage();
    }

    updateFilterOrder(formId: string, reorderedFilters: FilterSetting[]) {
        const filterSettings = this.settings.get(formId);
        if (!filterSettings) return;

        const updatedFilters = reorderedFilters.map((filter, index) => ({
            ...filter,
            order: index
        }));

        this.settings.set(formId, {
            ...filterSettings,
            filters: updatedFilters,
            lastUpdated: new Date().toISOString()
        });

        this.saveToStorage();
    }

    resetFormToDefaults(formId: string, formFields: FormField[]) {
        if (!formId || formFields.length === 0) return;

        const defaultSettings = this.createDefaultFilterSettings(formId, formFields);
        this.settings.set(formId, defaultSettings);
        this.saveToStorage();
    }

    private createDefaultFilterSettings(formId: string, formFields: FormField[]): FilterFormSettings {
        const filterSettings: FilterSetting[] = formFields
            .filter(field => this.isFilterableFieldType(field.type))
            .map((field, index) => ({
                id: field.name,
                fieldName: field.name,
                label: field.label,
                type: field.type,
                visible: true,
                order: index,
                enabled: true
            }));

        return {
            formId,
            filters: filterSettings,
            lastUpdated: new Date().toISOString()
        };
    }

    private mergeWithCurrentFields(savedSettings: FilterFormSettings, currentFields: FormField[]): FilterFormSettings {
        const existingFilters = new Map(savedSettings.filters.map(filter => [filter.fieldName, filter]));

        // Only include filterable fields
        const filterableFields = currentFields.filter(field => this.isFilterableFieldType(field.type));

        const mergedFilters: FilterSetting[] = filterableFields.map((field, index) => {
            const existing = existingFilters.get(field.name);
            if (existing) {
                return {
                    ...existing,
                    label: field.label, // Update label in case it changed
                    type: field.type    // Update type in case it changed
                };
            } else {
                // New field - add with default settings
                return {
                    id: field.name,
                    fieldName: field.name,
                    label: field.label,
                    type: field.type,
                    visible: true,
                    order: savedSettings.filters.length + index,
                    enabled: true
                };
            }
        });

        // Remove filters for fields that no longer exist
        const currentFieldNames = new Set(filterableFields.map(f => f.name));
        const validFilters = mergedFilters.filter(filter => currentFieldNames.has(filter.fieldName));

        // Reorder based on saved order
        validFilters.sort((a, b) => a.order - b.order);

        return {
            ...savedSettings,
            filters: validFilters.map((filter, index) => ({ ...filter, order: index })),
            lastUpdated: new Date().toISOString()
        };
    }

    private isFilterableFieldType(type: FieldType): boolean {
        // Exclude complex types that are hard to filter
        const filterableTypes = [
            FieldType.TEXT,
            FieldType.EMAIL,
            FieldType.PHONE,
            FieldType.DATE,
            FieldType.NUMBER,
            FieldType.BOOLEAN,
            FieldType.SELECT,
            FieldType.URL
        ];

        return filterableTypes.includes(type);
    }

    saveSettings() {
        this.saveToStorage();
    }

    private saveToStorage() {
        if (typeof window !== 'undefined') {
            try {
                const settingsArray = Array.from(this.settings.values());
                window.wixFilterDashboardSettings = [...settingsArray];

                // Also store as JSON backup
                window.wixFilterDashboardSettingsBackup = JSON.stringify(settingsArray);
            } catch (error) {
                console.error('FilterSettingsStore: Error saving to storage:', error);
            }
        }
    }

    private loadFromStorage() {
        if (typeof window !== 'undefined') {
            try {
                // Try primary storage first
                if (window.wixFilterDashboardSettings && Array.isArray(window.wixFilterDashboardSettings)) {
                    const settings = window.wixFilterDashboardSettings;
                    if (settings.every(s => s.formId && s.filters)) {
                        settings.forEach(setting => {
                            this.settings.set(setting.formId, { ...setting });
                        });
                        return;
                    }
                }

                // Try backup storage
                if (window.wixFilterDashboardSettingsBackup) {
                    const backupSettings = JSON.parse(window.wixFilterDashboardSettingsBackup);
                    if (Array.isArray(backupSettings) && backupSettings.every(s => s.formId && s.filters)) {
                        backupSettings.forEach(setting => {
                            this.settings.set(setting.formId, { ...setting });
                        });
                        // Restore to primary storage
                        window.wixFilterDashboardSettings = [...backupSettings];
                    }
                }
            } catch (error) {
                console.error('FilterSettingsStore: Error loading from storage:', error);
            }
        }
    }
}

// Global store instance
export const filterSettingsStore = new FilterSettingsStore();

// Global interface declaration
declare global {
    interface Window {
        wixFilterDashboardSettings?: FilterFormSettings[];
        wixFilterDashboardSettingsBackup?: string;
    }
}