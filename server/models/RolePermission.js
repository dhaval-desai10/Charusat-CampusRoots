import mongoose from 'mongoose';
import { ASSIGNABLE_ROLES, ALL_MODULES } from '../constants/rbac.js';

const VALID_ROLES = ASSIGNABLE_ROLES;
const VALID_MODULES = ALL_MODULES;

const rolePermissionSchema = new mongoose.Schema({
   role: {
      type: String,
      required: true,
      enum: VALID_ROLES
   },
   module: {
      type: String,
      required: true,
      enum: VALID_MODULES
   },
   enabled: {   
      type: Boolean,
      default: true
   }
}, {
   timestamps: true
});

// Compound unique index: one document per role+module combination
rolePermissionSchema.index({ role: 1, module: 1 }, { unique: true });

/**
 * Seed default permissions for all role-module combinations.
 * Uses upsert with $setOnInsert so existing admin changes are preserved.
 */
rolePermissionSchema.statics.seedDefaults = async function () {
   const ops = [];
   for (const role of VALID_ROLES) {
      for (const mod of VALID_MODULES) {
         ops.push({
            updateOne: {
               filter: { role, module: mod },
               update: { $setOnInsert: { role, module: mod, enabled: true } },
               upsert: true
            }
         });
      }
   }
   await this.bulkWrite(ops);
   console.log('✅ RBAC default permissions seeded');
};

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);

export { VALID_ROLES, VALID_MODULES };
export default RolePermission;
