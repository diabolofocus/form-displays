// ==============================================
// UPDATED: src/dashboard/pages/components/SettingsPage.tsx
// ==============================================

import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Box,
  Text,
  Button,
  Table,
  TableToolbar,
  TableListHeader,
  TableListItem,
  SortableListBase,
  MessageModalLayout,
  Modal,
  Loader,
  Badge,
  WixDesignSystemProvider,
  Input
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { useFormTableSettings, withFormTableSettings, } from '../../hooks/useFormTableSettings';
import { ColumnSetting, formTableSettingsStore } from '../stores/FormTableSettingsStore';
import { useForms } from '../../hooks/useForms';
import { usePatientData } from '../../hooks/usePatientData';
import { FormSelector } from '../../components/FormSelector';
import { FieldType } from '../../types';

import '@wix/design-system/styles.global.css';
import { observer } from 'mobx-react-lite';

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
    updateColumnWidth,
    updateFormName,
    resetToDefaults,
    saveSettingsExplicitly
  } = useFormTableSettings(selectedFormId, selectedForm?.fields || []);

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

  useEffect(() => {
    console.log('SettingsPage: Settings changed:', {
      formId: settings?.formId,
      totalColumns: settings?.columns.length,
      visibleColumns: settings?.columns.filter((c: any) => c.visible).length
    });
  }, [settings]);

  const [headerOptions] = useState([

    {
      value: 'Field Name',
      width: '3fr',
      sortable: false,
      align: 'left' as const,
    },
    {
      value: 'Type',
      width: '2fr',
      sortable: false,
      align: 'left' as const,
    },
    {
      value: 'Visible',
      width: '1fr',
      sortable: false,
      align: 'left' as const,
    },
    {
      value: 'Width',
      width: '1fr',
      sortable: false,
      align: 'left' as const,
    }
  ]);

  // Convert settings to table data for the new Table structure
  const tableData = settings ? settings.columns.map((column, index) => ({
    id: column.id,
    column,
    order: index,
    fieldName: column.fieldName,
    label: column.label,
    type: column.type,
    visible: column.visible,
    width: column.width
  })) : [];

  // Table columns configuration
  const columns = [
    {
      title: 'Field Name',
      render: (row: any) => (
        <Box direction="horizontal" gap="SP2" align="center">
          <Text>{row.column.label}</Text>
          {row.column.fieldName === '_createdDate' && (
            <Badge skin="neutralLight" size="small">System</Badge>
          )}
        </Box>
      ),
      width: '3fr',
      align: 'start' as const
    },
    {
      title: 'Type',
      render: (row: any) => (
        <Box direction="horizontal" gap="SP1" align="center">
          {getFieldTypeIcon(row.column.type)}
          <Text size="small" color="secondary">
            {getFieldTypeLabel(row.column.type)}
          </Text>
        </Box>
      ),
      width: '2fr',
      align: 'start' as const
    },
    {
      title: 'Visible',
      render: (row: any) => (
        <Badge
          skin={row.column.visible ? 'success' : 'neutralLight'}
          size="small"
        >
          {row.column.visible ? 'Visible' : 'Hidden'}
        </Badge>
      ),
      width: '1fr',
      align: 'start' as const
    },
    {
      title: 'Width',
      render: (row: any) => (
        <Box direction="horizontal" gap="SP1" align="center">
          <Box width="60px">
            <Input
              size="small"
              value={row.column.width ? row.column.width.replace('px', '') : ''}
              placeholder="Auto"
              onChange={(e) => {
                const numericValue = e.target.value.trim();
                const width = numericValue ? `${numericValue}px` : '';
                updateColumnWidth(row.column.fieldName, width);
              }}
              onBlur={(e) => {
                // Validate numeric input
                const value = e.target.value.trim();
                if (value && !value.match(/^\d+$/)) {
                  // If invalid format, revert to previous value
                  const currentWidth = row.column.width || '';
                  updateColumnWidth(row.column.fieldName, currentWidth);
                }
              }}
            />
          </Box>
          {row.column.width && row.column.width !== 'Auto' && (
            <Text size="small" color="secondary">px</Text>
          )}
        </Box>
      ),
      width: '120px',
      align: 'start' as const
    }
  ];

  // Select all functionality
  const allVisible = settings ? settings.columns.every(col => col.visible) : false;
  const someVisible = settings ? settings.columns.some(col => col.visible) : false;
  const noneVisible = settings ? !settings.columns.some(col => col.visible) : true;

  const getCheckboxState = () => {
    if (allVisible) return 'checked';
    if (someVisible) return 'indeterminate';
    return 'normal';
  };

  const handleSelectAll = () => {
    if (!settings) return;

    const newVisibility = !allVisible;

    // Update all columns visibility
    settings.columns.forEach(column => {
      updateColumnVisibility(column.fieldName, newVisibility);
    });

    dashboard.showToast({
      message: newVisibility ? 'All columns selected' : 'All columns deselected',
      type: 'success',
    });
  };

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
    if (selectedFormId && selectedForm) {
      console.log('SettingsPage: Reset to Defaults button clicked - executing reset');
      formTableSettingsStore.resetFormToDefaults(selectedFormId, selectedForm.fields);
      console.log('SettingsPage: Reset completed, visible columns:', formTableSettingsStore.getVisibleColumns(selectedFormId).length);

      dashboard.showToast({
        message: 'Settings reset to defaults - all columns are now visible',
        type: 'success',
      });
    } else {
      console.warn('Cannot reset - no form selected');
    }
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

    const column: any = item.column;

    return (
      <div>
        <TableListItem
          draggable
          showDivider
          showSelectionBorder={false}
          checkbox
          checked={column.visible}
          onCheckboxChange={() => handleVisibilityChange(column.fieldName, !column.visible)}
          options={[
            {
              value: (
                <Box direction="horizontal" gap="SP2" align="left">
                  <Text>{column.label}</Text>
                  {column.fieldName === '_createdDate' && (
                    <Badge skin="neutralLight" size="small">System</Badge>
                  )}
                </Box>
              ),
              width: '3fr',
              align: 'left'
            },
            {
              value: (
                <Box direction="horizontal" gap="SP1" align="left">
                  {getFieldTypeIcon(column.type)}
                  <Text size="small" color="secondary">
                    {getFieldTypeLabel(column.type)}
                  </Text>
                </Box>
              ),
              width: '2fr',
              align: 'left'
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
              width: '1fr',
              align: 'left'
            },
            {
              value: (
                <Box direction="horizontal" gap="SP1" align="center" style={{ alignItems: 'center' }}>
                  <Box width="60px">
                    <Input
                      size="small"
                      value={column.width ? column.width.replace('px', '') : ''}
                      placeholder="Auto"
                      onChange={(e) => {
                        const numericValue = e.target.value.trim();
                        const width = numericValue ? `${numericValue}px` : '';
                        updateColumnWidth(column.fieldName, width);
                      }}
                      onBlur={(e) => {
                        // Validate numeric input
                        const value = e.target.value.trim();
                        if (value && !value.match(/^\d+$/)) {
                          // If invalid format, revert to previous value
                          const currentWidth = column.width || '';
                          updateColumnWidth(column.fieldName, currentWidth);
                        }
                      }}
                    />
                  </Box>
                  {column.width && column.width !== 'Auto' && (
                    <Text size="small" color="secondary">px</Text>
                  )}
                </Box>
              ),
              width: '120px',
              align: 'left'
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

  // Convert settings to draggable items for SortableListBase
  const items = settings ? settings.columns.map((column, index) => ({
    id: column.id,
    column,
    order: index,
    isHeading: false
  })) : [];

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
                onClick={handleResetToDefaults}
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
          <Box direction="vertical" backgroundColor="red" align="center" gap="SP4">
            {/* Form Selector and Name Editor */}
            <Card>
              <Card.Content>
                <Box direction="vertical" gap="SP4">
                  <FormSelector
                    availableForms={availableForms}
                    selectedFormId={selectedFormId}
                    onFormSelect={setSelectedFormId}
                    loading={dataLoading}
                  />

                  {selectedForm && (
                    <Box direction="vertical" gap="SP2">
                      <Text size="small" weight="bold">Custom Form Name</Text>
                      <Box direction="horizontal" gap="SP2" align="center">
                        <Box width="300px">
                          <Input
                            placeholder={selectedForm.name}
                            value={formTableSettingsStore.getCustomFormName(selectedFormId!) || ''}
                            onChange={(e) => {
                              const customName = e.target.value;
                              if (selectedFormId) {
                                updateFormName(selectedFormId, customName);
                              }
                            }}
                            size="medium"
                          />
                        </Box>
                        <Button
                          size="small"
                          priority="secondary"
                          onClick={() => {
                            if (selectedFormId) {
                              updateFormName(selectedFormId, '');
                              dashboard.showToast({
                                message: 'Form name reset to default',
                                type: 'success',
                              });
                            }
                          }}
                        >
                          Reset
                        </Button>
                      </Box>
                      <Text size="small" color="secondary">
                        Leave empty to use default name: {selectedForm.name}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Card.Content>
            </Card>

            {selectedForm ? (
              <Card hideOverflow>
                <Table data={tableData} columns={columns} rowVerticalPadding="medium">
                  {/* Table Toolbar */}
                  <TableToolbar>
                    <TableToolbar.ItemGroup position="start">
                      <TableToolbar.Item>
                        <TableToolbar.Title>Column Configuration</TableToolbar.Title>
                      </TableToolbar.Item>
                    </TableToolbar.ItemGroup>
                    <TableToolbar.ItemGroup position="end">
                      <TableToolbar.Item>
                        <Text size="small" color="secondary">
                          {visibleColumnsCount} of {totalColumnsCount} columns visible
                        </Text>
                      </TableToolbar.Item>
                    </TableToolbar.ItemGroup>
                  </TableToolbar>

                  {/* Sticky Header with Select All */}
                  <Page.Sticky>
                    <Card>
                      <TableListHeader
                        options={headerOptions}
                        checkboxState={getCheckboxState()}
                        onCheckboxChange={handleSelectAll}
                        onSortChange={() => { }} // No sorting needed for settings
                      />
                    </Card>
                  </Page.Sticky>

                  {/* Table Content using SortableListBase for drag and drop */}
                  <Card>
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
                  </Card>
                </Table>
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
                          if (selectedFormId && selectedForm) {
                            console.log('Debug: Testing reset function directly');
                            formTableSettingsStore.resetFormToDefaults(selectedFormId, selectedForm.fields);
                            console.log('Debug: Reset called, current visible columns:', formTableSettingsStore.getVisibleColumns(selectedFormId).length);
                          }
                        }}
                      >
                        Test Reset (Debug)
                      </Button>
                      <Button
                        size="small"
                        priority="secondary"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            delete window.wixFormDashboardSettings;
                            delete window.wixFormDashboardSettingsBackup;
                            delete window.wixCurrentFormId;
                            sessionStorage.removeItem('wixFormDashboardSettings');
                            sessionStorage.removeItem('wixCurrentFormId');
                            console.log('Debug: Cleared all storage including sessionStorage');
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

export default observer(SettingsPage);