/**
 * CRM lead model (Milestone 1.8). baseSchemaPlugin + soft-delete. Indexed on
 * stage and creation time for the pipeline board.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { ICrmLead, ILeadNote } from './crm.types.js';

const { Schema } = mongoose;

const LEAD_STAGES = ['new', 'contacted', 'follow_up', 'negotiation', 'won', 'lost'] as const;

const noteSchema = new Schema<ILeadNote>(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const crmLeadSchema = new Schema<ICrmLead>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  company: { type: String, required: true, trim: true, maxlength: 200 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  gst: { type: String, trim: true, uppercase: true, maxlength: 20 },
  quantity: { type: Number, default: null, min: 0 },
  productInterest: { type: String, trim: true, maxlength: 500 },
  message: { type: String, trim: true, maxlength: 2000 },
  type: { type: String, enum: ['b2b'], default: 'b2b' },
  source: { type: String, trim: true, default: 'web', maxlength: 40 },
  stage: { type: String, enum: LEAD_STAGES, default: 'new' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: [noteSchema], default: [] },
  deletedAt: { type: Date, default: null },
});

crmLeadSchema.plugin(baseSchemaPlugin);

crmLeadSchema.index({ stage: 1, createdAt: -1 });
crmLeadSchema.index({ createdAt: -1 });

export const CrmLead: Model<ICrmLead> =
  (mongoose.models.CrmLead as Model<ICrmLead> | undefined) ??
  mongoose.model<ICrmLead>('CrmLead', crmLeadSchema);
