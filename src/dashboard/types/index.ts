// ==============================================
// UPDATED: src/dashboard/pages/types/index.ts - Generic Form Support
// ==============================================

// Generic submission interface that can handle any form fields
export interface GenericSubmission {
    _id: string;
    _createdDate: string;
    _updatedDate?: string;
    formId: string;
    namespace: string;
    status: string;
    revision: string;
    seen?: boolean;
    submitter?: {
        applicationId?: string;
        memberId?: string;
        visitorId?: string;
        userId?: string;
    };
    submissions: Record<string, any>; // Dynamic form fields
}

// Legacy interface for backward compatibility
export interface PatientSubmission extends GenericSubmission {
    submissions: {
        name_1?: string;
        vorname?: string;
        email_726a?: string;
        geburtsdatum?: string;
        geschlecht?: string;
        date_5bd8?: string;
        waren_sie_schon_einmal_bei_uns_in_behandlung?: string;
        wurde_ein_hausbesuch_verordnet?: string;
        form_field_ab01?: boolean;
        montag?: string[];
        dienstag?: string[];
        mittwoch?: string[];
        donnerstag?: string[];
        freitag?: string[];
        address_51bd?: string;
        telefon?: string;
        diagnose_oder_grund_ihrer_anmeldung?: string;
        verordnende_r_aerztin_arzt?: string;
        krankenkasse?: string;
        ab_mailbox_activ?: string;
        name_der_anmeldenden_person?: string;
        verhaeltnis?: string;
        bei_volljaehrigen_patienten_zuzahlungsbefreit?: string;
        wuerden_sie_auch_kurzfristige_termine_wahrnehmen_koennen_wenn_z?: string;
        noch_etwas_wichtiges?: string;
        signature_3730?: { url?: string }[];
        [key: string]: any; // Allow additional fields
    };
}

// Form information
export interface FormInfo {
    formId: string;
    name: string; // We'll derive this from submissions or use formId
    submissionCount: number;
    fields: FormField[];
    lastSubmissionDate?: string;
}

// Form field information
export interface FormField {
    name: string;
    label: string; // Human-readable label
    type: FieldType;
    isRequired?: boolean;
    options?: string[]; // For dropdown/checkbox fields
    sampleValues?: any[]; // Sample values from submissions
}

// Field types we can detect
export enum FieldType {
    TEXT = 'text',
    EMAIL = 'email',
    DATE = 'date',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    ARRAY = 'array',
    OBJECT = 'object',
    PHONE = 'phone',
    URL = 'url',
    TEXTAREA = 'textarea',
    SELECT = 'select',
    CHECKBOX = 'checkbox',
    UNKNOWN = 'unknown'
}

// Generic filter state that adapts to any form
export interface GenericFilterState {
    selectedForm: string | null;
    searchTerm: string;
    fieldFilters: Record<string, FilterValue>; // field_name -> filter_value
    showDuplicatesOnly: boolean;
}

export interface FilterValue {
    type: 'text' | 'select' | 'date' | 'boolean' | 'number';
    value: any;
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

// Legacy filter state for backward compatibility
export interface FilterState {
    selectedDay: string | null;
    selectedTimeSlots: string[];
    selectedHomeVisit: string[];
    selectedAgeGroups: string[];
    selectedTreatment: string[];
    searchTerm: string;
    showDuplicatesOnly: boolean;
}

export interface AgeGroups {
    kids: number;
    teenagers: number;
    adults: number;
}

export interface GenderGroups {
    men: number;
    women: number;
    divers: number;
}

export interface WaitingTime {
    months: number;
    days: number;
}