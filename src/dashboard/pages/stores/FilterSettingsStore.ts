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
}

export interface FilterSettings {
    formId: string;
    filters: FilterSetting[];
    lastUpdated: string;
}

class FilterSettingsStore {
    private settings: { [formId: string]: FilterSettings } = {};
    selectedFormId: string | null = null;
    isLoading = false;
    initialized = false;

    constructor() {
        makeAutoObservable(this);
        this.initialize();
    }

    initialize() {
        if (this.initialized) {
            console.log('FilterSettingsStore: Already initialized, skipping');
            return;
        }

        console.log('FilterSettingsStore: Initializing...');

        try {
            this.loadSettings();
        } catch (error) {
            console.error('Failed to initialize FilterSettingsStore:', error);
        } finally {
            this.initialized = true;
        }

        console.log('FilterSettingsStore: Initialization complete');
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

        const existingSettings = this.settings[formId];

        if (!existingSettings) {
            // Create default filter settings
            const defaultSettings = this.createDefaultSettings(formId, formFields);
            this.settings[formId] = defaultSettings;
            this.saveSettings();
            console.log('FilterSettingsStore: Created default filter settings for form:', formId);
        } else {
            // Merge with existing settings
            const mergedSettings = this.mergeWithCurrentFields(existingSettings, formFields);
            this.settings[formId] = mergedSettings;
            this.saveSettings();
            console.log('FilterSettingsStore: Merged filter settings for form:', formId);
        }
    }

    getFormFilters(formId: string): FilterSettings | null {
        return this.settings[formId] || null;
    }

    getVisibleFilters(formId: string): FormField[] {
        const settings = this.settings[formId];
        if (!settings) return [];

        return settings.filters
            .filter(filter => filter.visible)
            .sort((a, b) => a.order - b.order)
            .map(filter => ({
                name: filter.fieldName,
                label: filter.label,
                type: filter.type
            }));
    }

    updateFilterEnabled(formId: string, fieldName: string, enabled: boolean) {
        // Redirect to updateFilterVisibility for backward compatibility
        this.updateFilterVisibility(formId, fieldName, enabled);
    }

    updateFilterVisibility(formId: string, fieldName: string, visible: boolean) {
        if (!formId || !this.settings[formId]) {
            console.warn('FilterSettingsStore: Cannot update visibility - no settings for form:', formId);
            return;
        }

        const settings = this.settings[formId];
        const filter = settings.filters.find(f => f.fieldName === fieldName);
        if (filter) {
            filter.visible = visible;
            settings.lastUpdated = new Date().toISOString();
            this.saveSettings();
            console.log('FilterSettingsStore: Updated visibility for', fieldName, ':', visible);
        }
    }

    updateFilterOrder(formId: string, reorderedFilters: FilterSetting[]) {
        if (!formId || !this.settings[formId]) {
            console.warn('FilterSettingsStore: Cannot update order - no settings for form:', formId);
            return;
        }

        const settings = this.settings[formId];
        settings.filters = reorderedFilters.map((filter, index) => ({
            ...filter,
            order: index
        }));
        settings.lastUpdated = new Date().toISOString();
        this.saveSettings();
        console.log('FilterSettingsStore: Updated filter order for form:', formId);
    }

    resetFormToDefaults(formId: string, formFields: FormField[]) {
        console.log('FilterSettingsStore: Resetting form to defaults:', formId);

        // Delete existing settings first
        if (this.settings[formId]) {
            delete this.settings[formId];
            console.log('FilterSettingsStore: Cleared existing settings for form:', formId);
        }

        const defaultSettings = this.createDefaultSettings(formId, formFields);
        this.settings[formId] = defaultSettings;
        this.saveSettings();
        console.log('FilterSettingsStore: Reset complete for form:', formId);
    }

    saveSettings() {
        try {
            if (typeof window !== 'undefined') {
                // Convert object format to array for storage
                const settingsArray = Object.values(this.settings);
                window.wixFormDashboardFilterSettings = settingsArray;
                window.wixFormDashboardFilterSettingsBackup = JSON.stringify(settingsArray);

                // Additional persistence - save to sessionStorage
                try {
                    sessionStorage.setItem('wixFormDashboardFilterSettings', JSON.stringify(settingsArray));
                } catch (sessionError) {
                    console.warn('Could not save filter settings to sessionStorage:', sessionError);
                }

                console.log('FilterSettingsStore: Settings saved to storage, total forms:', settingsArray.length);
                settingsArray.forEach(setting => {
                    console.log(`  - Form ${setting.formId.slice(0, 8)}: ${setting.filters.filter(f => f.visible).length}/${setting.filters.length} visible filters`);
                });
            }
        } catch (error) {
            console.error('FilterSettingsStore: Error saving settings:', error);
        }
    }

    private loadSettings() {
        try {
            let allFilterSettings: FilterSettings[] | null = null;

            // Try window storage first
            if (typeof window !== 'undefined') {
                console.log('FilterSettingsStore: Checking storage sources...');
                console.log('  - window.wixFormDashboardFilterSettings:', !!window.wixFormDashboardFilterSettings);
                console.log('  - window.wixFormDashboardFilterSettingsBackup:', !!window.wixFormDashboardFilterSettingsBackup);

                if (window.wixFormDashboardFilterSettings && Array.isArray(window.wixFormDashboardFilterSettings)) {
                    allFilterSettings = window.wixFormDashboardFilterSettings;
                    console.log('FilterSettingsStore: Found primary window storage with', allFilterSettings.length, 'settings');
                }
                // Try backup if primary failed
                else if (window.wixFormDashboardFilterSettingsBackup) {
                    try {
                        allFilterSettings = JSON.parse(window.wixFormDashboardFilterSettingsBackup);
                        console.log('FilterSettingsStore: Restored from backup window storage with', allFilterSettings?.length || 0, 'settings');
                        // Restore primary storage
                        if (allFilterSettings) {
                            window.wixFormDashboardFilterSettings = allFilterSettings;
                        }
                    } catch (error) {
                        console.warn('Failed to parse backup filter settings:', error);
                    }
                }
                // Try sessionStorage as last resort
                else {
                    try {
                        const sessionSettings = sessionStorage.getItem('wixFormDashboardFilterSettings');
                        if (sessionSettings) {
                            allFilterSettings = JSON.parse(sessionSettings);
                            console.log('FilterSettingsStore: Restored from sessionStorage with', allFilterSettings?.length || 0, 'settings');
                            // Restore to window storage
                            if (allFilterSettings) {
                                window.wixFormDashboardFilterSettings = allFilterSettings;
                                window.wixFormDashboardFilterSettingsBackup = sessionSettings;
                            }
                        }
                    } catch (sessionError) {
                        console.warn('Failed to load filter settings from sessionStorage:', sessionError);
                    }
                }
            }

            if (allFilterSettings && allFilterSettings.length > 0) {
                // Convert array to object format for our store
                const filterSettingsMap: { [formId: string]: FilterSettings } = {};
                allFilterSettings.forEach(setting => {
                    filterSettingsMap[setting.formId] = setting;
                    const visibleCount = setting.filters.filter(f => f.visible).length;
                    console.log('FilterSettingsStore: Loaded filter settings for form:', setting.formId.slice(0, 8), 'with', visibleCount, '/', setting.filters.length, 'visible filters');
                });

                this.settings = filterSettingsMap;
                console.log('FilterSettingsStore: Successfully loaded', Object.keys(filterSettingsMap).length, 'filter settings from storage');
            } else {
                console.log('FilterSettingsStore: No saved filter settings found in any storage, using defaults');
            }
        } catch (error) {
            console.error('Failed to load filter settings:', error);
        }
    }

    private createDefaultSettings(formId: string, formFields: FormField[]): FilterSettings {
        console.log('FilterSettingsStore: Creating default filter settings for form:', formId);

        const filters: FilterSetting[] = formFields.map((field, index) => ({
            id: field.name,
            fieldName: field.name,
            label: field.label,
            type: field.type,
            visible: this.shouldBeVisibleByDefault(field.type),
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
                    visible: this.shouldBeVisibleByDefault(field.type),
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

    private shouldBeVisibleByDefault(fieldType: FieldType): boolean {
        // Show filters by default for commonly filtered field types
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