
// ==============================================
// FIXED: 2. src/dashboard/pages/utils/helpers.ts
// ==============================================

import { PatientSubmission, WaitingTime } from '../types'; // Add imports

export const formatToGermanDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Ungültiges Datum";

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
};

export const calculateAge = (birthDate: string): string => {
    const today = new Date();
    const birth = new Date(birthDate);

    if (isNaN(birth.getTime())) {
        return 'Ungültiges Datum';
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        years--;
        months += 12;
    }

    return `${years} Jahre, ${months} Mo`;
};

export const determineAgeGroup = (birthDate?: string): string | null => {
    if (!birthDate) return null;

    const today = new Date();
    const birthDateObj = new Date(birthDate);

    if (isNaN(birthDateObj.getTime())) return null;

    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }

    if (age <= 12) {
        return 'kind';
    } else if (age <= 17) {
        return 'teen';
    } else if (age <= 120) {
        return 'erwachsene';
    }
    return null;
};

export const calculateWaitingTime = (submissions: PatientSubmission[]): WaitingTime => {
    if (!submissions.length) {
        return { months: 0, days: 0 };
    }

    const oldestSubmission = submissions.reduce((oldest, submission) => {
        const date5bd8 = submission.submissions?.date_5bd8 || submission._createdDate;
        if (!date5bd8) return oldest;

        const oldestDate = oldest.submissions?.date_5bd8 || oldest._createdDate;

        return new Date(date5bd8) < new Date(oldestDate) ? submission : oldest;
    }, submissions[0]);

    if (oldestSubmission) {
        const oldestDate = oldestSubmission.submissions?.date_5bd8 || oldestSubmission._createdDate;
        const today = new Date();
        const oldestDateObj = new Date(oldestDate);
        const timeDifference = today.getTime() - oldestDateObj.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
        const monthsDifference = Math.floor(daysDifference / 30);
        const remainingDays = daysDifference % 30;

        return { months: monthsDifference, days: remainingDays };
    }

    return { months: 0, days: 0 };
};
