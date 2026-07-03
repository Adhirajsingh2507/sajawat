/**
 * Inventory service (Milestone 1.3b) — stock lifecycle + audit. Every change
 * writes an immutable InventoryMovement (signed delta). `availableQuantity` and
 * `status` are derived; `reservedQuantity` is owned by checkout (1.6).
 */
import type { HydratedDocument } from 'mongoose';
import type { Paginated } from '@sajawat/types';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { inventoryRepository } from './inventory.repository.js';
import { inventoryMovementRepository } from './inventory-movement.repository.js';
import type { AdminInventory, IInventory, InventoryStatus } from './inventory.types.js';
import type { AdminInventoryMovement, IInventoryMovement } from './inventory-movement.types.js';

type InventoryDoc = HydratedDocument<IInventory>;
type MovementDoc = HydratedDocument<IInventoryMovement>;

/** Movement types an admin may apply (`order` is system-only, written at checkout). */
export type AdminMovementType = 'stock_added' | 'stock_removed' | 'manual_adjustment' | 'return';

export interface AdjustInput {
  type: AdminMovementType;
  quantity: number;
  reason?: string | undefined;
  lowStockThreshold?: number | undefined;
}

function deriveStatus(available: number, threshold: number): InventoryStatus {
  if (available <= 0) return 'out_of_stock';
  if (available <= threshold) return 'low_stock';
  return 'in_stock';
}

function toAdminInventory(doc: InventoryDoc): AdminInventory {
  return {
    productId: String(doc.productId),
    quantity: doc.quantity,
    reservedQuantity: doc.reservedQuantity,
    availableQuantity: doc.availableQuantity,
    lowStockThreshold: doc.lowStockThreshold,
    status: doc.status,
    updatedAt: doc.updatedAt,
  };
}

function toAdminMovement(doc: MovementDoc): AdminInventoryMovement {
  return {
    id: String(doc._id),
    productId: String(doc.productId),
    type: doc.type,
    quantity: doc.quantity,
    reason: doc.reason,
    performedBy: String(doc.performedBy),
    createdAt: doc.createdAt,
  };
}

/** Compute the new quantity + the signed movement delta for an admin change. */
function applyChange(
  current: number,
  type: AdminMovementType,
  quantity: number,
): { newQuantity: number; delta: number } {
  if (type === 'manual_adjustment') {
    return { newQuantity: quantity, delta: quantity - current };
  }
  const sign = type === 'stock_removed' ? -1 : 1; // stock_added / return add stock
  return { newQuantity: current + sign * quantity, delta: sign * quantity };
}

/** Create the 1:1 inventory row for a new product (optionally seeded). */
async function createForProduct(
  productId: string,
  performedBy: string,
  opts: { quantity?: number | undefined; lowStockThreshold?: number | undefined } = {},
): Promise<InventoryDoc> {
  const quantity = opts.quantity ?? 0;
  const lowStockThreshold = opts.lowStockThreshold ?? 5;
  const inv = await inventoryRepository.create({
    productId,
    quantity,
    reservedQuantity: 0,
    availableQuantity: quantity,
    lowStockThreshold,
    status: deriveStatus(quantity, lowStockThreshold),
  });
  if (quantity > 0) {
    await inventoryMovementRepository.create({
      productId,
      type: 'stock_added',
      quantity,
      reason: 'Initial stock',
      performedBy,
    });
  }
  return inv;
}

async function adjust(
  productId: string,
  input: AdjustInput,
  performedBy: string,
): Promise<AdminInventory> {
  const inv = await inventoryRepository.findByProductId(productId);
  if (inv === null) {
    throw new NotFoundError('Inventory not found for product');
  }
  const { newQuantity, delta } = applyChange(inv.quantity, input.type, input.quantity);
  if (newQuantity < 0) {
    throw new BadRequestError('Resulting stock quantity cannot be negative');
  }
  const lowStockThreshold = input.lowStockThreshold ?? inv.lowStockThreshold;
  const availableQuantity = newQuantity - inv.reservedQuantity;
  const status = deriveStatus(availableQuantity, lowStockThreshold);

  const updated = await inventoryRepository.updateById(String(inv._id), {
    $set: { quantity: newQuantity, availableQuantity, lowStockThreshold, status },
  });
  if (updated === null) {
    throw new NotFoundError('Inventory not found for product');
  }
  await inventoryMovementRepository.create({
    productId,
    type: input.type,
    quantity: delta,
    reason: input.reason,
    performedBy,
  });
  return toAdminInventory(updated);
}

async function listAdmin(query: {
  page?: number | undefined;
  limit?: number | undefined;
  status?: InventoryStatus | undefined;
}): Promise<Paginated<AdminInventory>> {
  const filter = query.status !== undefined ? { status: query.status } : {};
  const res: PaginatedResult<InventoryDoc> = await inventoryRepository.paginate(filter, {
    page: query.page,
    limit: query.limit,
    sort: { updatedAt: -1 },
  });
  return {
    items: res.items.map(toAdminInventory),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

async function history(query: {
  page?: number | undefined;
  limit?: number | undefined;
  productId?: string | undefined;
}): Promise<Paginated<AdminInventoryMovement>> {
  const filter = query.productId !== undefined ? { productId: query.productId } : {};
  const res: PaginatedResult<MovementDoc> = await inventoryMovementRepository.paginate(filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
  });
  return {
    items: res.items.map(toAdminMovement),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

/** Reserve stock for a pending online order. Throws if insufficient. */
async function reserve(productId: string, quantity: number): Promise<void> {
  const updated = await inventoryRepository.reserveIfAvailable(productId, quantity);
  if (updated === null) {
    throw new BadRequestError('Insufficient stock for one or more items');
  }
  const status = deriveStatus(updated.availableQuantity, updated.lowStockThreshold);
  if (status !== updated.status) {
    await inventoryRepository.updateById(String(updated._id), { $set: { status } });
  }
}

/** Convert a reservation into a sale on payment success (+ audit movement). */
async function commitReserved(
  productId: string,
  quantity: number,
  performedBy: string,
): Promise<void> {
  const updated = await inventoryRepository.commitReserved(productId, quantity);
  if (updated === null) return;
  await inventoryMovementRepository.create({
    productId,
    type: 'order',
    quantity: -quantity,
    reason: 'Order paid',
    performedBy,
  });
}

/** Release a reservation on failure/cancel (reserved → available). */
async function release(productId: string, quantity: number): Promise<void> {
  const updated = await inventoryRepository.releaseReserved(productId, quantity);
  if (updated === null) return;
  const status = deriveStatus(updated.availableQuantity, updated.lowStockThreshold);
  if (status !== updated.status) {
    await inventoryRepository.updateById(String(updated._id), { $set: { status } });
  }
}

/** Commit stock for an order (atomic decrement + audit movement). Throws if short. */
async function commit(productId: string, quantity: number, performedBy: string): Promise<void> {
  const updated = await inventoryRepository.decrementIfAvailable(productId, quantity);
  if (updated === null) {
    throw new BadRequestError('Insufficient stock for one or more items');
  }
  const status = deriveStatus(updated.availableQuantity, updated.lowStockThreshold);
  if (status !== updated.status) {
    await inventoryRepository.updateById(String(updated._id), { $set: { status } });
  }
  await inventoryMovementRepository.create({
    productId,
    type: 'order',
    quantity: -quantity,
    reason: 'Order placed',
    performedBy,
  });
}

/** Return stock (cancel/rollback) + audit movement. No-op if there is no row. */
async function restock(
  productId: string,
  quantity: number,
  performedBy: string,
  reason = 'Order cancelled',
): Promise<void> {
  const updated = await inventoryRepository.incrementStock(productId, quantity);
  if (updated === null) return;
  const status = deriveStatus(updated.availableQuantity, updated.lowStockThreshold);
  if (status !== updated.status) {
    await inventoryRepository.updateById(String(updated._id), { $set: { status } });
  }
  await inventoryMovementRepository.create({
    productId,
    type: 'manual_adjustment',
    quantity,
    reason,
    performedBy,
  });
}

/** Map of productId → inStock (status !== out_of_stock) for a set of products. */
async function getInStockMap(productIds: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (productIds.length === 0) {
    return map;
  }
  const rows = await inventoryRepository.findByProductIds(productIds);
  for (const row of rows) {
    map.set(String(row.productId), row.status !== 'out_of_stock');
  }
  return map;
}

export const inventoryService = {
  createForProduct,
  adjust,
  commit,
  restock,
  reserve,
  commitReserved,
  release,
  listAdmin,
  history,
  getInStockMap,
};
