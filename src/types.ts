export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
  blob: Blob;
};

export type RepairRecord = {
  id: string;
  title: string;
  area: string;
  completedDate: string;
  contractor: string;
  vendor: string;
  part: string;
  cost: number | null;
  notes: string;
  nextDue: string;
  nextAction: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

export type PropertyProfile = {
  name: string;
  address: string;
};

export type ProofBookBackup = {
  format: 'maintenance-proof-book';
  version: 1;
  exportedAt: string;
  property: PropertyProfile;
  records: Array<Omit<RepairRecord, 'attachments'> & {
    attachments: Array<Omit<Attachment, 'blob'> & { data: string }>;
  }>;
};
