"use strict";
/**
 * Automation Plugin for ObjectOS
 *
 * This plugin provides comprehensive automation capabilities including:
 * - Object triggers (onCreate, onUpdate, onDelete)
 * - Scheduled triggers (cron)
 * - Webhook triggers
 * - Actions (update field, create record, send email, HTTP, script)
 * - Formula fields (calculated, rollup, auto-number)
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationPlugin = void 0;
exports.getAutomationAPI = getAutomationAPI;
var storage_1 = require("./storage");
var triggers_1 = require("./triggers");
var actions_1 = require("./actions");
var formulas_1 = require("./formulas");
/**
 * Automation Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
var AutomationPlugin = /** @class */ (function () {
    function AutomationPlugin(config) {
        if (config === void 0) { config = {}; }
        this.name = 'com.objectos.automation';
        this.version = '0.1.0';
        this.dependencies = [];
        this.config = __assign({ enabled: true, maxExecutionTime: 30000, enableEmail: false, enableHttp: true, enableScriptExecution: false }, config);
        this.storage = config.storage || new storage_1.InMemoryAutomationStorage();
        this.triggerEngine = new triggers_1.TriggerEngine();
        this.actionExecutor = new actions_1.ActionExecutor({
            emailConfig: config.emailConfig,
            enableEmail: this.config.enableEmail,
            enableHttp: this.config.enableHttp,
            enableScriptExecution: this.config.enableScriptExecution,
            maxExecutionTime: this.config.maxExecutionTime,
        });
        this.formulaEngine = new formulas_1.FormulaEngine();
    }
    /**
     * Initialize plugin - Register services and subscribe to events
     */
    AutomationPlugin.prototype.init = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.context = context;
                        // Update loggers
                        this.triggerEngine.logger = context.logger;
                        this.actionExecutor.logger = context.logger;
                        this.formulaEngine.logger = context.logger;
                        // Register automation service
                        context.registerService('automation', this);
                        // Set up event listeners using kernel hooks
                        return [4 /*yield*/, this.setupEventListeners(context)];
                    case 1:
                        // Set up event listeners using kernel hooks
                        _a.sent();
                        context.logger.info('[Automation Plugin] Initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start plugin - Connect to databases, start servers
     */
    AutomationPlugin.prototype.start = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var rules, _loop_1, this_1, rules_1, rules_1_1, rule;
            var e_1, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        context.logger.info('[Automation Plugin] Starting...');
                        return [4 /*yield*/, this.storage.listRules({ status: 'active', triggerType: 'scheduled' })];
                    case 1:
                        rules = _b.sent();
                        _loop_1 = function (rule) {
                            if (rule.trigger.type === 'scheduled') {
                                this_1.triggerEngine.registerScheduledTrigger(rule.id, rule.trigger, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.executeRule(rule, {})];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                }); }); });
                            }
                        };
                        this_1 = this;
                        try {
                            for (rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
                                rule = rules_1_1.value;
                                _loop_1(rule);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        context.logger.info('[Automation Plugin] Started successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set up event listeners for data events using kernel hooks
     */
    AutomationPlugin.prototype.setupEventListeners = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                // Listen for data create events
                context.hook('data.create', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('object.create', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // Listen for data update events
                context.hook('data.update', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('object.update', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // Listen for data delete events
                context.hook('data.delete', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDataEvent('object.delete', data)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Automation Plugin] Event listeners registered');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Handle data events and trigger automations
     */
    AutomationPlugin.prototype.handleDataEvent = function (eventType, data) {
        return __awaiter(this, void 0, void 0, function () {
            var objectName, record, oldRecord, rules, rules_2, rules_2_1, rule, shouldFire, e_2_1;
            var e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.config.enabled)
                            return [2 /*return*/];
                        objectName = data.objectName, record = data.record, oldRecord = data.oldRecord;
                        return [4 /*yield*/, this.storage.listRules({
                                status: 'active',
                                triggerType: eventType
                            })];
                    case 1:
                        rules = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 9]);
                        rules_2 = __values(rules), rules_2_1 = rules_2.next();
                        _b.label = 3;
                    case 3:
                        if (!!rules_2_1.done) return [3 /*break*/, 6];
                        rule = rules_2_1.value;
                        if (rule.trigger.type !== eventType)
                            return [3 /*break*/, 5];
                        shouldFire = this.triggerEngine.evaluateObjectTrigger(rule.trigger, eventType, objectName, record, oldRecord);
                        if (!shouldFire) return [3 /*break*/, 5];
                        this.emitEvent('automation.trigger.fired', {
                            ruleId: rule.id,
                            eventType: eventType,
                            objectName: objectName
                        });
                        // Execute the rule
                        return [4 /*yield*/, this.executeRule(rule, {
                                objectName: objectName,
                                record: record,
                                oldRecord: oldRecord,
                                eventType: eventType
                            })];
                    case 4:
                        // Execute the rule
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        rules_2_1 = rules_2.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (rules_2_1 && !rules_2_1.done && (_a = rules_2.return)) _a.call(rules_2);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute an automation rule
     */
    AutomationPlugin.prototype.executeRule = function (rule, triggerData) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, actionResults, context, _a, _b, action, result_1, error_1, errorMessage, e_3_1, result, error_2, errorMessage, result;
            var e_3, _c;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        startTime = Date.now();
                        actionResults = [];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 13, , 15]);
                        context = {
                            rule: rule,
                            triggerData: triggerData,
                            logger: ((_d = this.context) === null || _d === void 0 ? void 0 : _d.logger) || console,
                        };
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 9, 10, 11]);
                        _a = __values(rule.actions), _b = _a.next();
                        _f.label = 3;
                    case 3:
                        if (!!_b.done) return [3 /*break*/, 8];
                        action = _b.value;
                        _f.label = 4;
                    case 4:
                        _f.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.actionExecutor.executeAction(action, context)];
                    case 5:
                        result_1 = _f.sent();
                        actionResults.push({ action: action.type, success: true, result: result_1 });
                        this.emitEvent('automation.action.executed', {
                            ruleId: rule.id,
                            actionType: action.type,
                            success: true,
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _f.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        actionResults.push({ action: action.type, success: false, error: errorMessage });
                        (_e = this.context) === null || _e === void 0 ? void 0 : _e.logger.error("Error executing action ".concat(action.type, " in rule ").concat(rule.id, ":"), error_1 instanceof Error ? error_1 : new Error(errorMessage));
                        return [3 /*break*/, 7];
                    case 7:
                        _b = _a.next();
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_3_1 = _f.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 11: 
                    // Update execution stats
                    return [4 /*yield*/, this.storage.updateRule(rule.id, {
                            lastExecutedAt: new Date(),
                            executionCount: (rule.executionCount || 0) + 1,
                        })];
                    case 12:
                        // Update execution stats
                        _f.sent();
                        result = {
                            ruleId: rule.id,
                            success: true,
                            executedAt: new Date(),
                            actionsExecuted: rule.actions.length,
                            results: actionResults,
                        };
                        this.emitEvent('automation.rule.executed', result);
                        return [2 /*return*/, result];
                    case 13:
                        error_2 = _f.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : 'Unknown error';
                        // Mark rule as errored
                        return [4 /*yield*/, this.storage.updateRule(rule.id, {
                                status: 'error',
                                error: errorMessage,
                            })];
                    case 14:
                        // Mark rule as errored
                        _f.sent();
                        result = {
                            ruleId: rule.id,
                            success: false,
                            executedAt: new Date(),
                            actionsExecuted: actionResults.length,
                            error: errorMessage,
                            results: actionResults,
                        };
                        this.emitEvent('automation.rule.failed', result);
                        return [2 /*return*/, result];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Emit automation events using kernel trigger system
     */
    AutomationPlugin.prototype.emitEvent = function (event, data) {
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
     * Register an automation rule
     */
    AutomationPlugin.prototype.registerRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.storage.saveRule(rule)];
                    case 1:
                        _b.sent();
                        // Register scheduled trigger if applicable
                        if (rule.status === 'active' && rule.trigger.type === 'scheduled') {
                            this.triggerEngine.registerScheduledTrigger(rule.id, rule.trigger, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.executeRule(rule, {})];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            }); }); });
                        }
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info("[Automation Plugin] Registered rule: ".concat(rule.name));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get an automation rule
     */
    AutomationPlugin.prototype.getRule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getRule(id)];
            });
        });
    };
    /**
     * List automation rules
     */
    AutomationPlugin.prototype.listRules = function (filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.listRules(filter)];
            });
        });
    };
    /**
     * Register a formula field
     */
    AutomationPlugin.prototype.registerFormula = function (formula) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.storage.saveFormula(formula)];
                    case 1:
                        _b.sent();
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info("[Automation Plugin] Registered formula: ".concat(formula.objectName, ".").concat(formula.name));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate a formula field
     */
    AutomationPlugin.prototype.calculateFormula = function (objectName, fieldName, record) {
        return __awaiter(this, void 0, void 0, function () {
            var formula, value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getFormula(objectName, fieldName)];
                    case 1:
                        formula = _a.sent();
                        if (!formula) {
                            throw new Error("Formula not found: ".concat(objectName, ".").concat(fieldName));
                        }
                        return [4 /*yield*/, this.formulaEngine.calculateFormula(formula, record)];
                    case 2:
                        value = _a.sent();
                        this.emitEvent('automation.formula.calculated', {
                            objectName: objectName,
                            fieldName: fieldName,
                            value: value,
                        });
                        return [2 /*return*/, value];
                }
            });
        });
    };
    /**
     * Get engines (for external configuration)
     */
    AutomationPlugin.prototype.getTriggerEngine = function () {
        return this.triggerEngine;
    };
    AutomationPlugin.prototype.getActionExecutor = function () {
        return this.actionExecutor;
    };
    AutomationPlugin.prototype.getFormulaEngine = function () {
        return this.formulaEngine;
    };
    /**
     * Cleanup and shutdown
     */
    AutomationPlugin.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                this.triggerEngine.shutdown();
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Automation Plugin] Destroyed');
                return [2 /*return*/];
            });
        });
    };
    return AutomationPlugin;
}());
exports.AutomationPlugin = AutomationPlugin;
/**
 * Helper function to access the automation API from kernel
 */
function getAutomationAPI(kernel) {
    try {
        return kernel.getService('automation');
    }
    catch (_a) {
        return null;
    }
}
