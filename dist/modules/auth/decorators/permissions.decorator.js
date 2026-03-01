"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS_KEY = void 0;
exports.RequirePermissions = RequirePermissions;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
function RequirePermissions(roleOrResource, permissions) {
    if (permissions === undefined) {
        return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, { role: roleOrResource });
    }
    return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, { resource: roleOrResource, permissions });
}
//# sourceMappingURL=permissions.decorator.js.map