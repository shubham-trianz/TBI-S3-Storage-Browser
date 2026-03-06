import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  Button,
  Text,
} from '@aws-amplify/ui-react';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { UploadButton } from '../utils/UploadButton';
import { DeleteObjects } from '../utils/DeleteObjects';
import CasesGrid from '../utils/CaseTable';
import { MoveDialog } from '../utils/MoveDialog';
import { MetadataDialog } from '../utils/MetadataDialog';
import { useCases } from '../../hooks/cases';
import { useCaseEvidence, useCreateEvidence } from '../../hooks/useCaseEvidence';
import { createS3Client } from '../s3.service';
import amplifyConfig from '../../../amplify_outputs.json';
import toast from 'react-hot-toast';
 
const TEMP_CASE = 'temp';
 
export const Temp = () => {
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
 
  const s3Ref = useRef<any>(null);
  const bucket = amplifyConfig.storage.bucket_name;
  const { data: cases } = useCases();
 
  const { data: tempEvidence, refetch: refetchEvidence } = useCaseEvidence(TEMP_CASE);
  const { mutateAsync: createEvidence } = useCreateEvidence(TEMP_CASE);
 
  const tempPrefix = identityId ? `private/${identityId}/temp/` : null;
 
  const evidenceByKey = useMemo(() => {
    const map = new Map<string, any>();
    tempEvidence?.items?.forEach((ev: any) => {
      map.set(ev.source_key, ev);
      const filename = ev.source_key?.split('/').pop();
      if (filename) map.set(filename, ev);
    });
    return map;
  }, [tempEvidence]);
 
  useEffect(() => {
    createS3Client().then(c => (s3Ref.current = c));
  }, []);
 
  useEffect(() => {
    fetchAuthSession().then(session => {
      setIdentityId(session.identityId ?? null);
    });
  }, []);
 
  const loadFiles = useCallback(async () => {
    if (!identityId || !s3Ref.current) return;
    setFilesLoading(true);
    setFiles([]);
    try {
      const cmd = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `private/${identityId}/temp/`,
        Delimiter: '/',
      });
      const res = await s3Ref.current.send(cmd);
      const items: any[] = [];
 
      for (const item of res.CommonPrefixes || []) {
        items.push({ Key: item.Prefix, type: 'folder' });
      }
      for (const item of res.Contents || []) {
        if (item.Key === `private/${identityId}/temp/`) continue;
        const fullKey = item.Key;
        const fileName = fullKey?.split('/').pop();
        const metadata =
          evidenceByKey.get(fullKey) ||
          evidenceByKey.get(fileName) ||
          null;
        items.push({ ...item, ...metadata });
      }
      setFiles(items);
    } catch (err) {
      console.error('Error listing temp files', err);
    } finally {
      setFilesLoading(false);
    }
  }, [identityId, bucket, evidenceByKey]);
 
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
 
  const selectedSingleMeta =
    selectedRows.length === 1
      ? evidenceByKey.get(selectedRows[0]) ?? null
      : null;
 
  // Check all selected files have evidence_number before allowing move
  const filesWithoutMetadata = selectedRows.filter(key => {
    const filename = key.split('/').pop() || '';
    const meta = evidenceByKey.get(key) || evidenceByKey.get(filename);
    return !meta?.evidence_number;
  });
  const canMove = selectedRows.length > 0 && filesWithoutMetadata.length === 0;
 

 const handleSaveMetadata = async (metadata: {
   evidence_number: string;
   description: string;
 }) => {
   if (selectedRows.length !== 1) {
     toast.error('Select exactly one file to edit metadata.');
     return;
   }
   const key = selectedRows[0];
   await createEvidence({
     source_key: key,
     evidence_number: metadata.evidence_number,
     description: metadata.description,
   });
   toast.success('Metadata saved');
   refetchEvidence();
   loadFiles();
 };

 
  return (
    <>
      {/* <div
        style={{
          border: '2px dashed var(--amplify-colors-neutral-40)',
          borderRadius: 8,
          padding: '1rem',
          textAlign: 'center',
          marginBottom: '0.75rem',
          background: 'var(--amplify-colors-neutral-10)',
          color: 'var(--amplify-colors-neutral-80)',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) setDroppedFile(file);
        }}
      >
        <Text fontSize="small">
          Drag & drop files here, or use <strong>Upload</strong> — no case needed
        </Text>
      </div> */}
 
      <Flex justifyContent="space-between" alignItems="center" padding="0.75rem 0">
        <Heading level={5}>Temp Files</Heading>
 
        <Flex gap="0.5rem" alignItems="center">
          {selectedRows.length > 0 && (
            <>   
        <Button
          size="small"
          onClick={() => {
            if (selectedRows.length !== 1) {
              toast.error('Please select exactly one file to edit metadata.');
              return;
            }
            setMetaOpen(true);
          }}
          isDisabled={selectedRows.length !== 1}
          title={selectedRows.length !== 1 ? 'Select exactly one file to edit metadata' : ''}
        >
          Edit Metadata
        </Button>
              {/* Show warning if some files missing metadata */}
              {!canMove && (
                <Text fontSize="small" color="var(--amplify-colors-red-60)">
                  {filesWithoutMetadata.length} file{filesWithoutMetadata.length > 1 ? 's' : ''} missing metadata
                </Text>
              )}
 
              <Button
                size="small"
                variation="primary"
                isDisabled={!canMove}
                onClick={() => setMoveOpen(true)}
                title={!canMove ? 'Add metadata to all selected files before moving' : ''}
              >
                Move to Case
              </Button>
            </>
          )}
 
          <DeleteObjects
            selectedPaths={selectedRows}
            currentCaseNumber={null}
            onDeleted={loadFiles}
          />
 
          {tempPrefix && (
            <UploadButton
              prefix={tempPrefix}
              droppedFile={droppedFile}
              onClearDroppedFile={() => setDroppedFile(null)}
              onUploaded={() => {
                setDroppedFile(null);
                loadFiles();
              }}
            />
          )}
        </Flex>
      </Flex>
 
      <CasesGrid
        data={files}
        loading={filesLoading}
        handleRowClick={() => {}}
        viewMode="files"
        handleSelected={(selected: any) => setSelectedRows(selected)}
        onFileDrop={(file) => setDroppedFile(file)}
      />
 
      {moveOpen && identityId && (
        <MoveDialog
          open={moveOpen}
          files={selectedRows}
          identityId={identityId}
          cases={cases ?? []}
          tempEvidence={tempEvidence?.items ?? []}
          onClose={() => setMoveOpen(false)}
          onMoved={() => {
            setSelectedRows([]);
            loadFiles();
          }}
        />
      )}
 
      + {metaOpen && selectedRows.length === 1 && (
        <MetadataDialog
          open={metaOpen}
          files={selectedRows}
          initialMetadata={selectedRows.length === 1 ? selectedSingleMeta : undefined}
          onClose={() => setMetaOpen(false)}
          onSave={handleSaveMetadata}
        />
      )}
    </>
  );
};