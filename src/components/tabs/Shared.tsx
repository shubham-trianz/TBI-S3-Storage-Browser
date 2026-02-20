import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  Button,
} from "@aws-amplify/ui-react";
import Breadcrumbs from "../utils/Breadcrumbs"
import { useCases, useShareCaseTo } from '../../hooks/cases';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';
import CasesGrid from '../utils/CaseTable';
import ShareDialog from '../utils/ShareDialog';
import { useUser } from '../../context/UserContext';
import { useCognitoUser } from '../../hooks/users';
import toast from 'react-hot-toast';
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import amplifyConfig from '../../../amplify_outputs.json';
import { createS3Client } from '../s3.service'



export const Shared = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const { user_name, email } = useUser()

  
    const currentPath = pathStack.join('');
  const currentCaseNumber =
  pathStack.length > 0 ? pathStack[0].replace('/', '') : null;

 const {
  data: evidenceData,
} = useCaseEvidence(currentCaseNumber ?? '');
  const isRoot = pathStack.length === 0;
  const viewMode = isRoot ? "cases" : "files";

  let { data: cases, isLoading } = useCases();
  const { mutate: shareCaseTo } = useShareCaseTo();

  const bucket_name = amplifyConfig.storage.bucket_name
  const s3Ref = useRef<any>(null);
  useEffect(() => {
    createS3Client().then(client => {
        s3Ref.current = client
    })
  }, []);

  useEffect(() => {

    if(!isLoading){
      setCasesLoading(false)
    }
    
    if(cases && cases?.length > 0){
      setCasesLoading(false)
    }
  }, [cases])
  
  const { data: cognitoUsers,  } = useCognitoUser()
  const filteredUsers = cognitoUsers?.filter(item => item.email != email)
  cases = cases?.filter(item => item?.shared_to?.length > 0)

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


  useEffect(() => {
    async function init() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    init();
  }, []);

 
  const loadFiles = useCallback(async () => {
    if (!identityId) return;
    setFiles([])
    setFilesLoading(true)

    try {
      const items = []
      const basePath = `private/${identityId}/${currentPath}`;
      const command = new ListObjectsV2Command({
        Bucket: bucket_name,
        Prefix: basePath,
        Delimiter: '/'
      });
      const response = await s3Ref.current.send(command);
     

      for(const item of response.CommonPrefixes || []){
        items.push({
          Key: item.Prefix,
          type: "folder"
        })
      }

      for(const item of response.Contents || []){
        if(item.Key == basePath) continue
        items.push(item)
      }
      const mergedItems = items.map((item) => {
        if (item.type === "folder") {
          return item; 
        }

        const fullKey = item.Key;
        const fileName = fullKey?.split("/").pop();

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
      console.error('Error listing files', err);
    } finally {
      setFilesLoading(false);
    }
  }, [identityId, currentPath, evidenceByKey  ]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  
  function handleRowClick(params: any) {
    const row = params.row
    setFiles([]);
    setFilesLoading(true);   
     

    let name: string;
    if(viewMode === 'cases'){
      name = row.case_number
      setPathStack([`${name}/`]);
    }
    else{
      name = row.name
      setPathStack(prev => [...prev, `${name}/`]);
    }
  }

  const [open, setOpen] = useState(false)
  const users = filteredUsers

  const extractCaseNumber = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 2];
  };

  useEffect(() => {
  if (viewMode === "files") {
    setFiles([]); 
    setFilesLoading(true)
  }
}, [viewMode]);


  return (
    <>

      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="0.75rem 0"
      >
        <Heading level={5}>Files</Heading>

        <Flex gap="0.5rem">

          {isRoot && (
            <Button size='small' onClick={() => setOpen(true)} disabled={selectedRows.length === 0}>
              Share
            </Button>
          )}
          {open && (
            <ShareDialog
              open={open}
              users={users}
              selectedFiles={selectedRows}
              sharedTo={
                selectedRows.length === 1
                  ? cases?.find(
                      c => c.case_number === extractCaseNumber([...selectedRows][0])
                    )?.shared_to
                  : []
              }
              onClose={() => setOpen(false)}
              onShare={async (selected) => {
              const now = new Date().toISOString();
              const items = [];

              const selectedUsers = selected.users;
              const selectedFiles = selected.files;
              for (const file of selectedFiles) {
                const caseNumber = extractCaseNumber(file);

                const caseMeta = cases?.find(
                  c => c.case_number === caseNumber
                );

                if (!caseMeta) continue; 

                for (const user of selectedUsers || []) {
                  items.push({
                    receiver_user_id: `RECEIVER#${user.user_name}`,
                    case_number: `CASE#${caseNumber}`,

                    gsi1pk: `OWNER#${user_name}`,
                    gsi1sk: `CASE#${caseNumber}#RECEIVER#${user.user_name}`,

                    receiver_user: user.user_name,
                    receiver_email: user.email,
                    owner_user: user_name,
                    

                    case_title: caseMeta.case_title,
                    jurisdiction: caseMeta.jurisdiction,
                    case_agents: caseMeta.case_agents,
                    size: caseMeta.size ?? 0,
                    source_key: caseMeta.source_key,
                    owner_email: caseMeta.email,

                    permissions: {
                      read: user.read,
                      write: user.write
                    },

                    shared_at: now
                  });
                }
              }
              await shareCaseTo(items);
              setOpen(false)
              toast.success('Success')
            }}

            />
          )}

        </Flex>
      </Flex>
      <Breadcrumbs 
        pathStack={pathStack}
        onNavigate={(x: string[]) => {
          setFiles([]);
          setFilesLoading(true)
          setPathStack(x)
        }}
        onExitCase={() => {
          setFiles([]);
          setFilesLoading(true)
          setPathStack([]);
      }}
      />
        <CasesGrid
          data={viewMode === "cases" ? cases || [] : files || []}
          loading={viewMode === "cases" ? casesLoading : filesLoading}
          handleRowClick={handleRowClick}
          viewMode={viewMode}
          handleSelected={(selected: any) => setSelectedRows(selected)}
        />
    </>
  );
};