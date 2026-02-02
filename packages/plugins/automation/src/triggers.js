"use strict";
/**
 * Trigger Engine
 *
 * Handles trigger evaluation and execution
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.TriggerEngine = void 0;
var cronParser = __importStar(require("cron-parser"));
/**
 * Trigger engine for evaluating trigger conditions
 */
var TriggerEngine = /** @class */ (function () {
    function TriggerEngine(logger) {
        this.scheduledJobs = new Map();
        this.logger = logger || console;
    }
    /**
     * Evaluate if an object trigger should fire
     */
    TriggerEngine.prototype.evaluateObjectTrigger = function (trigger, eventType, objectName, record, oldRecord) {
        // Check if trigger type matches
        if (trigger.type !== eventType) {
            return false;
        }
        // Check if object name matches
        if (trigger.objectName !== objectName) {
            return false;
        }
        // For update triggers, check conditions and field changes
        if (eventType === 'object.update') {
            // If specific fields are specified, check if any changed
            if (trigger.fields && trigger.fields.length > 0) {
                var hasFieldChange = trigger.fields.some(function (field) { return oldRecord && record[field] !== oldRecord[field]; });
                if (!hasFieldChange) {
                    return false;
                }
            }
            // Evaluate conditions
            if (trigger.conditions && trigger.conditions.length > 0) {
                return this.evaluateConditions(trigger.conditions, record, oldRecord);
            }
        }
        return true;
    };
    /**
     * Evaluate trigger conditions
     */
    TriggerEngine.prototype.evaluateConditions = function (conditions, record, oldRecord) {
        var e_1, _a;
        try {
            for (var conditions_1 = __values(conditions), conditions_1_1 = conditions_1.next(); !conditions_1_1.done; conditions_1_1 = conditions_1.next()) {
                var condition = conditions_1_1.value;
                if (!this.evaluateCondition(condition, record, oldRecord)) {
                    return false;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (conditions_1_1 && !conditions_1_1.done && (_a = conditions_1.return)) _a.call(conditions_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    };
    /**
     * Evaluate a single condition
     */
    TriggerEngine.prototype.evaluateCondition = function (condition, record, oldRecord) {
        var fieldValue = record[condition.field];
        var oldValue = oldRecord === null || oldRecord === void 0 ? void 0 : oldRecord[condition.field];
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'not_equals':
                return fieldValue !== condition.value;
            case 'greater_than':
                return fieldValue > condition.value;
            case 'less_than':
                return fieldValue < condition.value;
            case 'contains':
                return String(fieldValue).includes(String(condition.value));
            case 'starts_with':
                return String(fieldValue).startsWith(String(condition.value));
            case 'ends_with':
                return String(fieldValue).endsWith(String(condition.value));
            case 'changed':
                return oldValue !== undefined && fieldValue !== oldValue;
            default:
                this.logger.warn("Unknown condition operator: ".concat(condition.operator));
                return false;
        }
    };
    /**
     * Register a scheduled trigger
     */
    TriggerEngine.prototype.registerScheduledTrigger = function (ruleId, trigger, callback) {
        var _this = this;
        try {
            // Parse cron expression
            var interval_1 = cronParser.parseExpression(trigger.cronExpression, {
                tz: trigger.timezone,
            });
            // Schedule the job
            var scheduleNext_1 = function () {
                try {
                    var next = interval_1.next();
                    var delay = next.getTime() - Date.now();
                    var timeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, callback()];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    this.logger.error("Error executing scheduled trigger for rule ".concat(ruleId, ":"), error_1);
                                    return [3 /*break*/, 3];
                                case 3:
                                    // Schedule next execution
                                    scheduleNext_1();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, delay);
                    _this.scheduledJobs.set(ruleId, {
                        timeout: timeout,
                        nextRun: next.toDate(),
                    });
                }
                catch (error) {
                    _this.logger.error("Error scheduling next execution for rule ".concat(ruleId, ":"), error);
                }
            };
            scheduleNext_1();
            this.logger.info("Scheduled trigger registered for rule: ".concat(ruleId));
        }
        catch (error) {
            this.logger.error("Failed to register scheduled trigger for rule ".concat(ruleId, ":"), error);
            throw error;
        }
    };
    /**
     * Unregister a scheduled trigger
     */
    TriggerEngine.prototype.unregisterScheduledTrigger = function (ruleId) {
        var job = this.scheduledJobs.get(ruleId);
        if (job === null || job === void 0 ? void 0 : job.timeout) {
            clearTimeout(job.timeout);
            this.scheduledJobs.delete(ruleId);
            this.logger.info("Scheduled trigger unregistered for rule: ".concat(ruleId));
        }
    };
    /**
     * Get next run time for a scheduled trigger
     */
    TriggerEngine.prototype.getNextRunTime = function (ruleId) {
        var job = this.scheduledJobs.get(ruleId);
        return (job === null || job === void 0 ? void 0 : job.nextRun) || null;
    };
    /**
     * Validate a webhook trigger (basic validation)
     */
    TriggerEngine.prototype.validateWebhookTrigger = function (trigger) {
        if (!trigger.path) {
            return false;
        }
        // Path should start with /
        if (!trigger.path.startsWith('/')) {
            return false;
        }
        return true;
    };
    /**
     * Shutdown and cleanup
     */
    TriggerEngine.prototype.shutdown = function () {
        var e_2, _a;
        try {
            // Clear all scheduled jobs
            for (var _b = __values(this.scheduledJobs.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), ruleId = _d[0], job = _d[1];
                if (job.timeout) {
                    clearTimeout(job.timeout);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        this.scheduledJobs.clear();
        this.logger.info('Trigger engine shutdown');
    };
    return TriggerEngine;
}());
exports.TriggerEngine = TriggerEngine;
