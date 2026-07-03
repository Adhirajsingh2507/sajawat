/**
 * CRM lead repository (Milestone 1.8).
 */
import { BaseRepository } from '../../db/base-repository.js';
import { CrmLead } from './crm.model.js';
import type { ICrmLead } from './crm.types.js';

export class CrmLeadRepository extends BaseRepository<ICrmLead> {
  constructor() {
    super(CrmLead);
  }
}

export const crmLeadRepository = new CrmLeadRepository();
