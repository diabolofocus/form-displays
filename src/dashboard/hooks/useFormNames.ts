import { useState, useEffect } from 'react';
import { collections } from '@wix/data';

interface FormInfo {
    formId: string;
    displayName: string;
    submissionCount: number;
}

export const useFormNames = (formIds: string[]) => {
    const [formNames, setFormNames] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchFormNames = async () => {
            if (formIds.length === 0) return;

            setIsLoading(true);
            try {
                // Get all data collections
                const response = await collections.listDataCollections();

                // Create a map of formId -> displayName
                const nameMap: Record<string, string> = {};

                // Check if collections exists and is an array
                if (response.collections && Array.isArray(response.collections)) {
                    response.collections.forEach(collection => {
                        // Check if collection._id exists and matches any of our form IDs
                        if (collection._id && formIds.includes(collection._id)) {
                            nameMap[collection._id] = collection.displayName || collection._id;
                        }
                    });
                } else {
                    console.warn('No collections found in response or collections is not an array');
                }

                console.log('Form names fetched:', nameMap);
                setFormNames(nameMap);
            } catch (error) {
                console.error('Error fetching form names:', error);
                // Fallback: create map with IDs as names
                const fallbackMap: Record<string, string> = {};
                formIds.forEach(id => {
                    fallbackMap[id] = id;
                });
                setFormNames(fallbackMap);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFormNames();
    }, [formIds.join(',')]); // Re-run when formIds change

    const getFormName = (formId: string): string => {
        return formNames[formId] || formId;
    };

    return {
        formNames,
        getFormName,
        isLoading
    };
};