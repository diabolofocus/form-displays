// import React, { useState } from 'react';
// import { Box, Button, Text } from '@wix/design-system';
// import { items } from '@wix/data';

// export const NotesDebug: React.FC = () => {
//     const [debugInfo, setDebugInfo] = useState<string>('');
//     const [loading, setLoading] = useState(false);

//     const testDirectQuery = async () => {
//         setLoading(true);
//         try {
//             console.log('🔍 Testing direct query...');

//             // Query first 10 notes
//             const results = await items.query("Notes")
//                 .limit(10)
//                 .find();

//             console.log('📋 Direct query results:', results);

//             const debugData = {
//                 totalCount: results.totalCount,
//                 itemsReturned: results.items.length,
//                 items: results.items.map(item => ({
//                     _id: item._id,
//                     submissionId: item.submissionId,
//                     email: item.email,
//                     name: item.name,
//                     notes: item.notes,
//                     notesLength: item.notes?.length || 0
//                 }))
//             };

//             setDebugInfo(JSON.stringify(debugData, null, 2));
//         } catch (error) {
//             console.error('❌ Direct query error:', error);
//             setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const testSpecificSubmission = async () => {
//         setLoading(true);
//         try {
//             // Use one of the submission IDs from your error log
//             const submissionId = '1d920377-9b76-4f9d-b366-fff3fc17258d';
//             console.log('🔍 Testing specific submission:', submissionId);

//             const results = await items.query("Notes")
//                 .eq("submissionId", submissionId)
//                 .limit(1)
//                 .find();

//             console.log('📋 Specific query results:', results);

//             const debugData = {
//                 submissionId,
//                 found: results.items.length > 0,
//                 item: results.items.length > 0 ? results.items[0] : null
//             };

//             setDebugInfo(JSON.stringify(debugData, null, 2));
//         } catch (error) {
//             console.error('❌ Specific query error:', error);
//             setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <Box direction="vertical" gap="SP2" padding="16px">
//             <Text size="medium" weight="bold">Notes Collection Debug</Text>

//             <Box direction="horizontal" gap="SP2">
//                 <Button
//                     onClick={testDirectQuery}
//                     disabled={loading}
//                     size="small"
//                 >
//                     Query All Notes
//                 </Button>
//                 <Button
//                     onClick={testSpecificSubmission}
//                     disabled={loading}
//                     size="small"
//                 >
//                     Query Specific Submission
//                 </Button>
//             </Box>

//             {debugInfo && (
//                 <Box>
//                     <Text size="small" weight="bold">Debug Results:</Text>
//                     <Box
//                         padding="8px"
//                         backgroundColor="#f5f5f5"
//                         borderRadius="4px"
//                         style={{
//                             fontFamily: 'monospace',
//                             fontSize: '12px',
//                             whiteSpace: 'pre-wrap',
//                             maxHeight: '400px',
//                             overflow: 'auto'
//                         }}
//                     >
//                         <Text size="tiny">{debugInfo}</Text>
//                     </Box>
//                 </Box>
//             )}
//         </Box>
//     );
// };