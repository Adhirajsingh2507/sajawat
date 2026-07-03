/**
 * Inventory movement repository (Milestone 1.3b).
 */
import { BaseRepository } from '../../db/base-repository.js';
import { InventoryMovement } from './inventory-movement.model.js';
import type { IInventoryMovement } from './inventory-movement.types.js';

export class InventoryMovementRepository extends BaseRepository<IInventoryMovement> {
  constructor() {
    super(InventoryMovement);
  }
}

export const inventoryMovementRepository = new InventoryMovementRepository();
