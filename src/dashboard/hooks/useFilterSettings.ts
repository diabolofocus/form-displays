// ==============================================
// NEW: src/dashboard/hooks/useFilterSettings.ts
// ==============================================

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { filterSettingsStore } from '../pages/stores/FilterSettingsStore';
import { FormField } from '../types';

export const useFilterSettings = (formId: string | null, formFields: FormField[]) => {
    // Add a force refresh state to trigger re-renders
    const [forceRefresh, setForceRefresh] = useState(0);

    // Initialize filter settings for the current form when form changes
    useEffect(() => {
        if (formId && formFields.length > 0) {
            console.log('useFilterSettings: Setting up filters for form:', formId);
            filterSettingsStore.setFormFilters(formId, formFields);
        }
    }, [formId, formFields]);

    // Update selected form in store
    useEffect(() => {
        if (formId && formId !== filterSettingsStore.selectedFormId) {
            console.log('useFilterSettings: Updating selected form:', formId);
            filterSettingsStore.setSelectedFormId(formId);
        }
    }, [formId]);

    // Get current filter settings and visible filters
    const filterSettings = formId ? filterSettingsStore.getFormFilters(formId) : null;
    const visibleFilters = formId ? filterSettingsStore.getVisibleFilters(formId) : formFields;

    return {
        filterSettings,
        visibleFilters,
        isLoading: filterSettingsStore.isLoading,
        updateFilterVisibility: (fieldName: string, visible: boolean) => {
            if (formId) {
                console.log('useFilterSettings: Updating filter visibility:', fieldName, visible);
                filterSettingsStore.updateFilterVisibility(formId, fieldName, visible);
                setForceRefresh(prev => prev + 1);
            }
        },
        updateFilterEnabled: (fieldName: string, enabled: boolean) => {
            if (formId) {
                console.log('useFilterSettings: Updating filter enabled:', fieldName, enabled);
                filterSettingsStore.updateFilterEnabled(formId, fieldName, enabled);
                setForceRefresh(prev => prev + 1);
            }
        },
        updateFilterOrder: (reorderedFilters: any[]) => {
            if (formId) {
                console.log('useFilterSettings: Updating filter order');
                filterSettingsStore.updateFilterOrder(formId, reorderedFilters);
                setForceRefresh(prev => prev + 1);
            }
        },
        resetToDefaults: () => {
            if (formId && formFields.length > 0) {
                console.log('useFilterSettings: Resetting filters to defaults for form:', formId);
                filterSettingsStore.resetFormToDefaults(formId, formFields);
                setForceRefresh(prev => prev + 1);
            }
        },
        saveSettingsExplicitly: () => {
            console.log('useFilterSettings: Explicit save called');
            filterSettingsStore.saveSettings();
            return true;
        }
    };
};
