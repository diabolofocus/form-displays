// ==============================================
// NEW: src/dashboard/hooks/useAnalyticsSettings.ts
// ==============================================

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { analyticsSettingsStore, AnalyticSetting } from '../pages/stores/AnalyticsSettingsStore';
import { FormField } from '../types';

export const useAnalyticsSettings = (formId: string | null, formFields: FormField[]) => {
    const [forceRefresh, setForceRefresh] = useState(0);

    // Initialize settings for the current form when form changes
    useEffect(() => {
        if (formId && formFields.length > 0) {
            console.log('useAnalyticsSettings: Setting up analytics for form:', formId);
            analyticsSettingsStore.setAnalyticsSettings(formId, formFields);
        }
    }, [formId, formFields]);

    // Update selected form in store
    useEffect(() => {
        if (formId && formId !== analyticsSettingsStore.selectedFormId) {
            console.log('useAnalyticsSettings: Updating selected form:', formId);
            analyticsSettingsStore.setSelectedFormId(formId);
        }
    }, [formId]);

    // Get current settings and visible analytics
    const analyticsSettings = formId ? analyticsSettingsStore.getAnalyticsSettings(formId) : null;
    const visibleAnalytics = formId ? analyticsSettingsStore.getVisibleAnalytics(formId) : [];

    return {
        analyticsSettings,
        visibleAnalytics,
        isLoading: analyticsSettingsStore.isLoading,
        updateAnalyticVisibility: (analyticId: string, visible: boolean) => {
            if (formId) {
                console.log('useAnalyticsSettings: Updating visibility:', analyticId, visible);
                analyticsSettingsStore.updateAnalyticVisibility(formId, analyticId, visible);
                setForceRefresh(prev => prev + 1);
            }
        },
        updateAnalyticOrder: (reorderedAnalytics: AnalyticSetting[]) => {
            if (formId) {
                console.log('useAnalyticsSettings: Updating analytic order');
                analyticsSettingsStore.updateAnalyticOrder(formId, reorderedAnalytics);
                setForceRefresh(prev => prev + 1);
            }
        },
        resetToDefaults: () => {
            if (formId && formFields.length > 0) {
                console.log('useAnalyticsSettings: Resetting to defaults for form:', formId);
                analyticsSettingsStore.resetFormToDefaults(formId, formFields);
                setForceRefresh(prev => prev + 1);
            }
        },
        saveSettingsExplicitly: () => {
            console.log('useAnalyticsSettings: Explicit save called');
            analyticsSettingsStore.saveSettings();
            return true;
        }
    };
};