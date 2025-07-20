
// ==============================================
// 12. src/backend/data.web.js (Backend API for Notes)
// ==============================================

import { webMethod, Permissions } from '@wix/web-method';
import wixData from 'wix-data';
import { elevate } from '@wix/auth';

// Get note for submission
export const getNoteForSubmission = webMethod(
    Permissions.Anyone,
    async (submissionId) => {
        try {
            const results = await elevate(wixData.query)("Notes")
                .eq("submissionId", submissionId)
                .limit(1)
                .find();

            return {
                success: true,
                note: results.items.length > 0 ? results.items[0] : null
            };
        } catch (error) {
            console.error('Error fetching note:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
);

// Create or update note
export const saveNote = webMethod(
    Permissions.Anyone,
    async (submissionId, email, name, noteText, noteId = null) => {
        try {
            if (noteId) {
                // Update existing note
                const result = await elevate(wixData.update)("Notes", {
                    _id: noteId,
                    submissionId,
                    email,
                    name,
                    notes: noteText
                });
                return { success: true, note: result };
            } else {
                // Create new note
                const result = await elevate(wixData.insert)("Notes", {
                    submissionId,
                    email,
                    name,
                    notes: noteText
                });
                return { success: true, note: result };
            }
        } catch (error) {
            console.error('Error saving note:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
);