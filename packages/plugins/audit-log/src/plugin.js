"use strict";
/**
 * Audit Log Plugin for ObjectOS
 *
 * This plugin provides comprehensive audit logging capabilities including:
 * - Audit event recording (审计事件记录)
 * - Audit tracking (审计跟踪)
 * - Field history (字段历史)
 *
 * Features:
 * - Records all CRUD operations (Create, Read, Update, Delete)
 * - Tracks field-level changes with before/after values
 * - Captures user context (who, when, where)
 * - Provides query API for audit trail and field history
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogPlugin = void 0;
exports.getAuditLogAPI = getAuditLogAPI;
var storage_1 = require("./storage");
/**
 * Audit Log Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
var AuditLogPlugin = /** @class */ (function () {
    function AuditLogPlugin(config) {
        if (config === void 0) { config = {}; }
        this.name = 'com.objectos.audit-log';
        this.version = '0.1.0';
        this.dependencies = [];
        this.config = __assign({ enabled: true, trackFieldChanges: true, retentionDays: 0, auditedObjects: [], excludedFields: ['password', 'token', 'secret'] }, config);
        this.storage = config.storage || new storage_1.InMemoryAuditStorage();
    }
    /**
     * Initialize plugin - Register services and subscribe to events
     */
    AuditLogPlugin.prototype.init = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.context = context;
                        // Register audit log service
                        context.registerService('audit-log', this);
                        // Set up event listeners using kernel hooks
                        return [4 /*yield*/, this.setupEventListeners(context)];
                    case 1:
                        // Set up event listeners using kernel hooks
                        _a.sent();
                        context.logger.info('[Audit Log] Initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start plugin - Connect to databases, start servers
     */
    AuditLogPlugin.prototype.start = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                context.logger.info('[Audit Log] Starting...');
                context.logger.info('[Audit Log] Started successfully');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Set up event listeners using kernel hooks
     */
    AuditLogPlugin.prototype.setupEventListeners = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                // Subscribe to data events
                context.hook('data.create', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('data.create', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('data.update', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('data.update', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('data.delete', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('data.delete', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('data.find', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('data.find', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // Subscribe to job events
                context.hook('job.enqueued', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.enqueued', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('job.started', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.started', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('job.completed', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.completed', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('job.failed', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.failed', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('job.retried', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.retried', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('job.cancelled', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.cancelled', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context.hook('job.scheduled', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleJobEvent('job.scheduled', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Audit Log] Event listeners registered');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Handle data events and create audit logs
     */
    AuditLogPlugin.prototype.handleDataEvent = function (event, data) {
        return __awaiter(this, void 0, void 0, function () {
            var objectName, recordId, userId, userName, changes, record, eventTypeMap, eventType, auditEntry;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.config.enabled)
                            return [2 /*return*/];
                        objectName = data.objectName, recordId = data.recordId, userId = data.userId, userName = data.userName, changes = data.changes, record = data.record;
                        // Check if object should be audited
                        if (this.config.auditedObjects && this.config.auditedObjects.length > 0) {
                            if (!this.config.auditedObjects.includes(objectName)) {
                                return [2 /*return*/];
                            }
                        }
                        eventTypeMap = {
                            'data.create': 'data.create',
                            'data.update': 'data.update',
                            'data.delete': 'data.delete',
                            'data.find': 'data.read',
                        };
                        eventType = eventTypeMap[event];
                        if (!eventType)
                            return [2 /*return*/];
                        auditEntry = {
                            id: this.generateId(),
                            timestamp: new Date().toISOString(),
                            eventType: eventType,
                            objectName: objectName,
                            recordId: recordId || (record === null || record === void 0 ? void 0 : record.id),
                            userId: userId,
                            userName: userName,
                            resource: "".concat(objectName, "/").concat(recordId || (record === null || record === void 0 ? void 0 : record.id)),
                            action: eventType,
                            success: true,
                            metadata: __assign({ event: event }, data.metadata),
                        };
                        // Track field changes for update events
                        if (eventType === 'data.update' && this.config.trackFieldChanges && changes) {
                            auditEntry.changes = this.extractFieldChanges(changes);
                        }
                        // Store the audit event
                        return [4 /*yield*/, this.storage.logEvent(auditEntry)];
                    case 1:
                        // Store the audit event
                        _b.sent();
                        // Emit audit event using kernel trigger system
                        return [4 /*yield*/, this.emitEvent('audit.event.recorded', auditEntry)];
                    case 2:
                        // Emit audit event using kernel trigger system
                        _b.sent();
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.debug("[Audit Log] Recorded ".concat(eventType, " event for ").concat(objectName, "/").concat(recordId));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract field changes from update data
     */
    AuditLogPlugin.prototype.extractFieldChanges = function (changes) {
        var e_1, _a;
        var _b;
        var fieldChanges = [];
        try {
            for (var _c = __values(Object.entries(changes)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), field = _e[0], change = _e[1];
                // Skip excluded fields
                if ((_b = this.config.excludedFields) === null || _b === void 0 ? void 0 : _b.includes(field)) {
                    continue;
                }
                if (typeof change === 'object' && change !== null && 'oldValue' in change && 'newValue' in change) {
                    fieldChanges.push({
                        field: field,
                        oldValue: change.oldValue,
                        newValue: change.newValue,
                    });
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return fieldChanges;
    };
    /**
     * Handle job events and create audit logs
     */
    AuditLogPlugin.prototype.handleJobEvent = function (event, data) {
        return __awaiter(this, void 0, void 0, function () {
            var jobId, id, name, attempt, error, result, status, eventType, auditEntry;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.config.enabled)
                            return [2 /*return*/];
                        jobId = data.jobId, id = data.id, name = data.name, attempt = data.attempt, error = data.error, result = data.result, status = data.status;
                        eventType = event;
                        auditEntry = {
                            id: this.generateId(),
                            timestamp: new Date().toISOString(),
                            eventType: eventType,
                            resource: "jobs/".concat(jobId || id),
                            action: event,
                            success: event !== 'job.failed',
                            metadata: __assign({ jobId: jobId || id, jobName: name, attempt: attempt, error: error, result: result, status: status, event: event }, data),
                        };
                        // Store the audit event
                        return [4 /*yield*/, this.storage.logEvent(auditEntry)];
                    case 1:
                        // Store the audit event
                        _b.sent();
                        // Emit audit event using kernel trigger system
                        return [4 /*yield*/, this.emitEvent('audit.event.recorded', auditEntry)];
                    case 2:
                        // Emit audit event using kernel trigger system
                        _b.sent();
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.debug("[Audit Log] Recorded ".concat(event, " for job ").concat(jobId || id));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Query audit events
     */
    AuditLogPlugin.prototype.queryEvents = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.queryEvents(options)];
            });
        });
    };
    /**
     * Get audit trail for a record
     */
    AuditLogPlugin.prototype.getAuditTrail = function (objectName, recordId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getAuditTrail(objectName, recordId)];
            });
        });
    };
    /**
     * Get field history
     */
    AuditLogPlugin.prototype.getFieldHistory = function (objectName, recordId, fieldName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getFieldHistory(objectName, recordId, fieldName)];
            });
        });
    };
    /**
     * Emit audit events using kernel trigger system
     */
    AuditLogPlugin.prototype.emitEvent = function (event, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.context) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.context.trigger(event, data)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate unique ID for audit entries
     */
    AuditLogPlugin.prototype.generateId = function () {
        return "audit_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 11));
    };
    /**
     * Cleanup and shutdown
     */
    AuditLogPlugin.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                // Could implement retention policy cleanup here
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Audit Log] Destroyed');
                return [2 /*return*/];
            });
        });
    };
    return AuditLogPlugin;
}());
exports.AuditLogPlugin = AuditLogPlugin;
/**
 * Helper function to access the audit log API from kernel
 */
function getAuditLogAPI(kernel) {
    try {
        return kernel.getService('audit-log');
    }
    catch (_a) {
        return null;
    }
}
