import React from 'react'
import { list } from 'aws-amplify/storage';
import { useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth';
import { UploadButton } from './utils/UploadButton'

export const MyStorageBrowser = () => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function loadFiles() {
        try {
            const session = await fetchAuthSession();
            const identityId = session.identityId;
            console.log('identityId: ', identityId)
            if (!identityId) return;

            const result = await list({
                path: `private/${identityId}/`,
            });

            setFiles(result.items);
        } catch (err) {
            console.error('Error listing files', err);
        } finally {
            setLoading(false);
        }
        }

        loadFiles();
    }, []);

    if (loading) return <p>Loading files...</p>;

    return (
        <>
        <ul>
        {files.map((file) => (
            <li key={file.path}>
            {file.path}
            </li>
        ))}
        </ul>
        <UploadButton/>
        </>
    );
}

