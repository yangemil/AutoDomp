"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.ProjectMemberRole = exports.UserRole = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["CRITICAL"] = "critical";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["PROJECT_MANAGER"] = "project_manager";
    UserRole["TESTER"] = "tester";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var ProjectMemberRole;
(function (ProjectMemberRole) {
    ProjectMemberRole["OWNER"] = "owner";
    ProjectMemberRole["ADMIN"] = "admin";
    ProjectMemberRole["MEMBER"] = "member";
    ProjectMemberRole["GUEST"] = "guest";
})(ProjectMemberRole || (exports.ProjectMemberRole = ProjectMemberRole = {}));
var Permission;
(function (Permission) {
    Permission["READ"] = "read";
    Permission["WRITE"] = "write";
    Permission["EXECUTE"] = "execute";
    Permission["MANAGE"] = "manage";
})(Permission || (exports.Permission = Permission = {}));
//# sourceMappingURL=interfaces.js.map