// import { list } from 'aws-amplify/storage';
import { useEffect, useState, useMemo } from 'react';
// import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  Divider,
} from "@aws-amplify/ui-react";
import { UploadButton } from "../utils/UploadButton";
import Breadcrumbs from "../utils/Breadcrumbs"
import { useReceivedCases } from '../../hooks/cases';
import { useUser } from '../../context/UserContext';
import { useListS3Objects } from '../../hooks/lists3objects';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';

import CasesGrid from '../utils/CaseTable';
import { CreateFolder } from '../utils/CreateFolder';


export const Received = () => {
  const { user_name } = useUser()
  const [filesLoading, setFilesLoading] = useState(true);
  const {data: receivedCases, isLoading: casesLoading} = useReceivedCases(user_name)
  const cases = receivedCases?.cases;
  const [files, setFiles] = useState<any[]>([]);
  const [baseKey, setBaseKey] = useState<string | null>(null); // case root
  const [activeCase, setActiveCase] = useState<null | {
    caseNumber: string;
    canWrite: boolean;
  }>(null);
  const isInsideCase = activeCase !== null;
  const [pathStack, setPathStack] = useState<string[]>([]);
  const currentPath = pathStack.join('');
  
  const currentCaseNumber = pathStack.length > 0 ? pathStack[0].replace('/', '') : null;
  
  const {
    data: evidenceData,
    isLoading: isEvidenceLoading,
    isFetching: isEvidenceFetching,
    refetch: refetchEvidence,
  } = useCaseEvidence(currentCaseNumber ?? '');

  const evidenceByKey = useMemo(() => {
    const map = new Map<string, any>();
    evidenceData?.items?.forEach(ev => {
      map.set(ev.source_key, ev);
      
      const filename = ev.source_key?.split('/').pop();
      if (filename) {
        map.set(filename, ev);
      }
    });
    return map;
  }, [evidenceData]);

  


  const normalizedBaseKey = baseKey
  ? baseKey.endsWith('/')
    ? baseKey
    : `${baseKey}/`
  : null;
  const currentPrefix = normalizedBaseKey
  ? `${normalizedBaseKey}${pathStack.length ? pathStack.join('')  : ''}`
  : null;

  const { data: receivedFiles} = useListS3Objects(currentPrefix);
  const isRoot = baseKey === null;
  const viewMode = isRoot ? "received" : "files";
  

  
  useEffect(() => {
  if (!receivedFiles) return;

  setFilesLoading(true);

  try {
    const mergedItems = receivedFiles.map((item) => {
      if (item.type === "folder") return item;

      const fullKey = item.Key;
      const fileName = fullKey.split("/").pop() || ''
      const metadata =
        evidenceByKey.get(fullKey) ||
        evidenceByKey.get(fileName) ||
        null;
      return {
        ...item,
        ...metadata,
      };
    });
    setFiles(mergedItems);
  } catch (err) {
    console.error("Error listing files", err);
  } finally {
    setFilesLoading(false);
  }
}, [receivedFiles, evidenceByKey, currentPath]);

  

  const removeLastPathSegment = (key: string) => {
  if (!key) return key;

  const normalized = key.endsWith('/') ? key.slice(0, -1) : key;
  return normalized.substring(0, normalized.lastIndexOf('/') + 1);
};

function handleRowClick(params: any) {
    const row = params.row
    setFilesLoading(true); 

    let name: string;
    if(viewMode === 'received'){
      name = row.case_number
      setBaseKey(
          removeLastPathSegment(row.source_key)
        );
        setPathStack([`${row.case_number}/`]);
        setActiveCase({
          caseNumber: row.case_number,
          canWrite: row.permissions === "Read / Update"? true: false 
        });
    }
    else{
      name = row.name
      setPathStack(prev => [...prev, `${name}/`]);
    }
  }

  return (
    <>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="0.75rem 0"
      >
        <Heading level={5}>Files</Heading>

        <Flex gap="0.5rem">

    
           {isInsideCase && activeCase.canWrite && (
            <CreateFolder
              basePath={`${baseKey}${pathStack.join('')}`}
              receivedTab={true}
              onCreated={() => {
              }}
            />
           )}
            
          {isInsideCase && activeCase.canWrite && (
            <UploadButton
              prefix={`${baseKey}${pathStack.join('')}`}
              onUploaded={async () => {
                // Refetch evidence metadata after upload
                if (currentCaseNumber) {
                  setTimeout(() => {
                    refetchEvidence();
                  }, 500);
                }
              }}
            />
          )}
        </Flex>
      </Flex>

      <Divider />

      
     

      <Breadcrumbs 
        pathStack={pathStack}
        onNavigate={(x: string[]) => {
          setFilesLoading(true)
          setPathStack(x)
        }}
        onExitCase={() => {
          setActiveCase(null)
          setFiles([]);
          setBaseKey(null);
          setFilesLoading(true)
          setPathStack([]);
      }}/>

      <CasesGrid
        data={viewMode === "received" ? cases || [] : files || []}
        loading={viewMode === "received" ? casesLoading : filesLoading}
        handleRowClick={handleRowClick}
        viewMode={viewMode}
      />

      {!isRoot && pathStack.length === 1 && (isEvidenceLoading || isEvidenceFetching) && (
        <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
          Loading evidence metadata...
        </div>
      )}
    </>
  );
};

export default Received;