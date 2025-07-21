import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { formTableSettingsStore } from '../pages/stores/FormTableSettingsStore';
import { FormField } from '../types';

export const useFormTableSettings = (formId: string | null, formFields: FormField[]) => {
    // Initialize settings for the current form when form changes
    useEffect(() => {
        if (formId && formFields.length > 0) {
            console.log('useFormTableSettings: Setting up form:', formId);
            formTableSettingsStore.setFormSettings(formId, formFields);
        }
    }, [formId, formFields]);

    // Update selected form in store
    useEffect(() => {
        if (formId && formId !== formTableSettingsStore.selectedFormId) {
            console.log('useFormTableSettings: Updating selected form:', formId);
            formTableSettingsStore.setSelectedFormId(formId);
        }
    }, [formId]);

    // Get current settings and visible columns
    const settings = formId ? formTableSettingsStore.getFormSettings(formId) : null;
    const visibleColumns = formId ? formTableSettingsStore.getVisibleColumns(formId) : formFields;

    return {
        settings,
        visibleColumns,
        isLoading: formTableSettingsStore.isLoading,
        updateColumnVisibility: (fieldName: string, visible: boolean) => {
            if (formId) {
                console.log('useFormTableSettings: Updating visibility:', fieldName, visible);
                formTableSettingsStore.updateColumnVisibility(formId, fieldName, visible);
            }
        },
        updateColumnOrder: (reorderedColumns: any[]) => {
            if (formId) {
                console.log('useFormTableSettings: Updating column order');
                formTableSettingsStore.updateColumnOrder(formId, reorderedColumns);
            }
        },
        resetToDefaults: () => {
            if (formId) {
                console.log('useFormTableSettings: Resetting to defaults');
                formTableSettingsStore.resetFormToDefaults(formId, formFields);
            }
        },
        saveSettingsExplicitly: () => {
            console.log('useFormTableSettings: Explicit save called');
            formTableSettingsStore.saveSettings();
            return true;
        }
    };
};

// Export observer wrapper for components that use this hook
export const withFormTableSettings = observer;