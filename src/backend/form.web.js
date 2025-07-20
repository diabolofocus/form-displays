import { webMethod, Permissions } from '@wix/web-method';
import { submissions } from '@wix/forms';
import { auth } from '@wix/essentials';

// Create elevated updateSubmission function
const elevatedUpdateSubmission = auth.elevate(submissions.updateSubmission);

export const updateFormSubmission = webMethod(
    Permissions.Anyone,
    async (submissionId, updateData) => {
        try {
            console.log('Backend: Updating submission with ID:', submissionId);
            console.log('Backend: Update data:', updateData);

            // Add validation for required fields
            const requiredFields = ['formId', 'revision'];
            const missingFields = requiredFields.filter(field => !updateData[field] || updateData[field].trim() === '');

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Add auth headers explicitly
            const result = await elevatedUpdateSubmission(submissionId, updateData, {
                auth: {
                    authRequest: {
                        public: true
                    }
                }
            });

            console.log('Backend: Update successful:', result);
            return { success: true, submission: result };
        } catch (error) {
            console.error('Backend: Detailed error:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            return {
                success: false,
                error: error.message || 'Failed to update submission',
                status: error.response?.status
            };
        }
    }
);

// Get all form submissions
export const getFormSubmissions = webMethod(
    Permissions.Anyone,
    async () => {
        try {
            const results = await auth.elevate(submissions.querySubmissionsByNamespace)()
                .eq("namespace", "wix.form_app.form")
                .descending("_createdDate")
                .limit(1000)
                .find();

            return {
                success: true,
                submissions: results.items,
                totalCount: results.totalCount
            };
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);

// Delete a form submission
export const deleteFormSubmission = webMethod(
    Permissions.Anyone,
    async (submissionId) => {
        try {
            await auth.elevate(submissions.deleteSubmission)(submissionId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting submission:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);