// ==============================================
// FIXED: src/dashboard/pages/components/SettingsPage.tsx
// ==============================================

import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Box,
  Text,
  Button,
  TableListHeader,
  TableListItem,
  SortableListBase,
  MessageModalLayout,
  Modal,
  Loader,
  Badge,
  WixDesignSystemProvider

} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { useSettings, ColumnSetting } from '../../hooks/useSettings';
import { useForms } from '../../hooks/useForms';
import { usePatientData } from '../../hooks/usePatientData';
import { FormSelector } from '../../components/FormSelector';
import { FieldType } from '../../types';

import '@wix/design-system/styles.global.css';

const SettingsPage: React.FC = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // Set to false to hide debug panel

  // Get forms and data
  const { allSubmissions, loading: dataLoading } = usePatientData();
  const { availableForms, selectedFormId, setSelectedFormId, selectedForm } = useForms(allSubmissions);

  const {
    settings,
    isLoading: settingsLoading,
    updateColumnVisibility,
    updateColumnOrder,
    resetToDefaults,
    visibleColumns,
    saveSettingsExplicitly
  } = useSettings(selectedFormId, selectedForm?.fields || []);

  // Debug logging for settings page
  useEffect(() => {
    console.log('SettingsPage: Component state:', {
      selectedFormId,
      selectedFormName: selectedForm?.name,
      availableFormsCount: availableForms.length,
      windowFormId: typeof window !== 'undefined' ? window.wixCurrentFormId : 'undefined',
      settingsExists: !!settings,
      settingsFormId: settings?.formId
    });
  }, [selectedFormId, selectedForm, availableForms.length, settings]);

  // Form selection is now handled by useForms hook

  const [headerOptions] = useState([
    {
      value: 'Field Name',
      width: '3fr',
      sortable: false,
    },
    {
      value: 'Type',
      width: '2fr',
      sortable: false,
    },
    {
      value: 'Visible',
      width: '1fr',
      sortable: false,
    },
    {
      value: 'Width',
      width: '1fr',
      sortable: false,
    }
  ]);

  // Convert settings to draggable items
  const items = settings ? settings.columns.map((column, index) => ({
    id: column.id,
    column,
    order: index,
    isHeading: false
  })) : [];

  const handleDrop = ({ removedIndex, addedIndex }: { removedIndex: number; addedIndex: number }) => {
    if (!settings) return;

    const reorderedColumns = [...settings.columns];
    const [removed] = reorderedColumns.splice(removedIndex, 1);
    reorderedColumns.splice(addedIndex, 0, removed);

    updateColumnOrder(reorderedColumns);

    dashboard.showToast({
      message: 'Column order updated',
      type: 'success',
    });
  };

  const handleVisibilityChange = (fieldName: string, visible: boolean) => {
    updateColumnVisibility(fieldName, visible);

    dashboard.showToast({
      message: `Column ${visible ? 'shown' : 'hidden'}`,
      type: 'success',
    });
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    setIsResetModalOpen(false);

    dashboard.showToast({
      message: 'Settings reset to defaults',
      type: 'success',
    });
  };

  const handleSaveSettings = () => {
    if (!settings) return;

    setIsNavigating(true);

    const success = saveSettingsExplicitly();

    dashboard.showToast({
      message: success ? 'Settings saved successfully' : 'Error saving settings',
      type: success ? 'success' : 'error',
    });

    // Navigate back to main page after successful save
    if (success) {
      setTimeout(() => {
        dashboard.navigate({
          pageId: '18fa5508-c2db-4a9f-8331-54c511277e6a'
        });
      }, 300);
    } else {
      setIsNavigating(false);
    }
  };

  const handleBackToDashboard = () => {
    // Form persistence is handled by useForms hook automatically
    dashboard.navigate({
      pageId: '18fa5508-c2db-4a9f-8331-54c511277e6a'
    });
  };

  const renderItem = (data: any) => {
    const { isPlaceholder, item } = data;

    if (isPlaceholder) {
      return (
        <div>
          <Box
            style={{
              boxSizing: 'border-box',
              width: '100%',
              height: '50px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              marginBottom: '2px',
            }}
          />
        </div>
      );
    }

    const column: ColumnSetting = item.column;

    return (
      <div>
        <TableListItem
          draggable
          showDivider
          checkbox
          checked={column.visible}
          onCheckboxChange={() => handleVisibilityChange(column.fieldName, !column.visible)}
          options={[
            {
              value: (
                <Box direction="horizontal" gap="SP2" align="center">
                  <Text>{column.label}</Text>
                  {column.fieldName === '_createdDate' && (
                    <Badge skin="neutralLight" size="small">System</Badge>
                  )}
                </Box>
              ),
              width: '3fr'
            },
            {
              value: (
                <Box direction="horizontal" gap="SP1" align="center">
                  {getFieldTypeIcon(column.type)}
                  <Text size="small" color="secondary">
                    {getFieldTypeLabel(column.type)}
                  </Text>
                </Box>
              ),
              width: '2fr'
            },
            {
              value: (
                <Badge
                  skin={column.visible ? 'success' : 'neutralLight'}
                  size="small"
                >
                  {column.visible ? 'Visible' : 'Hidden'}
                </Badge>
              ),
              width: '1fr'
            },
            {
              value: (
                <Text size="small" color="secondary">
                  {column.width || 'Auto'}
                </Text>
              ),
              width: '1fr'
            }
          ]}
        />
      </div>
    );
  };

  const canDrag = (data: any) => {
    const { item } = data;
    // Allow dragging all items except system fields like _createdDate
    return item.column.fieldName !== '_createdDate';
  };

  if (dataLoading || settingsLoading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Box textAlign="center" padding="80px">
            <Loader />
            <Text>Loading settings...</Text>
          </Box>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  const visibleColumnsCount = settings?.columns.filter(col => col.visible).length || 0;
  const totalColumnsCount = settings?.columns.length || 0;

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page minWidth={950}>

        <Page.Header
          title="Table Settings"
          subtitle="Configure which columns to display and their order"
          actionsBar={
            <Box direction="horizontal" gap="SP3">
              <Button
                onClick={handleBackToDashboard}
                priority="secondary"
                prefixIcon={<Icons.ChevronLeft />}
                disabled={isNavigating}
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => setIsResetModalOpen(true)}
                priority="secondary"
                prefixIcon={<Icons.Refresh />}
                disabled={!selectedForm || isNavigating}
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSaveSettings}
                priority="primary"
                prefixIcon={<Icons.Confirm />}
                disabled={!selectedForm || !settings || isNavigating}
              >
                {isNavigating ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          }
        />

        <Page.Content>
          <Box direction="vertical" gap="SP4">
            {/* Form Selector */}
            <Card>
              <Card.Content>
                <FormSelector
                  availableForms={availableForms}
                  selectedFormId={selectedFormId}
                  onFormSelect={setSelectedFormId} // useForms handles persistence internally
                  loading={dataLoading}
                />
              </Card.Content>
            </Card>

            {selectedForm ? (
              <Card>
                <Card.Header
                  title="Column Configuration"
                  subtitle={`${visibleColumnsCount} of ${totalColumnsCount} columns visible • Drag to reorder • Uncheck to hide`}
                />
                <Box direction="vertical">
                  <TableListHeader
                    options={headerOptions}
                    onSortChange={() => { }} // No sorting needed for settings
                  />

                  {items.length > 0 ? (
                    <SortableListBase
                      items={items}
                      renderItem={renderItem}
                      onDrop={handleDrop}
                      canDrag={canDrag}
                    />
                  ) : (
                    <Box padding="40px" textAlign="center">
                      <Text size="medium" color="secondary">
                        No fields available for this form
                      </Text>
                    </Box>
                  )}
                </Box>
              </Card>
            ) : (
              <Box
                textAlign="center"
                padding="40px"
                backgroundColor="white"
                borderRadius="8px"
                border="1px solid #e0e0e0"
              >
                <Text size="medium" weight="bold" marginBottom="SP2">
                  No Form Selected
                </Text>
                <Text size="small" color="secondary">
                  Choose a form from the dropdown above to configure its table settings.
                </Text>
              </Box>
            )}

            {/* Debug Panel */}
            {showDebug && (
              <Card>
                <Card.Header title="Debug Information" />
                <Card.Content>
                  <Box direction="vertical" gap="SP2">
                    <Box direction="horizontal" gap="SP4">
                      <Text size="small">Selected Form ID: {selectedFormId || 'None'}</Text>
                      <Text size="small">Window Form ID: {typeof window !== 'undefined' ? window.wixCurrentFormId || 'None' : 'N/A'}</Text>
                    </Box>
                    <Box direction="horizontal" gap="SP4">
                      <Text size="small">Available Forms: {availableForms.length}</Text>
                      <Text size="small">Settings Loaded: {settings ? 'Yes' : 'No'}</Text>
                      <Text size="small">Settings Form ID: {settings?.formId || 'None'}</Text>
                    </Box>
                    <Box direction="horizontal" gap="SP2">
                      <Button
                        size="small"
                        priority="secondary"
                        onClick={() => {
                          console.log('Debug: Current state:', {
                            selectedFormId,
                            windowFormId: typeof window !== 'undefined' ? window.wixCurrentFormId : undefined,
                            availableForms: availableForms.map(f => ({ id: f.formId, name: f.name })),
                            settings: settings ? { formId: settings.formId, columnsCount: settings.columns.length } : null,
                            allStoredSettings: typeof window !== 'undefined' ? window.wixFormDashboardSettings : undefined
                          });
                        }}
                      >
                        Log Debug Info
                      </Button>
                      <Button
                        size="small"
                        priority="secondary"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            delete window.wixFormDashboardSettings;
                            delete window.wixFormDashboardSettingsBackup;
                            delete window.wixCurrentFormId;
                            console.log('Debug: Cleared all storage');
                          }
                        }}
                      >
                        Clear All Storage
                      </Button>
                    </Box>
                  </Box>
                </Card.Content>
              </Card>
            )}

            {/* Settings Summary */}
            {settings && (
              <Card>
                <Card.Header title="Settings Summary" />
                <Card.Content>
                  <Box direction="vertical" gap="SP2">
                    <Box direction="horizontal" align="center" gap="SP2">
                      <Text>Total Columns:</Text>
                      <Text weight="bold">{totalColumnsCount}</Text>
                    </Box>
                    <Box direction="horizontal" align="center" gap="SP2">
                      <Text>Visible Columns:</Text>
                      <Text weight="bold" color={visibleColumnsCount > 0 ? 'success' : 'warning'}>
                        {visibleColumnsCount}
                      </Text>
                    </Box>
                    <Box direction="horizontal" align="center" gap="SP2">
                      <Text>Hidden Columns:</Text>
                      <Text weight="bold">{totalColumnsCount - visibleColumnsCount}</Text>
                    </Box>
                    {settings.lastUpdated && (
                      <Box direction="horizontal" align="center" gap="SP2">
                        <Text>Last Updated:</Text>
                        <Text size="small" color="secondary">
                          {new Date(settings.lastUpdated).toLocaleDateString()}
                        </Text>
                      </Box>
                    )}
                    {selectedForm && (
                      <Box direction="horizontal" align="center" gap="SP2">
                        <Text>Form:</Text>
                        <Text size="small" color="secondary">
                          {selectedForm.name}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Card.Content>
              </Card>
            )}
          </Box>
        </Page.Content>

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={isResetModalOpen}
          onRequestClose={() => setIsResetModalOpen(false)}
          shouldCloseOnOverlayClick={true}
          screen="desktop"
        >
          <MessageModalLayout
            theme="standard"
            onCloseButtonClick={() => setIsResetModalOpen(false)}
            primaryButtonText="Reset"
            secondaryButtonText="Cancel"
            primaryButtonOnClick={handleResetToDefaults}
            secondaryButtonOnClick={() => setIsResetModalOpen(false)}
            title="Reset Table Settings"
            content={
              <Text>
                This will reset all column visibility and order settings to their defaults.
                All columns will become visible and revert to their original order.
                <br /><br />
                This action cannot be undone.
              </Text>
            }
          />
        </Modal>
      </Page>
    </WixDesignSystemProvider>
  );
};

// Helper functions (unchanged)
function getFieldTypeIcon(type: FieldType): React.ReactNode {
  switch (type) {
    case FieldType.EMAIL:
      return <Icons.Email size="16px" />;
    case FieldType.PHONE:
      return <Icons.Phone size="16px" />;
    case FieldType.DATE:
      return <Icons.Date size="16px" />;
    case FieldType.BOOLEAN:
      return <Icons.Toggle size="16px" />;
    case FieldType.ARRAY:
      return <Icons.List size="16px" />;
    case FieldType.TEXTAREA:
      return <Icons.Text size="16px" />;
    case FieldType.URL:
      return <Icons.ExternalLink size="16px" />;
    case FieldType.NUMBER:
      return <Icons.Number size="16px" />;
    default:
      return <Icons.Text size="16px" />;
  }
}

function getFieldTypeLabel(type: FieldType): string {
  switch (type) {
    case FieldType.EMAIL:
      return 'Email';
    case FieldType.PHONE:
      return 'Phone';
    case FieldType.DATE:
      return 'Date';
    case FieldType.BOOLEAN:
      return 'Boolean';
    case FieldType.ARRAY:
      return 'Array';
    case FieldType.TEXTAREA:
      return 'Long Text';
    case FieldType.URL:
      return 'URL';
    case FieldType.NUMBER:
      return 'Number';
    case FieldType.TEXT:
      return 'Text';
    default:
      return 'Unknown';
  }
}

export default SettingsPage;