import React from 'react';
import Modal from '../ui/Modal';

const OpportunityModal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => {
  return (
    <Modal open={true} onClose={onClose} title={title} width="640px">
      {children}
    </Modal>
  );
};

export default OpportunityModal;
