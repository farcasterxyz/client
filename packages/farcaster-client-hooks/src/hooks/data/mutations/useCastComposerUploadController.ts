import { useCallback, useState } from 'react';

export function useCastComposerUploadController() {
  const [uploadingStatuses, setUploadingStatuses] = useState<{
    [castLocalKey: number]: string | undefined;
  }>({});
  const [uploadingErrors, setUploadingErrors] = useState<{
    [castLocalKey: number]: string | undefined;
  }>({});
  const [detailedUploadingErrors, setDetailedUploadingErrors] = useState<{
    [castLocalKey: number]: string | undefined;
  }>({});
  const [allModifyingEmbeds, setAllModifyingEmbeds] = useState<{
    [castLocalKey: string]: boolean;
  }>({});

  const setUploadingStatus = useCallback(
    (uploadingStatus: string | undefined, castLocalKey: number) => {
      setUploadingStatuses((prevUploadingStatuses) => ({
        ...prevUploadingStatuses,
        [castLocalKey]: uploadingStatus,
      }));
    },
    [],
  );

  const setUploadingError = useCallback(
    (uploadingError: string | undefined, castLocalKey: number) => {
      setUploadingErrors((prevUploadingErrors) => ({
        ...prevUploadingErrors,
        [castLocalKey]: uploadingError,
      }));
    },
    [],
  );

  const setDetailedUploadingError = useCallback(
    (detailedUploadingError: string | undefined, castLocalKey: number) => {
      setDetailedUploadingErrors((prevDetailedUploadingError) => ({
        ...prevDetailedUploadingError,
        [castLocalKey]: detailedUploadingError,
      }));
    },
    [],
  );

  const setModifyingEmbeds = useCallback(
    (isModifyingEmbeds: boolean, castLocalKey: number) => {
      setAllModifyingEmbeds((prevAllModifyingEmbeds) => ({
        ...prevAllModifyingEmbeds,
        [castLocalKey]: isModifyingEmbeds,
      }));
    },
    [],
  );

  const isAnyUploadControllerBusy = useCallback(() => {
    return Object.values(allModifyingEmbeds).some(Boolean);
  }, [allModifyingEmbeds]);

  return {
    allModifyingEmbeds,
    detailedUploadingErrors,
    isAnyUploadControllerBusy,
    setDetailedUploadingError,
    setModifyingEmbeds,
    setUploadingError,
    setUploadingStatus,
    uploadingErrors,
    uploadingStatuses,
  };
}
