import React from 'react';
import Button from '../ui/Button';
import OpportunityModal from './OpportunityModal';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  company: { id: string; name: string };
  onClose: () => void;
  onArchive: (company: { id: string; name: string }) => Promise<void>;
  onDeletePermanently: () => Promise<void>;
}

const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  isOpen,
  company,
  onClose,
  onArchive,
  onDeletePermanently,
}) => {
  const [archiving, setArchiving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [archiveError, setArchiveError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleArchive = async () => {
    setArchiving(true);
    setArchiveError(null);
    try {
      await onArchive(company);
      onClose();
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Unable to archive company.';
      setArchiveError(message);
    } finally {
      setArchiving(false);
    }
  };

  const handleDeletePermanently = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeletePermanently();
      onClose();
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Unable to delete company.';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <OpportunityModal title="Delete or archive company?" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          This company may have people, messages, deals, and related CRM data. Choose what you want to do.
        </p>

        {(archiveError || deleteError) && (
          <div className="space-y-2">
            {archiveError && (
              <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{archiveError}</div>
            )}
            {deleteError && (
              <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{deleteError}</div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleArchive}
            disabled={archiving || deleting}
            className="w-full"
          >
            {archiving ? 'Archiving...' : 'Archive company'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeletePermanently}
            disabled={archiving || deleting}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={archiving || deleting}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </OpportunityModal>
  );
};

export default DeleteCompanyModal;