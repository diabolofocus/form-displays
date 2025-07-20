// ==============================================
// UPDATED: src/dashboard/pages/hooks/usePatientData.ts - Generic Support
// ==============================================

import { useState, useEffect } from 'react';
import { submissions } from '@wix/forms';
import { GenericSubmission, PatientSubmission, AgeGroups, GenderGroups } from '../types';

export const usePatientData = () => {
    const [allSubmissions, setAllSubmissions] = useState<GenericSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubmissions = async () => {
        setLoading(true);
        setError(null);

        try {
            let allData: GenericSubmission[] = [];
            let keepLoading = true;
            let lastItem: any = null;

            while (keepLoading) {
                let query = submissions.querySubmissionsByNamespace()
                    .eq("namespace", "wix.form_app.form")
                    .descending("_createdDate")
                    .limit(100);

                if (lastItem) {
                    query = query.lt("_createdDate", lastItem._createdDate);
                }

                const results = await query.find();

                if (results.items.length > 0) {
                    // Debug logging for the first item
                    if (allData.length === 0) {
                        console.log('=== DEBUG: First submission item from API ===');
                        console.log('Raw item:', results.items[0]);
                        console.log('FormId:', results.items[0].formId);
                        console.log('Revision:', results.items[0].revision);
                        console.log('Status:', results.items[0].status);
                        console.log('Submissions keys:', Object.keys(results.items[0].submissions || {}));
                    }

                    // Type assertion to match our generic interface
                    const typedItems = results.items.map(item => ({
                        _id: item._id || '',
                        _createdDate: item._createdDate || '',
                        _updatedDate: item._updatedDate || '',
                        formId: item.formId || '',
                        namespace: item.namespace || '',
                        status: item.status || '',
                        revision: item.revision || '',
                        seen: item.seen || false,
                        submitter: item.submitter || {},
                        submissions: item.submissions || {}
                    })) as GenericSubmission[];

                    allData = [...allData, ...typedItems];
                    lastItem = results.items[results.items.length - 1];
                    keepLoading = results.items.length === 100 && allData.length < 500; // Increased limit
                } else {
                    keepLoading = false;
                }
            }

            console.log(`Loaded ${allData.length} submissions from ${new Set(allData.map(s => s.formId)).size} forms`);
            setAllSubmissions(allData);
        } catch (err) {
            console.error('Error loading submissions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    // Calculate age groups - works with generic submissions by detecting birth date fields
    const calculateAgeGroups = (submissions: GenericSubmission[]): AgeGroups => {
        const ageGroups = { kids: 0, teenagers: 0, adults: 0 };

        submissions.forEach(submission => {
            // Try to find a birth date field
            const birthDateField = Object.keys(submission.submissions).find(key =>
                key.toLowerCase().includes('geburt') ||
                key.toLowerCase().includes('birth') ||
                key.toLowerCase().includes('dob')
            );

            if (!birthDateField) return;

            const birthDate = submission.submissions[birthDateField];
            if (!birthDate || typeof birthDate !== 'string') return;

            const today = new Date();
            const birthDateObj = new Date(birthDate);
            if (isNaN(birthDateObj.getTime())) return;

            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }

            if (age <= 12) {
                ageGroups.kids++;
            } else if (age <= 18) {
                ageGroups.teenagers++;
            } else if (age <= 120) {
                ageGroups.adults++;
            }
        });

        return ageGroups;
    };

    // Calculate gender groups - works with generic submissions by detecting gender fields
    const calculateGenderGroups = (submissions: GenericSubmission[]): GenderGroups => {
        const genderGroups = { men: 0, women: 0, divers: 0 };

        submissions.forEach(submission => {
            // Try to find a gender field
            const genderField = Object.keys(submission.submissions).find(key =>
                key.toLowerCase().includes('geschlecht') ||
                key.toLowerCase().includes('gender') ||
                key.toLowerCase().includes('sex')
            );

            if (!genderField) return;

            const gender = submission.submissions[genderField];
            if (!gender || typeof gender !== 'string') return;

            const genderLower = gender.toLowerCase();
            if (genderLower.includes('männ') || genderLower.includes('male') || genderLower.includes('herr')) {
                genderGroups.men++;
            } else if (genderLower.includes('weibl') || genderLower.includes('female') || genderLower.includes('frau') || genderLower.includes('dame')) {
                genderGroups.women++;
            } else if (genderLower.includes('divers') || genderLower.includes('other') || genderLower.includes('non-binary')) {
                genderGroups.divers++;
            }
        });

        return genderGroups;
    };

    return {
        allSubmissions,
        loading,
        error,
        loadSubmissions,
        calculateAgeGroups,
        calculateGenderGroups,
    };
};