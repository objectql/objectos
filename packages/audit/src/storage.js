"use strict";
/**
 * In-Memory Audit Storage
 *
 * Simple in-memory storage for audit events.
 * For production use, replace with database-backed storage.
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAuditStorage = void 0;
/**
 * In-memory implementation of AuditStorage
 *
 * This is a simple implementation for development and testing.
 * In production, use a database-backed implementation.
 */
var InMemoryAuditStorage = /** @class */ (function () {
    function InMemoryAuditStorage() {
        this.events = [];
    }
    /**
     * Store an audit event
     */
    InMemoryAuditStorage.prototype.logEvent = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.events.push(__assign(__assign({}, entry), { timestamp: entry.timestamp || new Date().toISOString() }));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Query audit events with filtering and pagination
     */
    InMemoryAuditStorage.prototype.queryEvents = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var results, sortOrder, offset, limit;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                results = __spreadArray([], __read(this.events), false);
                // Apply filters
                if (options.objectName) {
                    results = results.filter(function (e) {
                        return 'objectName' in e && e.objectName === options.objectName;
                    });
                }
                if (options.recordId) {
                    results = results.filter(function (e) {
                        return 'recordId' in e && e.recordId === options.recordId;
                    });
                }
                if (options.userId) {
                    results = results.filter(function (e) { return e.userId === options.userId; });
                }
                if (options.eventType) {
                    results = results.filter(function (e) { return e.eventType === options.eventType; });
                }
                if (options.startDate) {
                    results = results.filter(function (e) { return e.timestamp >= options.startDate; });
                }
                if (options.endDate) {
                    results = results.filter(function (e) { return e.timestamp <= options.endDate; });
                }
                sortOrder = options.sortOrder || 'desc';
                results.sort(function (a, b) {
                    var comparison = a.timestamp.localeCompare(b.timestamp);
                    return sortOrder === 'asc' ? comparison : -comparison;
                });
                offset = options.offset || 0;
                limit = options.limit || results.length;
                return [2 /*return*/, results.slice(offset, offset + limit)];
            });
        });
    };
    /**
     * Get field history for a specific record and field
     */
    InMemoryAuditStorage.prototype.getFieldHistory = function (objectName, recordId, fieldName) {
        return __awaiter(this, void 0, void 0, function () {
            var auditTrail, fieldChanges, chronologicalTrail, chronologicalTrail_1, chronologicalTrail_1_1, entry, change;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuditTrail(objectName, recordId)];
                    case 1:
                        auditTrail = _b.sent();
                        fieldChanges = [];
                        chronologicalTrail = __spreadArray([], __read(auditTrail), false).reverse();
                        try {
                            for (chronologicalTrail_1 = __values(chronologicalTrail), chronologicalTrail_1_1 = chronologicalTrail_1.next(); !chronologicalTrail_1_1.done; chronologicalTrail_1_1 = chronologicalTrail_1.next()) {
                                entry = chronologicalTrail_1_1.value;
                                if (entry.changes) {
                                    change = entry.changes.find(function (c) { return c.field === fieldName; });
                                    if (change) {
                                        fieldChanges.push(change);
                                    }
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (chronologicalTrail_1_1 && !chronologicalTrail_1_1.done && (_a = chronologicalTrail_1.return)) _a.call(chronologicalTrail_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/, fieldChanges];
                }
            });
        });
    };
    /**
     * Get audit trail for a specific record
     */
    InMemoryAuditStorage.prototype.getAuditTrail = function (objectName, recordId) {
        return __awaiter(this, void 0, void 0, function () {
            var events;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queryEvents({ objectName: objectName, recordId: recordId })];
                    case 1:
                        events = _a.sent();
                        return [2 /*return*/, events];
                }
            });
        });
    };
    /**
     * Clear all audit events (for testing)
     */
    InMemoryAuditStorage.prototype.clear = function () {
        this.events = [];
    };
    /**
     * Get count of stored events
     */
    InMemoryAuditStorage.prototype.getEventCount = function () {
        return this.events.length;
    };
    return InMemoryAuditStorage;
}());
exports.InMemoryAuditStorage = InMemoryAuditStorage;
