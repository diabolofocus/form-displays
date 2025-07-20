// ==============================================
// FIXED: 5. src/dashboard/pages/components/SearchBar.tsx
// ==============================================

import React from 'react';
import { Search, Button, Box } from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';

interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    onSearchChange,
    onRefresh,
    totalResults,
}) => {
    return (
        <Box direction="horizontal" gap="SP4" align="center">
            <Box flexGrow={1}>
                <Search
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Suchen.."
                    size="medium"
                />
            </Box>
            <Box direction="horizontal" gap="SP3" align="center">
                <span>{totalResults} Patienten</span>
                <Button
                    onClick={onRefresh}
                    prefixIcon={<Icons.Refresh />}
                    priority="secondary"
                    size="medium"
                >
                    Aktualisieren
                </Button>
            </Box>
        </Box>
    );
};