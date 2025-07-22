// ==============================================
// UPDATED: src/dashboard/pages/patienten/page.tsx - With Filter Integration
// ==============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Page,
  WixDesignSystemProvider,
  Button,
  Box,
  Text,
  Heading,
  Modal,
  MessageModalLayout,
  TextButton,
  Loader,
  Card,
  Badge
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { usePatientData } from '../../hooks/usePatientData';
import { useForms } from '../../hooks/useForms';
import { FormSelector } from '../../components/FormSelector';
import { GenericSubmissionTable } from '../../components/GenericSubmissionTable';
import { StatisticsCards } from '../../components/StatisticsCards';
import { PatientDetailsModal } from '../../components/PatientDetailsModal';
import { FilterSidePanel } from '../../components/FilterSidePanel';
import { printPatientDetails } from '../../utils/printUtils';
import { applyFilters, getFilterSummary } from '../../utils/filterUtils';
import { submissions } from '@wix/forms';
import { GenericSubmission, PatientSubmission } from '../../types';
import { useFormTableSettings } from '../../hooks/useFormTableSettings';
import { useFilterSettings } from '../../hooks/useFilterSettings';
import { FilterValue } from '../../components/GenericFilterPanel';
import { observer } from 'mobx-react-lite';

declare global {
  interface Window {
    wixFormDashboardSettings?: import('../../hooks/useSettings').FormSettings[];
    wixCurrentFormId?: string;
    wixFormStoreInitialized?: boolean;
  }
}

const GenericFormDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<GenericSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<GenericSubmission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submissionToEdit, setSubmissionToEdit] = useState<GenericSubmission | null>(null);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebug, setShowDebug] = useState(true);

  // Filter state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);

  // Use the patient data hook (now returns GenericSubmission[])
  const {
    allSubmissions,
    loading,
    error,
    loadSubmissions,
    calculateAgeGroups,
    calculateGenderGroups
  } = usePatientData();

  const {
    availableForms,
    selectedFormId,
    setSelectedFormId,
    selectedForm,
    selectedFormSubmissions
  } = useForms(allSubmissions);

  const {
    settings: tableSettings,
    visibleColumns
  } = useFormTableSettings(selectedFormId, selectedForm?.fields || []);

  const {
    visibleFilters
  } = useFilterSettings(selectedFormId, selectedForm?.fields || []);

  // Apply filters to submissions
  const filteredSubmissions = useMemo(() => {
    return applyFilters(selectedFormSubmissions, activeFilters);
  }, [selectedFormSubmissions, activeFilters]);

  // Debug logging to ensure form ID is being passed correctly
  useEffect(() => {
    if (selectedFormId && selectedForm) {
      console.log('Main page - Selected form ID:', selectedFormId);
      console.log('Main page - Selected form:', selectedForm);

      // Store current form ID for navigation
      if (typeof window !== 'undefined') {
        window.wixCurrentFormId = selectedFormId;
      }
    }
  }, [selectedFormId, selectedForm]);

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const berlinTime = now.toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const berlinDate = now.toLocaleDateString('de-DE', {
        timeZone: 'Europe/Berlin',
        day: 'numeric',
        month: 'long'
      });

      setCurrentTime(berlinTime);
      setCurrentDate(berlinDate);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clear filters when form changes
  useEffect(() => {
    setActiveFilters([]);
  }, [selectedFormId]);

  // Calculate statistics based on filtered submissions
  const statistics = useMemo(() => {
    // For backward compatibility, cast to PatientSubmission for statistics
    const patientSubmissions = filteredSubmissions as PatientSubmission[];

    return {
      ageGroups: calculateAgeGroups(patientSubmissions),
      genderGroups: calculateGenderGroups(patientSubmissions),
      waitingTime: { months: 7, days: 23 } // You can calculate this based on real data
    };
  }, [filteredSubmissions, calculateAgeGroups, calculateGenderGroups]);

  if (loading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Box textAlign="center" padding="80px">
            <Loader />
            <Text>Loading form data...</Text>
          </Box>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  if (error) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Box textAlign="center" padding="40px">
            <Text>Error loading data: {error}</Text>
            <Button onClick={loadSubmissions}>Try again</Button>
          </Box>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  const handleRefresh = async () => {
    dashboard.showToast({
      message: 'Updating data...',
      type: 'success',
    });
    await loadSubmissions();
  };

  const handleAddNewRegistration = () => {
    dashboard.showToast({
      message: 'New form feature not yet available',
      type: 'standard',
    });
  };

  const handleViewSubmission = (submission: GenericSubmission) => {
    console.log('handleViewSubmission called with:', submission);
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handlePrintSubmission = (submission: GenericSubmission) => {
    console.log('Printing submission:', submission);
    printPatientDetails(submission as PatientSubmission);
  };

  const handleEditSubmission = (submission: GenericSubmission) => {
    console.log('Editing submission:', submission);
    dashboard.showToast({
      message: 'Edit function will be available soon',
      type: 'standard',
    });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    console.log('handleDeleteSubmission called with ID:', submissionId);

    const submission = filteredSubmissions.find(s => s._id === submissionId);
    console.log('Found submission:', submission);

    setSubmissionToDelete(submission || null);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    try {
      console.log('Deleting submission with ID:', submissionToDelete._id);

      await submissions.deleteSubmission(submissionToDelete._id, {
        permanent: false
      });

      dashboard.showToast({
        message: 'Submission deleted successfully',
        type: 'success',
      });

      setIsDeleteModalOpen(false);
      setSubmissionToDelete(null);
      await loadSubmissions();

    } catch (error) {
      console.error('Error deleting submission:', error);
      dashboard.showToast({
        message: 'Error deleting submission',
        type: 'error',
      });
    }
  };

  const cancelDeleteSubmission = () => {
    setIsDeleteModalOpen(false);
    setSubmissionToDelete(null);
  };

  const getSubmissionDisplayName = (submission: GenericSubmission): string => {
    if (!selectedForm) return submission._id.slice(0, 8);

    const nameField = selectedForm.fields.find(f =>
      f.name.toLowerCase().includes('name') ||
      f.name.toLowerCase().includes('vorname')
    );

    if (nameField) {
      const value = submission.submissions[nameField.name];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    const firstField = selectedForm.fields.find(f => {
      const value = submission.submissions[f.name];
      return typeof value === 'string' && value.trim();
    });

    if (firstField) {
      const value = submission.submissions[firstField.name];
      return String(value).slice(0, 30);
    }

    return `Submission ${submission._id.slice(0, 8)}`;
  };

  const handleNavigateToSettings = () => {
    // Form persistence is handled by useForms hook automatically
    dashboard.navigate({
      pageId: '4e98db9d-26ac-4e7c-b093-782182280fb6'
    });
  };

  const handleOpenFilters = () => {
    setIsFilterPanelOpen(true);
  };

  const handleCloseFilters = () => {
    setIsFilterPanelOpen(false);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    setActiveFilters(filters);
    dashboard.showToast({
      message: getFilterSummary(filters),
      type: 'success',
    });
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    dashboard.showToast({
      message: 'All filters cleared',
      type: 'success',
    });
  };

  const handleRemoveFilter = (fieldName: string) => {
    const newFilters = activeFilters.filter(filter => filter.fieldName !== fieldName);
    setActiveFilters(newFilters);
    dashboard.showToast({
      message: `Filter "${fieldName}" removed`,
      type: 'success',
    });
  };


  const getFilterButtonText = () => {
    if (activeFilters.length === 0) return 'Filters';
    if (activeFilters.length === 1) return '1 Filter';
    return `${activeFilters.length} Filters`;
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page minWidth={950}>
        <Page.Header
          title="Form Submissions Dashboard"
          subtitle="Manage and view form submissions across all your forms"
          actionsBar={
            <Box direction="horizontal" gap="SP3">
              <Button
                onClick={handleNavigateToSettings}
                prefixIcon={<Icons.Settings />}
                priority="secondary"
                disabled={!selectedForm}
              >
                Table Settings
              </Button>
              <Button
                onClick={handleRefresh}
                prefixIcon={<Icons.Refresh />}
                priority="secondary"
              >
                Refresh
              </Button>
              <Button
                onClick={handleAddNewRegistration}
                prefixIcon={<Icons.Add />}
                disabled={true}
              >
                New Form
              </Button>
            </Box>
          }
        />

        <Page.Content>
          <Box direction="vertical" gap="SP4">
            {/* Form Selector */}
            <Card>
              <Card.Content>
                <Box direction="horizontal" gap="SP4" align="center" style={{ justifyContent: "space-between" }}>
                  <FormSelector
                    availableForms={availableForms}
                    selectedFormId={selectedFormId}
                    onFormSelect={setSelectedFormId}
                    loading={loading}
                  />
                  <Box direction="horizontal" gap="SP2" align="center">
                    {activeFilters.length > 0 && (
                      <Box direction="horizontal" gap="SP2" align="center">
                        <Badge skin="primary" size="small">
                          {getFilterSummary(activeFilters)}
                        </Badge>
                        <TextButton
                          size="small"
                          onClick={handleClearAllFilters}
                          skin="destructive"
                        >
                          Clear
                        </TextButton>
                      </Box>
                    )}
                    <TextButton
                      suffixIcon={<Icons.InfoCircle size="20px" />}
                      size="small"
                      underline="always"
                      onClick={() => setIsWhatsNewOpen(true)}
                      skin="standard"
                    >
                      Info
                    </TextButton>
                  </Box>
                </Box>
              </Card.Content>
            </Card>

            {/* Statistics Cards */}
            {/* {selectedForm && filteredSubmissions.length > 0 && (
              <StatisticsCards
                totalPatients={filteredSubmissions.length}
                waitingTime={statistics.waitingTime}
                ageGroups={statistics.ageGroups}
                genderGroups={statistics.genderGroups}
                currentTime={currentTime}
                currentDate={currentDate}
              />
            )} */}

            {/* Main Content */}
            {selectedForm ? (
              <GenericSubmissionTable
                key={selectedFormId} // Force re-render when form changes
                submissions={filteredSubmissions}
                formFields={selectedForm.fields}
                visibleColumns={visibleColumns}
                columnSettings={tableSettings?.columns || []}
                formId={selectedFormId}
                formName={selectedForm.name}
                onViewSubmission={handleViewSubmission}
                onPrintSubmission={handlePrintSubmission}
                onDeleteSubmission={handleDeleteSubmission}
                onEditSubmission={handleEditSubmission}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                totalSubmissions={selectedFormSubmissions.length}
                filteredSubmissions={filteredSubmissions.length}
                activeFiltersCount={activeFilters.length}
                onOpenFilters={handleOpenFilters}
                onClearAllFilters={handleClearAllFilters}
                onRemoveFilter={handleRemoveFilter}
                activeFilters={activeFilters}
              />
            ) : (
              <Box
                textAlign="center"
                padding="40px"
                backgroundColor="white"
                borderRadius="8px"
                border="1px solid #e0e0e0"
              >
                <Text size="medium" weight="bold" marginBottom="SP2">
                  No form selected
                </Text>
                <Text size="medium" color="secondary">
                  Choose a form from the dropdown above to view submissions.
                </Text>
              </Box>
            )}
          </Box>
        </Page.Content>
      </Page>

      {/* Filter Side Panel */}
      {selectedForm && (
        <FilterSidePanel
          isOpen={isFilterPanelOpen}
          onClose={handleCloseFilters}
          formId={selectedFormId}
          formFields={selectedForm.fields}
          submissions={selectedFormSubmissions}
          onFiltersApply={handleApplyFilters}
          currentFilters={activeFilters}
        />
      )}

      {/* Modals */}
      {isModalOpen && selectedSubmission && (
        <PatientDetailsModal
          patient={selectedSubmission as PatientSubmission}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onPrint={handlePrintSubmission}
        />
      )}

      {isDeleteModalOpen && submissionToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onRequestClose={cancelDeleteSubmission}
          shouldCloseOnOverlayClick={true}
          screen="desktop"
        >
          <MessageModalLayout
            theme="destructive"
            onCloseButtonClick={cancelDeleteSubmission}
            primaryButtonText="Delete"
            secondaryButtonText="Cancel"
            primaryButtonOnClick={confirmDeleteSubmission}
            secondaryButtonOnClick={cancelDeleteSubmission}
            title="Delete submission"
            content={
              <Text>
                You are about to delete the submission <b>{getSubmissionDisplayName(submissionToDelete)}</b>.
                It can be restored later from the trash collection.
              </Text>
            }
          />
        </Modal>
      )}

      <Modal
        isOpen={isWhatsNewOpen}
        onRequestClose={() => setIsWhatsNewOpen(false)}
        shouldCloseOnOverlayClick={true}
        screen="desktop"
      >
        <Box padding="24px" background="white" direction="vertical" borderRadius="8px" gap="16px">
          <Box textAlign="left">
            <Text size="medium" weight="bold" marginBottom="16px">Generic Form Dashboard</Text>
          </Box>

          <Box textAlign="left" direction="vertical" align="left">
            <Box direction="vertical" gap="8px" marginBottom="16px" textAlign="left">
              <Text>•  Now supports all Wix forms automatically</Text>
              <Text>•  Dynamic form selection via dropdown</Text>
              <Text>•  Automatic field detection and display</Text>
              <Text>•  Smart column arrangement based on field types</Text>
              <Text>•  Enhanced data display for arrays, objects, and images</Text>
              <Text>•  Generic search function across all fields</Text>
              <Text>•  Automatic type detection (email, phone, date, etc.)</Text>
              <Text>•  NEW: Table Settings - configure column visibility and order</Text>
              <Text>•  NEW: Advanced Filters - filter by any field type</Text>
            </Box>

            <Box textAlign="left" marginTop="16px">
              <Text size="medium" weight="bold" marginBottom="16px">Features</Text>
            </Box>
            <Box direction="vertical" gap="8px" marginTop="16px" textAlign="left">
              <Text>•  Select a form from the dropdown list</Text>
              <Text>•  All form fields are automatically displayed as table columns</Text>
              <Text>•  Use "Table Settings" to hide/show columns and reorder them</Text>
              <Text>•  Use "Filters" to filter data by any field type</Text>
              <Text>•  Search works across all text fields</Text>
              <Text>•  Click on date columns to sort</Text>
              <Text>•  Arrays displayed as tags, objects as structured data</Text>
              <Text>•  Images and files shown with previews</Text>
              <Text>•  Settings are automatically saved per form</Text>
              <Text>•  Filters adapt to field types (text, date, number, boolean, etc.)</Text>
            </Box>

            <Box direction="horizontal" gap="12px" align="right" marginTop="24px">
              <Button
                onClick={() => setIsWhatsNewOpen(false)}
                priority="primary"
              >
                Got it
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </WixDesignSystemProvider>
  );
};

export default observer(GenericFormDashboard);
