"use strict";
/**
 * Workflow Plugin for ObjectOS
 *
 * This plugin provides comprehensive workflow and state machine capabilities including:
 * - Finite State Machine (FSM) from YAML
 * - State transitions with guards
 * - Transition actions
 * - Workflow versioning
 * - Different workflow types (approval, sequential, parallel, conditional)
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowPlugin = void 0;
exports.getWorkflowAPI = getWorkflowAPI;
var storage_1 = require("./storage");
var engine_1 = require("./engine");
var api_1 = require("./api");
/**
 * Workflow Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
var WorkflowPlugin = /** @class */ (function () {
    function WorkflowPlugin(config) {
        if (config === void 0) { config = {}; }
        this.name = 'com.objectos.workflow';
        this.version = '0.1.0';
        this.dependencies = [];
        this.logger = console; // Fallback logger before initialization
        this.config = __assign({ enabled: true, defaultTimeout: 3600000, maxTransitions: 1000 }, config);
        this.storage = config.storage || new storage_1.InMemoryWorkflowStorage();
        this.engine = new engine_1.WorkflowEngine();
        this.api = new api_1.WorkflowAPI(this.storage, this.engine);
    }
    /**
     * Initialize plugin - Register services and subscribe to events
     */
    WorkflowPlugin.prototype.init = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.context = context;
                        this.logger = context.logger;
                        // Update engine logger
                        this.engine.logger = context.logger;
                        // Register workflow service
                        context.registerService('workflow', this);
                        // Set up event listeners using kernel hooks
                        return [4 /*yield*/, this.setupEventListeners(context)];
                    case 1:
                        // Set up event listeners using kernel hooks
                        _a.sent();
                        context.logger.info('[Workflow Plugin] Initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start plugin - Connect to databases, start servers
     */
    WorkflowPlugin.prototype.start = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                context.logger.info('[Workflow Plugin] Starting...');
                // Note: Unlike the Automation Plugin, the Workflow Plugin does not have scheduled
                // triggers that need to be registered at startup. Workflows are started on-demand
                // via API calls or event triggers that are already registered in init().
                context.logger.info('[Workflow Plugin] Started successfully');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Set up event listeners for workflow lifecycle using kernel hooks
     */
    WorkflowPlugin.prototype.setupEventListeners = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                // Listen for data create events to trigger workflows
                context.hook('data.create', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    var error_1;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, this.emitEvent('workflow.trigger', { type: 'data.create', data: data })];
                            case 1:
                                _b.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                error_1 = _b.sent();
                                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.error('[Workflow Plugin] Error emitting workflow.trigger event:', error_1);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Workflow Plugin] Event listeners registered');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Emit workflow events using kernel trigger system
     */
    WorkflowPlugin.prototype.emitEvent = function (event, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.context) {
                            this.logger.warn("[Workflow Plugin] Cannot emit event before initialization: ".concat(event));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.context.trigger(event, data)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register a workflow definition
     */
    WorkflowPlugin.prototype.registerWorkflow = function (definition) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.api.registerWorkflow(definition)];
                    case 1:
                        _b.sent();
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info("[Workflow Plugin] Registered workflow: ".concat(definition.name));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the workflow API
     */
    WorkflowPlugin.prototype.getAPI = function () {
        return this.api;
    };
    /**
     * Get the workflow engine (for registering guards/actions)
     */
    WorkflowPlugin.prototype.getEngine = function () {
        return this.engine;
    };
    /**
     * Cleanup and shutdown
     */
    WorkflowPlugin.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Workflow Plugin] Destroyed');
                return [2 /*return*/];
            });
        });
    };
    return WorkflowPlugin;
}());
exports.WorkflowPlugin = WorkflowPlugin;
/**
 * Helper function to access the workflow API from kernel
 */
function getWorkflowAPI(kernel) {
    try {
        return kernel.getService('workflow');
    }
    catch (_a) {
        return null;
    }
}
