// ==============================================
// UPDATED: src/dashboard/pages/components/SettingsPage.tsx - With Filter Settings
// ==============================================

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
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
  Input,
  TextButton,
  Tooltip,
  Breadcrumbs,
  Tabs,
  Checkbox
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { useFormTableSettings } from '../../hooks/useFormTableSettings';
import { useFilterSettings } from '../../hooks/useFilterSettings';
import { useAnalyticsSettings } from '../../hooks/useAnalyticsSettings';
import { ColumnSetting, formTableSettingsStore } from '../stores/FormTableSettingsStore';
import { FilterSetting, filterSettingsStore } from '../stores/FilterSettingsStore';
import { useForms } from '../../hooks/useForms';
import { usePatientData } from '../../hooks/usePatientData';
import { FormSelector } from '../../components/FormSelector';
import { FieldType } from '../../types';


import '@wix/design-system/styles.global.css';

const SettingsPage: React.FC = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditingFormName, setIsEditingFormName] = useState(false);
  const [activeTab, setActiveTab] = useState(1); // 1 = Columns, 2 = Filters, 3 = Analytics

  // Get forms and data
  const { allSubmissions, loading: dataLoading } = usePatientData();
  const { availableForms, selectedFormId, setSelectedFormId, selectedForm } = useForms(allSubmissions);

  // Table settings
  const {
    settings,
    isLoading: settingsLoading,
    updateColumnVisibility,
    updateColumnOrder,
    updateColumnWidth,
    updateFormName,
    resetToDefaults: resetColumnsToDefaults,
    saveSettingsExplicitly: saveColumnSettings
  } = useFormTableSettings(selectedFormId, selectedForm?.fields || []);

  // Filter settings
  const {
    filterSettings,
    visibleFilters,
    isLoading: filtersLoading,
    updateFilterVisibility,
    updateFilterEnabled,
    updateFilterOrder,
    resetToDefaults: resetFiltersToDefaults,
    saveSettingsExplicitly: saveFilterSettings
  } = useFilterSettings(selectedFormId, selectedForm?.fields || []);

  // Analytics settings
  const {
    analyticsSettings,
    visibleAnalytics,
    isLoading: analyticsLoading,
    updateAnalyticVisibility,
    updateAnalyticOrder,
    resetToDefaults: resetAnalyticsToDefaults,
    saveSettingsExplicitly: saveAnalyticsSettings
  } = useAnalyticsSettings(selectedFormId, selectedForm?.fields || []);

  // Table headers for columns
  const [columnHeaderOptions] = useState([
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

  // Table headers for filters
  const [filterHeaderOptions] = useState([
    {
      value: 'Filter Name',
      width: '4fr',
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
    }
  ]);

  // Table headers for analytics
  const [analyticsHeaderOptions] = useState([
    {
      value: 'Analytics Name',
      width: '4fr',
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
      value: 'Chart',
      width: '2fr',
      sortable: false,
      align: 'left' as const,
    },
    {
      value: 'Visible',
      width: '1fr',
      sortable: false,
      align: 'left' as const,
    }
  ]);

  // Convert settings to table data
  const columnTableData = settings ? settings.columns.map((column, index) => ({
    id: column.id,
    column,
    order: index,
    fieldName: column.fieldName,
    label: column.label,
    type: column.type,
    visible: column.visible,
    width: column.width
  })) : [];

  const filterTableData = filterSettings ? filterSettings.filters.map((filter, index) => ({
    id: filter.id,
    filter,
    order: index,
    fieldName: filter.fieldName,
    label: filter.label,
    type: filter.type,
    visible: filter.visible
  })) : [];

  const analyticsTableData = analyticsSettings ? analyticsSettings.analytics.map((analytic, index) => ({
    id: analytic.id,
    analytic,
    order: index,
    label: analytic.label,
    type: analytic.type,
    chartType: analytic.chartType,
    visible: analytic.visible
  })) : [];

  // Select all functionality for columns
  const allColumnsVisible = settings ? settings.columns.every(col => col.visible) : false;
  const someColumnsVisible = settings ? settings.columns.some(col => col.visible) : false;

  const getColumnCheckboxState = () => {
    if (allColumnsVisible) return 'checked';
    if (someColumnsVisible) return 'indeterminate';
    return 'normal';
  };

  const handleSelectAllColumns = () => {
    if (!settings) return;
    const newVisibility = !allColumnsVisible;
    settings.columns.forEach(column => {
      updateColumnVisibility(column.fieldName, newVisibility);
    });
    dashboard.showToast({
      message: newVisibility ? 'All columns selected' : 'All columns deselected',
      type: 'success',
    });
  };

  // Select all functionality for filters
  const allFiltersVisible = filterSettings ? filterSettings.filters.every(filter => filter.visible) : false;
  const someFiltersVisible = filterSettings ? filterSettings.filters.some(filter => filter.visible) : false;

  const getFilterCheckboxState = () => {
    if (allFiltersVisible) return 'checked';
    if (someFiltersVisible) return 'indeterminate';
    return 'normal';
  };

  const handleSelectAllFilters = () => {
    if (!filterSettings) return;
    const newVisible = !allFiltersVisible;
    filterSettings.filters.forEach(filter => {
      updateFilterVisibility(filter.fieldName, newVisible);
    });
    dashboard.showToast({
      message: newVisible ? 'All filters shown' : 'All filters hidden',
      type: 'success',
    });
  };

  // Select all functionality for analytics
  const allAnalyticsVisible = analyticsSettings ? analyticsSettings.analytics.every(analytic => analytic.visible) : false;
  const someAnalyticsVisible = analyticsSettings ? analyticsSettings.analytics.some(analytic => analytic.visible) : false;

  const getAnalyticsCheckboxState = () => {
    if (allAnalyticsVisible) return 'checked';
    if (someAnalyticsVisible) return 'indeterminate';
    return 'normal';
  };

  const handleSelectAllAnalytics = () => {
    if (!analyticsSettings) return;
    const newVisible = !allAnalyticsVisible;
    analyticsSettings.analytics.forEach(analytic => {
      updateAnalyticVisibility(analytic.id, newVisible);
    });
    dashboard.showToast({
      message: newVisible ? 'All analytics shown' : 'All analytics hidden',
      type: 'success',
    });
  };

  const handleColumnDrop = ({ removedIndex, addedIndex }: { removedIndex: number; addedIndex: number }) => {
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

  const handleFilterDrop = ({ removedIndex, addedIndex }: { removedIndex: number; addedIndex: number }) => {
    if (!filterSettings) return;
    const reorderedFilters = [...filterSettings.filters];
    const [removed] = reorderedFilters.splice(removedIndex, 1);
    reorderedFilters.splice(addedIndex, 0, removed);
    updateFilterOrder(reorderedFilters);
    dashboard.showToast({
      message: 'Filter order updated',
      type: 'success',
    });
  };

  const handleAnalyticDrop = ({ removedIndex, addedIndex }: { removedIndex: number; addedIndex: number }) => {
    if (!analyticsSettings) return;
    const reorderedAnalytics = [...analyticsSettings.analytics];
    const [removed] = reorderedAnalytics.splice(removedIndex, 1);
    reorderedAnalytics.splice(addedIndex, 0, removed);
    updateAnalyticOrder(reorderedAnalytics);
    dashboard.showToast({
      message: 'Analytics order updated',
      type: 'success',
    });
  };

  const handleResetToDefaults = () => {
    if (selectedFormId && selectedForm) {
      if (activeTab === 1) {
        // Reset columns
        formTableSettingsStore.resetFormToDefaults(selectedFormId, selectedForm.fields);
        dashboard.showToast({
          message: 'Column settings reset to defaults',
          type: 'success',
        });
      } else if (activeTab === 2) {
        // Reset filters
        filterSettingsStore.resetFormToDefaults(selectedFormId, selectedForm.fields);
        dashboard.showToast({
          message: 'Filter settings reset to defaults',
          type: 'success',
        });
      } else if (activeTab === 3) {
        // Reset analytics
        resetAnalyticsToDefaults();
        dashboard.showToast({
          message: 'Analytics settings reset to defaults',
          type: 'success',
        });
      }
    }
  };
  const handleSaveSettings = () => {
    if (!settings && !filterSettings && !analyticsSettings) return;

    setIsNavigating(true);
    let success = true;

    if (activeTab === 1 && settings) {
      success = saveColumnSettings();
    } else if (activeTab === 2 && filterSettings) {
      success = saveFilterSettings();
    } else if (activeTab === 3 && analyticsSettings) {
      success = saveAnalyticsSettings();
    }

    dashboard.showToast({
      message: success ? 'Settings saved successfully' : 'Error saving settings',
      type: success ? 'success' : 'error',
    });

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

  // Render column item
  const renderColumnItem = (data: any) => {
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
          onCheckboxChange={() => updateColumnVisibility(column.fieldName, !column.visible)}
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
              width: '3fr',
              align: 'left'
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

  // Render filter item
  const renderFilterItem = (data: any) => {
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

    const filter: any = item.filter;
    return (
      <div>
        <TableListItem
          draggable
          showDivider
          showSelectionBorder={false}
          checkbox
          checked={filter.visible}
          onCheckboxChange={() => updateFilterVisibility(filter.fieldName, !filter.visible)}
          options={[
            {
              value: (
                <Box direction="horizontal" gap="SP2" align="center">
                  <Text>{filter.label}</Text>
                  <Badge skin="neutralLight" size="small">Filter</Badge>
                </Box>
              ),
              width: '4fr',
              align: 'left'
            },
            {
              value: (
                <Box direction="horizontal" gap="SP1" align="center">
                  {getFieldTypeIcon(filter.type)}
                  <Text size="small" color="secondary">
                    {getFieldTypeLabel(filter.type)}
                  </Text>
                </Box>
              ),
              width: '2fr',
              align: 'left'
            },
            {
              value: (
                <Badge
                  skin={filter.visible ? 'success' : 'neutralLight'}
                  size="small"
                >
                  {filter.visible ? 'Visible' : 'Hidden'}
                </Badge>
              ),
              width: '1fr',
              align: 'left'
            }
          ]}
        />
      </div>
    );
  };

  const canColumnDrag = (data: any) => {
    const { item } = data;
    return item.column.fieldName !== '_createdDate';
  };

  const canFilterDrag = () => true;

  // Render analytics item
  const renderAnalyticsItem = (data: any) => {
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

    const analytic: any = item.analytic;
    return (
      <div>
        <TableListItem
          draggable
          showDivider
          showSelectionBorder={false}
          checkbox
          checked={analytic.visible}
          onCheckboxChange={() => updateAnalyticVisibility(analytic.id, !analytic.visible)}
          options={[
            {
              value: (
                <Box direction="horizontal" gap="SP2" align="center">
                  <Text>{analytic.label}</Text>
                  <Badge skin="neutralLight" size="small">{getAnalyticTypeLabel(analytic.type)}</Badge>
                </Box>
              ),
              width: '4fr',
              align: 'left'
            },
            {
              value: (
                <Box direction="horizontal" gap="SP1" align="center">
                  {getAnalyticIcon(analytic.type)}
                  <Text size="small" color="secondary">
                    {getAnalyticTypeLabel(analytic.type)}
                  </Text>
                </Box>
              ),
              width: '2fr',
              align: 'left'
            },
            {
              value: (
                <Box direction="horizontal" gap="SP1" align="center">
                  {getChartIcon(analytic.chartType)}
                  <Text size="small" color="secondary">
                    {getChartTypeLabel(analytic.chartType)}
                  </Text>
                </Box>
              ),
              width: '2fr',
              align: 'left'
            },
            {
              value: (
                <Badge
                  skin={analytic.visible ? 'success' : 'neutralLight'}
                  size="small"
                >
                  {analytic.visible ? 'Visible' : 'Hidden'}
                </Badge>
              ),
              width: '1fr',
              align: 'left'
            }
          ]}
        />
      </div>
    );
  };

  const canAnalyticsDrag = () => true;
  // Convert data to draggable items
  const columnItems = settings ? settings.columns.map((column, index) => ({
    id: column.id,
    column,
    order: index,
    isHeading: false
  })) : [];

  const filterItems = filterSettings ? filterSettings.filters.map((filter, index) => ({
    id: filter.id,
    filter,
    order: index,
    isHeading: false
  })) : [];

  const analyticsItems = analyticsSettings ? analyticsSettings.analytics.map((analytic, index) => ({
    id: analytic.id,
    analytic,
    order: index,
    isHeading: false
  })) : [];

  if (dataLoading || settingsLoading || filtersLoading || analyticsLoading) {
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
  const visibleFiltersCount = filterSettings?.filters.filter(filter => filter.visible).length || 0;
  const totalFiltersCount = filterSettings?.filters.length || 0;
  const visibleAnalyticsCount = analyticsSettings?.analytics.filter(analytic => analytic.visible).length || 0;
  const totalAnalyticsCount = analyticsSettings?.analytics.length || 0;

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page minWidth={950}>
        <Page.Header
          title="Table Settings"
          subtitle="Configure table columns and filters"
          showBackButton
          onBackClicked={handleBackToDashboard}
          breadcrumbs={
            <Breadcrumbs
              items={[
                {
                  id: 'dashboard',
                  value: 'Dashboard'
                },
                {
                  id: 'settings',
                  value: 'Settings'
                }
              ]}
              activeId="settings"
              onClick={(item) => {
                if (item.id === 'dashboard') {
                  handleBackToDashboard();
                }
              }}
            />
          }
          actionsBar={
            <Box direction="horizontal" gap="SP3">
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
                disabled={!selectedForm || (!settings && !filterSettings) || isNavigating}
              >
                {isNavigating ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          }
        />

        <Page.Content>
          <Box direction="vertical" align="left" gap="SP4">
            {/* Form Selector */}
            <Box direction="vertical" align="left" gap="SP4" width="100%" backgroundColor="white" borderRadius="8px">
              <Card>
                <Card.Content>
                  <FormSelector
                    availableForms={availableForms}
                    selectedFormId={selectedFormId}
                    onFormSelect={setSelectedFormId}
                    loading={dataLoading}
                  />
                </Card.Content>
              </Card>
            </Box>

            {selectedForm ? (
              <Box direction="horizontal" align="left" gap="SP4" width="100%" borderRadius="8px">
                <Card hideOverflow>
                  {/* Tabs */}
                  <Tabs
                    activeId={activeTab}
                    onClick={(tab) => setActiveTab(Number(tab.id))}
                    items={[
                      { id: 1, title: 'Table Columns' },
                      { id: 2, title: 'Filters' },
                      { id: 3, title: 'Analytics' }
                    ]}
                  />

                  <Table
                    data={activeTab === 1 ? columnTableData : activeTab === 2 ? filterTableData : analyticsTableData as any}
                    columns={[]}
                    rowVerticalPadding="medium"
                  >
                    {/* Table Toolbar */}
                    <TableToolbar>
                      <TableToolbar.ItemGroup position="start">
                        <TableToolbar.Item>
                          {!isEditingFormName ? (
                            <Box direction="horizontal" gap="SP1" align="center">
                              <TableToolbar.Title>
                                {formTableSettingsStore.getCustomFormName(selectedFormId!) || selectedForm.name}
                              </TableToolbar.Title>
                              <TextButton
                                size="tiny"
                                onClick={() => setIsEditingFormName(true)}
                                underline="onHover"
                              >
                                Edit Name
                              </TextButton>
                            </Box>
                          ) : (
                            <Box direction="horizontal" gap="SP2" align="center" style={{ alignItems: "center" }}>
                              <Box width="200px">
                                <Tooltip
                                  content={`Leave empty to use default name: ${selectedForm.name}`}
                                  placement="bottom"
                                >
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
                                </Tooltip>
                              </Box>
                              <Button
                                size="small"
                                priority="secondary"
                                onClick={() => {
                                  if (selectedFormId) {
                                    updateFormName(selectedFormId, '');
                                    setIsEditingFormName(false);
                                    dashboard.showToast({
                                      message: 'Form name reset to default',
                                      type: 'success',
                                    });
                                  }
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                size="small"
                                priority="primary"
                                onClick={() => {
                                  setIsEditingFormName(false);
                                  dashboard.showToast({
                                    message: 'Form name updated',
                                    type: 'success',
                                  });
                                }}
                              >
                                Done
                              </Button>
                            </Box>
                          )}
                        </TableToolbar.Item>
                      </TableToolbar.ItemGroup>
                      <TableToolbar.ItemGroup position="end">
                        <TableToolbar.Item>
                          <Text size="small" color="secondary">
                            {activeTab === 1
                              ? `${visibleColumnsCount} of ${totalColumnsCount} columns visible`
                              : `${visibleFiltersCount} of ${totalFiltersCount} filters visible`
                            }
                          </Text>
                        </TableToolbar.Item>
                      </TableToolbar.ItemGroup>
                    </TableToolbar>

                    {/* Sticky Header with Select All */}
                    <Page.Sticky>
                      <Card>
                        <TableListHeader
                          options={activeTab === 1 ? columnHeaderOptions : activeTab === 2 ? filterHeaderOptions : analyticsHeaderOptions}
                          checkboxState={activeTab === 1 ? getColumnCheckboxState() : activeTab === 2 ? getFilterCheckboxState() : getAnalyticsCheckboxState()}
                          onCheckboxChange={activeTab === 1 ? handleSelectAllColumns : activeTab === 2 ? handleSelectAllFilters : handleSelectAllAnalytics}
                          onSortChange={() => { }} // No sorting needed for settings
                        />
                      </Card>
                    </Page.Sticky>

                    {/* Table Content using SortableListBase for drag and drop */}
                    <Card>
                      {(activeTab === 1 ? columnItems : activeTab === 2 ? filterItems : analyticsItems).length > 0 ? (
                        <SortableListBase
                          items={activeTab === 1 ? columnItems : activeTab === 2 ? filterItems : analyticsItems}
                          renderItem={activeTab === 1 ? renderColumnItem : activeTab === 2 ? renderFilterItem : renderAnalyticsItem}
                          onDrop={activeTab === 1 ? handleColumnDrop : activeTab === 2 ? handleFilterDrop : handleAnalyticDrop}
                          canDrag={activeTab === 1 ? canColumnDrag : activeTab === 2 ? canFilterDrag : canAnalyticsDrag}
                        />
                      ) : (
                        <Box padding="40px" textAlign="center">
                          <Text size="medium" color="secondary">
                            {activeTab === 1
                              ? "No fields available for this form"
                              : activeTab === 2
                                ? "No filterable fields available for this form"
                                : "No analytics available for this form"
                            }
                          </Text>
                        </Box>
                      )}
                    </Card>
                  </Table>
                </Card>

                {/* Settings Summary */}
                <Card>
                  <Card.Header title={activeTab === 1 ? "Column Summary" : activeTab === 2 ? "Filter Summary" : "Analytics Summary"} />
                  <Card.Content>
                    <Box minWidth="260px" align="left" direction="vertical" gap="SP2">
                      {activeTab === 1 ? (
                        <>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text align="bottom" size="small">Total Columns:</Text>
                            <Text align="bottom" size="small" weight="bold">{totalColumnsCount}</Text>
                          </Box>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text size="small">Visible Columns:</Text>
                            <Text size="small" align="bottom" weight="bold" color={visibleColumnsCount > 0 ? 'success' : 'warning'}>
                              {visibleColumnsCount}
                            </Text>
                          </Box>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text size="small" align="bottom">Hidden Columns:</Text>
                            <Text size="small" align="bottom" weight="bold">{totalColumnsCount - visibleColumnsCount}</Text>
                          </Box>
                        </>
                      ) : activeTab === 2 ? (
                        <>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text align="bottom" size="small">Total Filters:</Text>
                            <Text align="bottom" size="small" weight="bold">{totalFiltersCount}</Text>
                          </Box>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text size="small">Visible Filters:</Text>
                            <Text size="small" align="bottom" weight="bold" color={visibleFiltersCount > 0 ? 'success' : 'warning'}>
                              {visibleFiltersCount}
                            </Text>
                          </Box>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text size="small" align="bottom">Hidden Filters:</Text>
                            <Text size="small" align="bottom" weight="bold">{totalFiltersCount - visibleFiltersCount}</Text>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text align="bottom" size="small">Total Analytics:</Text>
                            <Text align="bottom" size="small" weight="bold">{totalAnalyticsCount}</Text>
                          </Box>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text size="small">Visible Analytics:</Text>
                            <Text size="small" align="bottom" weight="bold" color={visibleAnalyticsCount > 0 ? 'success' : 'warning'}>
                              {visibleAnalyticsCount}
                            </Text>
                          </Box>
                          <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                            <Text size="small" align="bottom">Hidden Analytics:</Text>
                            <Text size="small" align="bottom" weight="bold">{totalAnalyticsCount - visibleAnalyticsCount}</Text>
                          </Box>
                        </>
                      )}

                      {(activeTab === 1 ? settings : activeTab === 2 ? filterSettings : analyticsSettings)?.lastUpdated && (
                        <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                          <Text size="small" align="bottom">Last Updated:</Text>
                          <Text size="small" align="bottom" weight="bold" color="secondary">
                            {new Date((activeTab === 1 ? settings : activeTab === 2 ? filterSettings : analyticsSettings)!.lastUpdated).toLocaleDateString()}
                          </Text>
                        </Box>
                      )}

                      {selectedForm && (
                        <Box direction="horizontal" gap="SP2" style={{ alignItems: "center" }}>
                          <Text size="small" align="bottom">Form:</Text>
                          <Text size="small" align="bottom" weight="bold" color="secondary">
                            {selectedForm.name}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Card.Content>
                </Card>
              </Box>
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
                  Choose a form from the dropdown above to configure its settings.
                </Text>
              </Box>
            )}
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

// Helper functions
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
    case FieldType.SELECT:
      return <Icons.Dropdown size="16px" />;
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
    case FieldType.SELECT:
      return 'Select';
    case FieldType.TEXT:
      return 'Text';
    default:
      return 'Unknown';
  }
}

function getAnalyticTypeLabel(type: string): string {
  switch (type) {
    case 'total_submissions':
      return 'Total';
    case 'submissions_over_time':
      return 'Timeline';
    case 'field_distribution':
      return 'Distribution';
    case 'field_stats':
      return 'Statistics';
    case 'top_values':
      return 'Top Values';
    case 'completion_rate':
      return 'Completion';
    default:
      return 'Analytics';
  }
}

function getAnalyticIcon(type: string): React.ReactNode {
  switch (type) {
    case 'total_submissions':
      return <Icons.Number size="16px" />;
    case 'submissions_over_time':
      return <Icons.Date size="16px" />;
    case 'field_distribution':
      return <Icons.Statistics size="16px" />;
    case 'field_stats':
      return <Icons.StatisticsHorizontal size="16px" />;
    case 'top_values':
      return <Icons.List size="16px" />;
    case 'completion_rate':
      return <Icons.StatisticsHorizontal size="16px" />;
    default:
      return <Icons.Statistics size="16px" />;
  }
}

function getChartTypeLabel(chartType?: string): string {
  switch (chartType) {
    case 'pie':
      return 'Pie Chart';
    case 'bar':
      return 'Bar Chart';
    case 'line':
      return 'Line Chart';
    case 'stat_card':
      return 'Stat Card';
    default:
      return 'Chart';
  }
}

function getChartIcon(chartType?: string): React.ReactNode {
  switch (chartType) {
    case 'pie':
      return <Icons.PieChart size="16px" />;
    case 'bar':
      return <Icons.BarChartSplit size="16px" />;
    case 'line':
      return <Icons.LineChart size="16px" />;
    case 'stat_card':
      return <Icons.Statistics size="16px" />;
    default:
      return <Icons.Statistics size="16px" />;
  }
}

export default observer(SettingsPage);