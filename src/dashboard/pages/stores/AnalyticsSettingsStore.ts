// ==============================================
// NEW: src/dashboard/pages/stores/AnalyticsSettingsStore.ts
// ==============================================

import { makeAutoObservable, runInAction } from 'mobx';
import { FormField, FieldType } from '../../types';

export interface AnalyticSetting {
    id: string;
    type: AnalyticType;
    fieldName?: string; // For field-specific analytics
    label: string;
    visible: boolean;
    order: number;
    chartType?: ChartType;
    options?: AnalyticOptions;
}

export enum AnalyticType {
    TOTAL_SUBMISSIONS = 'total_submissions',
    SUBMISSIONS_OVER_TIME = 'submissions_over_time',
    FIELD_DISTRIBUTION = 'field_distribution',
    FIELD_STATS = 'field_stats',
    TOP_VALUES = 'top_values',
    COMPLETION_RATE = 'completion_rate'
}

export enum ChartType {
    PIE = 'pie',
    BAR = 'bar',
    LINE = 'line',
    STAT_CARD = 'stat_card'
}

export interface AnalyticOptions {
    timeGranularity?: 'day' | 'week' | 'month';
    topCount?: number;
    showPercentages?: boolean;
}

export interface AnalyticsSettings {
    formId: string;
    analytics: AnalyticSetting[];
    lastUpdated: string;
}

interface AnalyticsSettingsState {
    selectedFormId: string | null;
    analyticsSettings: { [formId: string]: AnalyticsSettings };
    initialized: boolean;
}

const DEFAULT_STATE: AnalyticsSettingsState = {
    selectedFormId: null,
    analyticsSettings: {},
    initialized: false
};

export class AnalyticsSettingsStore {
    private settings: AnalyticsSettingsState = { ...DEFAULT_STATE };
    public isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    public initialize() {
        if (this.settings.initialized) {
            console.log('AnalyticsSettingsStore: Already initialized, skipping');
            return;
        }

        console.log('AnalyticsSettingsStore: Initializing...');

        runInAction(() => {
            this.isLoading = true;
        });

        try {
            this.loadSettings();
        } catch (error) {
            console.error('Failed to initialize AnalyticsSettingsStore:', error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
                this.settings.initialized = true;
            });
        }

        console.log('AnalyticsSettingsStore: Initialization complete');
    }

    private loadSettings() {
        runInAction(() => {
            try {
                let allAnalyticsSettings: AnalyticsSettings[] | null = null;
                let selectedFormId: string | null = null;

                // Try window storage first
                if (typeof window !== 'undefined') {
                    console.log('AnalyticsSettingsStore: Checking storage sources...');

                    if (window.wixFormDashboardAnalyticsSettings && Array.isArray(window.wixFormDashboardAnalyticsSettings)) {
                        allAnalyticsSettings = window.wixFormDashboardAnalyticsSettings;
                        selectedFormId = window.wixCurrentFormId || null;
                        console.log('AnalyticsSettingsStore: Found primary window storage with', allAnalyticsSettings.length, 'settings');
                    }
                    // Try backup
                    else if (window.wixFormDashboardAnalyticsSettingsBackup) {
                        try {
                            allAnalyticsSettings = JSON.parse(window.wixFormDashboardAnalyticsSettingsBackup);
                            selectedFormId = window.wixCurrentFormId || null;
                            console.log('AnalyticsSettingsStore: Restored from backup window storage');
                            if (allAnalyticsSettings) {
                                window.wixFormDashboardAnalyticsSettings = allAnalyticsSettings;
                            }
                        } catch (error) {
                            console.warn('Failed to parse backup analytics settings:', error);
                        }
                    }
                    // Try sessionStorage
                    else {
                        try {
                            const sessionSettings = sessionStorage.getItem('wixFormDashboardAnalyticsSettings');
                            if (sessionSettings) {
                                allAnalyticsSettings = JSON.parse(sessionSettings);
                                selectedFormId = window.wixCurrentFormId || null;
                                console.log('AnalyticsSettingsStore: Restored from sessionStorage');
                                if (allAnalyticsSettings) {
                                    window.wixFormDashboardAnalyticsSettings = allAnalyticsSettings;
                                    window.wixFormDashboardAnalyticsSettingsBackup = sessionSettings;
                                }
                            }
                        } catch (sessionError) {
                            console.warn('Failed to load analytics settings from sessionStorage:', sessionError);
                        }
                    }
                }

                if (allAnalyticsSettings && allAnalyticsSettings.length > 0) {
                    const analyticsSettingsMap: { [formId: string]: AnalyticsSettings } = {};
                    allAnalyticsSettings.forEach(setting => {
                        analyticsSettingsMap[setting.formId] = setting;
                    });

                    this.settings = {
                        selectedFormId: selectedFormId,
                        analyticsSettings: analyticsSettingsMap,
                        initialized: true
                    };

                    console.log('AnalyticsSettingsStore: Successfully loaded', Object.keys(analyticsSettingsMap).length, 'analytics settings from storage');
                } else {
                    this.settings = { ...DEFAULT_STATE, initialized: true };
                    console.log('AnalyticsSettingsStore: No saved analytics settings found, using defaults');
                }
            } catch (error) {
                console.error('Failed to load analytics settings:', error);
                this.settings = { ...DEFAULT_STATE, initialized: true };
            }
        });
    }

    saveSettings() {
        try {
            if (typeof window !== 'undefined') {
                const settingsArray = Object.values(this.settings.analyticsSettings);
                window.wixFormDashboardAnalyticsSettings = settingsArray;
                window.wixFormDashboardAnalyticsSettingsBackup = JSON.stringify(settingsArray);

                if (this.settings.selectedFormId) {
                    window.wixCurrentFormId = this.settings.selectedFormId;
                }

                try {
                    sessionStorage.setItem('wixFormDashboardAnalyticsSettings', JSON.stringify(settingsArray));
                } catch (sessionError) {
                    console.warn('Could not save analytics settings to sessionStorage:', sessionError);
                }

                console.log('AnalyticsSettingsStore: Settings saved, total forms:', settingsArray.length);
            }
        } catch (error) {
            console.error('Failed to save analytics settings:', error);
        }
    }

    // Selected form management
    get selectedFormId(): string | null {
        return this.settings.selectedFormId;
    }

    setSelectedFormId(formId: string | null) {
        runInAction(() => {
            console.log('AnalyticsSettingsStore: Setting selected form ID to:', formId);
            this.settings.selectedFormId = formId;
            this.saveSettings();
        });
    }

    // Analytics settings management
    getAnalyticsSettings(formId: string): AnalyticsSettings | null {
        if (!formId) return null;
        return this.settings.analyticsSettings[formId] || null;
    }

    setAnalyticsSettings(formId: string, formFields: FormField[]): AnalyticsSettings {
        if (!formId || !formFields) {
            throw new Error('Invalid formId or formFields');
        }

        runInAction(() => {
            let analyticsSettings = this.settings.analyticsSettings[formId];

            if (!analyticsSettings) {
                analyticsSettings = this.createDefaultSettings(formId, formFields);
                console.log('AnalyticsSettingsStore: Created new analytics settings for form:', formId);
                this.settings.analyticsSettings[formId] = analyticsSettings;
                this.saveSettings();
            } else {
                analyticsSettings = this.mergeWithCurrentFields(analyticsSettings, formFields);
                console.log('AnalyticsSettingsStore: Merged existing analytics settings for form:', formId);
                this.settings.analyticsSettings[formId] = analyticsSettings;
                this.saveSettings();
            }
        });

        return this.settings.analyticsSettings[formId];
    }

    private createDefaultSettings(formId: string, formFields: FormField[]): AnalyticsSettings {
        const analytics: AnalyticSetting[] = [];
        let order = 0;

        // Always add total submissions
        analytics.push({
            id: 'total_submissions',
            type: AnalyticType.TOTAL_SUBMISSIONS,
            label: 'Total Submissions',
            visible: true,
            order: order++,
            chartType: ChartType.STAT_CARD
        });

        // Add submissions over time
        analytics.push({
            id: 'submissions_over_time',
            type: AnalyticType.SUBMISSIONS_OVER_TIME,
            label: 'Submissions Over Time',
            visible: true,
            order: order++,
            chartType: ChartType.LINE,
            options: {
                timeGranularity: 'day'
            }
        });

        // Add field-specific analytics based on field types
        formFields.forEach(field => {
            const analyticId = `${field.name}_analytics`;

            switch (field.type) {
                case FieldType.SELECT:
                case FieldType.BOOLEAN:
                    analytics.push({
                        id: analyticId,
                        type: AnalyticType.FIELD_DISTRIBUTION,
                        fieldName: field.name,
                        label: `${field.label} Distribution`,
                        visible: this.shouldBeVisibleByDefault(field.type),
                        order: order++,
                        chartType: ChartType.PIE,
                        options: {
                            showPercentages: true
                        }
                    });
                    break;

                case FieldType.TEXT:
                case FieldType.EMAIL:
                    if (this.isLikelySelectField(field)) {
                        analytics.push({
                            id: analyticId,
                            type: AnalyticType.TOP_VALUES,
                            fieldName: field.name,
                            label: `Popular ${field.label}`,
                            visible: this.shouldBeVisibleByDefault(field.type),
                            order: order++,
                            chartType: ChartType.PIE, // Changed to PIE for better visual appeal
                            options: {
                                topCount: 6
                            }
                        });
                    }
                    break;

                case FieldType.NUMBER:
                    analytics.push({
                        id: analyticId,
                        type: AnalyticType.FIELD_STATS,
                        fieldName: field.name,
                        label: `${field.label} Statistics`,
                        visible: this.shouldBeVisibleByDefault(field.type),
                        order: order++,
                        chartType: ChartType.STAT_CARD
                    });
                    break;

                case FieldType.DATE:
                    analytics.push({
                        id: analyticId,
                        type: AnalyticType.FIELD_DISTRIBUTION,
                        fieldName: field.name,
                        label: `${field.label} Distribution`,
                        visible: this.shouldBeVisibleByDefault(field.type),
                        order: order++,
                        chartType: ChartType.BAR,
                        options: {
                            timeGranularity: 'month'
                        }
                    });
                    break;

                case FieldType.ARRAY:
                    analytics.push({
                        id: analyticId,
                        type: AnalyticType.TOP_VALUES,
                        fieldName: field.name,
                        label: `Popular ${field.label} Items`,
                        visible: this.shouldBeVisibleByDefault(field.type),
                        order: order++,
                        chartType: ChartType.PIE, // Changed to PIE for better visual appeal
                        options: {
                            topCount: 8
                        }
                    });
                    break;
            }
        });

        // Add completion rate
        analytics.push({
            id: 'completion_rate',
            type: AnalyticType.COMPLETION_RATE,
            label: 'Field Completion Rate',
            visible: true,
            order: order++,
            chartType: ChartType.BAR
        });

        const defaultSettings = {
            formId,
            analytics,
            lastUpdated: new Date().toISOString()
        };

        console.log('AnalyticsSettingsStore: Created default analytics settings:', {
            formId,
            totalAnalytics: analytics.length,
            visibleAnalytics: analytics.filter(a => a.visible).length
        });

        return defaultSettings;
    }

    private mergeWithCurrentFields(savedSettings: AnalyticsSettings, currentFields: FormField[]): AnalyticsSettings {
        const existingAnalytics = new Map(savedSettings.analytics.map(analytic => [analytic.id, analytic]));
        const currentFieldNames = new Set(currentFields.map(f => f.name));

        // Keep existing analytics that are still valid
        const validAnalytics = savedSettings.analytics.filter(analytic => {
            // Keep non-field analytics
            if (!analytic.fieldName) return true;
            // Keep field analytics only if field still exists
            return currentFieldNames.has(analytic.fieldName);
        });

        // Add new analytics for new fields
        let maxOrder = Math.max(0, ...validAnalytics.map(a => a.order));

        currentFields.forEach(field => {
            const analyticId = `${field.name}_analytics`;
            if (!existingAnalytics.has(analyticId)) {
                maxOrder++;
                // Add new analytic based on field type (same logic as createDefaultSettings)
                switch (field.type) {
                    case FieldType.SELECT:
                    case FieldType.BOOLEAN:
                        validAnalytics.push({
                            id: analyticId,
                            type: AnalyticType.FIELD_DISTRIBUTION,
                            fieldName: field.name,
                            label: `${field.label} Distribution`,
                            visible: this.shouldBeVisibleByDefault(field.type),
                            order: maxOrder,
                            chartType: ChartType.PIE,
                            options: { showPercentages: true }
                        });
                        break;
                    // Add other field types as needed...
                }
            }
        });

        // Sort by order
        validAnalytics.sort((a, b) => a.order - b.order);

        const mergedSettings = {
            ...savedSettings,
            analytics: validAnalytics.map((analytic, index) => ({ ...analytic, order: index })),
            lastUpdated: new Date().toISOString()
        };

        console.log('AnalyticsSettingsStore: Merged analytics settings result:', {
            formId: mergedSettings.formId,
            totalAnalytics: mergedSettings.analytics.length,
            visibleAnalytics: mergedSettings.analytics.filter(a => a.visible).length
        });

        return mergedSettings;
    }

    private shouldBeVisibleByDefault(fieldType: FieldType): boolean {
        const commonAnalyticTypes = [
            FieldType.SELECT,
            FieldType.BOOLEAN,
            FieldType.NUMBER
        ];
        return commonAnalyticTypes.includes(fieldType);
    }

    private isLikelySelectField(field: FormField): boolean {
        // Check if field has limited unique values (from sampleValues or options)
        if (field.options && field.options.length > 0 && field.options.length <= 20) {
            return true;
        }
        if (field.sampleValues && field.sampleValues.length > 0) {
            const uniqueValues = new Set(field.sampleValues);
            return uniqueValues.size <= 10 && field.sampleValues.length > uniqueValues.size * 2;
        }
        return false;
    }

    updateAnalyticVisibility(formId: string, analyticId: string, visible: boolean) {
        if (!formId || !this.settings.analyticsSettings[formId]) {
            console.warn('AnalyticsSettingsStore: Cannot update visibility - no settings for form:', formId);
            return;
        }

        runInAction(() => {
            const analyticsSettings = this.settings.analyticsSettings[formId];
            const updatedAnalytics = analyticsSettings.analytics.map(analytic =>
                analytic.id === analyticId ? { ...analytic, visible } : analytic
            );

            this.settings.analyticsSettings[formId] = {
                ...analyticsSettings,
                analytics: updatedAnalytics,
                lastUpdated: new Date().toISOString()
            };

            this.saveSettings();
            console.log('AnalyticsSettingsStore: Updated visibility for', analyticId, ':', visible);
        });
    }

    updateAnalyticOrder(formId: string, reorderedAnalytics: AnalyticSetting[]) {
        if (!formId || !this.settings.analyticsSettings[formId]) {
            console.warn('AnalyticsSettingsStore: Cannot update order - no settings for form:', formId);
            return;
        }

        runInAction(() => {
            const analyticsSettings = this.settings.analyticsSettings[formId];
            const updatedAnalytics = reorderedAnalytics.map((analytic, index) => ({ ...analytic, order: index }));

            this.settings.analyticsSettings[formId] = {
                ...analyticsSettings,
                analytics: updatedAnalytics,
                lastUpdated: new Date().toISOString()
            };

            this.saveSettings();
            console.log('AnalyticsSettingsStore: Updated analytic order for form:', formId);
        });
    }

    getVisibleAnalytics(formId: string): AnalyticSetting[] {
        if (!formId) return [];

        const analyticsSettings = this.settings.analyticsSettings[formId];
        if (!analyticsSettings) return [];

        return analyticsSettings.analytics
            .filter(analytic => analytic.visible)
            .sort((a, b) => a.order - b.order);
    }

    resetFormToDefaults(formId: string, formFields: FormField[]) {
        if (!formId || !formFields.length) {
            console.warn('AnalyticsSettingsStore: Cannot reset - invalid formId or formFields');
            return;
        }

        console.log('AnalyticsSettingsStore: Starting reset to defaults for form:', formId);

        runInAction(() => {
            if (this.settings.analyticsSettings[formId]) {
                delete this.settings.analyticsSettings[formId];
                console.log('AnalyticsSettingsStore: Cleared existing analytics settings for form:', formId);
            }

            const defaultSettings = this.createDefaultSettings(formId, formFields);
            this.settings.analyticsSettings[formId] = defaultSettings;

            this.saveSettings();
            console.log('AnalyticsSettingsStore: Reset complete for form:', formId);
        });
    }

    // Utility getters
    get isReady(): boolean {
        return this.settings.initialized;
    }

    get allFormIds(): string[] {
        return Object.keys(this.settings.analyticsSettings);
    }

    // Clear all settings (for debugging)
    clearAllSettings() {
        runInAction(() => {
            this.settings = { ...DEFAULT_STATE, initialized: true };

            if (typeof window !== 'undefined') {
                delete window.wixFormDashboardAnalyticsSettings;
                delete window.wixFormDashboardAnalyticsSettingsBackup;
            }

            console.log('AnalyticsSettingsStore: Cleared all analytics settings');
        });
    }
}

// Singleton pattern
let storeInstance: AnalyticsSettingsStore | null = null;

export const getAnalyticsSettingsStore = (): AnalyticsSettingsStore => {
    if (!storeInstance) {
        storeInstance = new AnalyticsSettingsStore();
        storeInstance.initialize();
    }
    return storeInstance;
};

export const analyticsSettingsStore = getAnalyticsSettingsStore();

// Ensure settings are loaded immediately
if (typeof window !== 'undefined') {
    analyticsSettingsStore.initialize();
}

// Declare global types
declare global {
    interface Window {
        wixFormDashboardAnalyticsSettings?: AnalyticsSettings[];
        wixFormDashboardAnalyticsSettingsBackup?: string;
    }
}