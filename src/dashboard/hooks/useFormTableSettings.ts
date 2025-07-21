// ==============================================
// NEW: src/dashboard/hooks/useFormTableSettings.ts
// ==============================================

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { formTableSettingsStore } from '../pages/stores/FormTableSettingsStore';
import { FormField } from '../types';

export const useFormTableSettings = (formId: string | null, formFields: FormField[]) => {
    // Add a force refresh state to trigger re-renders
    const [forceRefresh, setForceRefresh] = useState(0);

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

    // Get current settings and visible columns (include forceRefresh to trigger updates)
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
                // Force re-render
                setForceRefresh(prev => prev + 1);
            }
        },
        updateColumnOrder: (reorderedColumns: any[]) => {
            if (formId) {
                console.log('useFormTableSettings: Updating column order');
                formTableSettingsStore.updateColumnOrder(formId, reorderedColumns);
                // Force re-render
                setForceRefresh(prev => prev + 1);
            }
        },
        resetToDefaults: () => {
            if (formId && formFields.length > 0) {
                console.log('useFormTableSettings: Resetting to defaults for form:', formId);
                console.log('useFormTableSettings: Form fields count:', formFields.length);

                // Call the store method directly like the debug button does
                formTableSettingsStore.resetFormToDefaults(formId, formFields);

                // Force immediate re-render
                setForceRefresh(prev => prev + 1);

                // Also trigger a small delay to ensure everything is updated
                setTimeout(() => {
                    console.log('useFormTableSettings: Reset complete, new visible count:', formTableSettingsStore.getVisibleColumns(formId).length);
                    setForceRefresh(prev => prev + 1);
                }, 100);
            } else {
                console.warn('useFormTableSettings: Cannot reset - missing formId or formFields');
            }
        },
        updateColumnWidth: (fieldName: string, width: string) => {
            if (formId) {
                console.log('useFormTableSettings: Updating width:', fieldName, width);
                formTableSettingsStore.updateColumnWidth(formId, fieldName, width);
                // Force re-render
                setForceRefresh(prev => prev + 1);
            }
        },
        saveSettingsExplicitly: () => {
            console.log('useFormTableSettings: Explicit save called');
            formTableSettingsStore.saveSettings();
            return true;
        },
        updateFormName: (formId: string, customName: string) => {
            console.log('useFormTableSettings: Updating form name:', formId, customName);
            formTableSettingsStore.updateFormName(formId, customName);
            // Force re-render
            setForceRefresh(prev => prev + 1);
        }
    };
};

// Export observer wrapper for components that use this hook
export const withFormTableSettings = observer;