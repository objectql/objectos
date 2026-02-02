"use strict";
/**
 * Workflow API
 *
 * High-level API for workflow management
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
exports.WorkflowAPI = void 0;
var engine_1 = require("./engine");
/**
 * Workflow API class
 */
var WorkflowAPI = /** @class */ (function () {
    function WorkflowAPI(storage, engine) {
        this.storage = storage;
        this.engine = engine || new engine_1.WorkflowEngine();
    }
    /**
     * Register a workflow definition
     */
    WorkflowAPI.prototype.registerWorkflow = function (definition) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.saveDefinition(definition)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a workflow definition
     */
    WorkflowAPI.prototype.getWorkflow = function (id, version) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getDefinition(id, version)];
            });
        });
    };
    /**
     * List all workflow definitions
     */
    WorkflowAPI.prototype.listWorkflows = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.listDefinitions()];
            });
        });
    };
    /**
     * Start a new workflow instance
     */
    WorkflowAPI.prototype.startWorkflow = function (workflowId_1) {
        return __awaiter(this, arguments, void 0, function (workflowId, data, startedBy, version) {
            var definition, instance;
            if (data === void 0) { data = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getDefinition(workflowId, version)];
                    case 1:
                        definition = _a.sent();
                        if (!definition) {
                            throw new Error("Workflow not found: ".concat(workflowId));
                        }
                        instance = this.engine.createInstance(definition, data, startedBy);
                        return [4 /*yield*/, this.storage.saveInstance(instance)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.engine.startInstance(instance, definition)];
                    case 3:
                        instance = _a.sent();
                        return [4 /*yield*/, this.storage.updateInstance(instance.id, instance)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, instance];
                }
            });
        });
    };
    /**
     * Get workflow instance status
     */
    WorkflowAPI.prototype.getWorkflowStatus = function (instanceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getInstance(instanceId)];
            });
        });
    };
    /**
     * Execute a transition
     */
    WorkflowAPI.prototype.executeTransition = function (instanceId, transitionName, triggeredBy, data) {
        return __awaiter(this, void 0, void 0, function () {
            var instance, definition, updatedInstance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getInstance(instanceId)];
                    case 1:
                        instance = _a.sent();
                        if (!instance) {
                            throw new Error("Workflow instance not found: ".concat(instanceId));
                        }
                        return [4 /*yield*/, this.storage.getDefinition(instance.workflowId, instance.version)];
                    case 2:
                        definition = _a.sent();
                        if (!definition) {
                            throw new Error("Workflow definition not found: ".concat(instance.workflowId, " v").concat(instance.version));
                        }
                        return [4 /*yield*/, this.engine.executeTransition(instance, definition, transitionName, triggeredBy, data)];
                    case 3:
                        updatedInstance = _a.sent();
                        return [4 /*yield*/, this.storage.updateInstance(instanceId, updatedInstance)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, updatedInstance];
                }
            });
        });
    };
    /**
     * Abort a workflow instance
     */
    WorkflowAPI.prototype.abortWorkflow = function (instanceId, abortedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var instance, definition, updatedInstance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getInstance(instanceId)];
                    case 1:
                        instance = _a.sent();
                        if (!instance) {
                            throw new Error("Workflow instance not found: ".concat(instanceId));
                        }
                        return [4 /*yield*/, this.storage.getDefinition(instance.workflowId, instance.version)];
                    case 2:
                        definition = _a.sent();
                        if (!definition) {
                            throw new Error("Workflow definition not found: ".concat(instance.workflowId, " v").concat(instance.version));
                        }
                        return [4 /*yield*/, this.engine.abortInstance(instance, definition, abortedBy)];
                    case 3:
                        updatedInstance = _a.sent();
                        return [4 /*yield*/, this.storage.updateInstance(instanceId, updatedInstance)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, updatedInstance];
                }
            });
        });
    };
    /**
     * Query workflow instances
     */
    WorkflowAPI.prototype.queryWorkflows = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.queryInstances(options)];
            });
        });
    };
    /**
     * Get available transitions for an instance
     */
    WorkflowAPI.prototype.getAvailableTransitions = function (instanceId) {
        return __awaiter(this, void 0, void 0, function () {
            var instance, definition;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getInstance(instanceId)];
                    case 1:
                        instance = _a.sent();
                        if (!instance) {
                            throw new Error("Workflow instance not found: ".concat(instanceId));
                        }
                        return [4 /*yield*/, this.storage.getDefinition(instance.workflowId, instance.version)];
                    case 2:
                        definition = _a.sent();
                        if (!definition) {
                            throw new Error("Workflow definition not found: ".concat(instance.workflowId, " v").concat(instance.version));
                        }
                        return [2 /*return*/, this.engine.getAvailableTransitions(instance, definition)];
                }
            });
        });
    };
    /**
     * Check if a transition can be executed
     */
    WorkflowAPI.prototype.canExecuteTransition = function (instanceId, transitionName) {
        return __awaiter(this, void 0, void 0, function () {
            var instance, definition;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getInstance(instanceId)];
                    case 1:
                        instance = _a.sent();
                        if (!instance) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.storage.getDefinition(instance.workflowId, instance.version)];
                    case 2:
                        definition = _a.sent();
                        if (!definition) {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, this.engine.canExecuteTransition(instance, definition, transitionName)];
                }
            });
        });
    };
    /**
     * Create a task
     */
    WorkflowAPI.prototype.createTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var newTask;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newTask = __assign(__assign({}, task), { id: this.generateTaskId(), createdAt: new Date() });
                        return [4 /*yield*/, this.storage.saveTask(newTask)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, newTask];
                }
            });
        });
    };
    /**
     * Get a task
     */
    WorkflowAPI.prototype.getTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getTask(taskId)];
            });
        });
    };
    /**
     * Get tasks for a workflow instance
     */
    WorkflowAPI.prototype.getInstanceTasks = function (instanceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getInstanceTasks(instanceId)];
            });
        });
    };
    /**
     * Complete a task
     */
    WorkflowAPI.prototype.completeTask = function (taskId, result) {
        return __awaiter(this, void 0, void 0, function () {
            var task, updatedTask;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getTask(taskId)];
                    case 1:
                        task = _a.sent();
                        if (!task) {
                            throw new Error("Task not found: ".concat(taskId));
                        }
                        if (task.status !== 'pending') {
                            throw new Error("Cannot complete task in status: ".concat(task.status));
                        }
                        return [4 /*yield*/, this.storage.updateTask(taskId, {
                                status: 'completed',
                                completedAt: new Date(),
                                result: result,
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.storage.getTask(taskId)];
                    case 3:
                        updatedTask = _a.sent();
                        return [2 /*return*/, updatedTask];
                }
            });
        });
    };
    /**
     * Reject a task
     */
    WorkflowAPI.prototype.rejectTask = function (taskId, result) {
        return __awaiter(this, void 0, void 0, function () {
            var task, updatedTask;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getTask(taskId)];
                    case 1:
                        task = _a.sent();
                        if (!task) {
                            throw new Error("Task not found: ".concat(taskId));
                        }
                        if (task.status !== 'pending') {
                            throw new Error("Cannot reject task in status: ".concat(task.status));
                        }
                        return [4 /*yield*/, this.storage.updateTask(taskId, {
                                status: 'rejected',
                                completedAt: new Date(),
                                result: result,
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.storage.getTask(taskId)];
                    case 3:
                        updatedTask = _a.sent();
                        return [2 /*return*/, updatedTask];
                }
            });
        });
    };
    /**
     * Get the workflow engine (for registering guards/actions)
     */
    WorkflowAPI.prototype.getEngine = function () {
        return this.engine;
    };
    /**
     * Generate a unique task ID
     */
    WorkflowAPI.prototype.generateTaskId = function () {
        return "task_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 11));
    };
    return WorkflowAPI;
}());
exports.WorkflowAPI = WorkflowAPI;
