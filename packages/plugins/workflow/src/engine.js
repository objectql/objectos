"use strict";
/**
 * Workflow Engine
 *
 * Finite State Machine (FSM) execution engine
 */
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
exports.WorkflowEngine = void 0;
/**
 * Workflow engine for executing state machines
 */
var WorkflowEngine = /** @class */ (function () {
    function WorkflowEngine(logger) {
        this.guards = new Map();
        this.actions = new Map();
        this.logger = logger || console;
    }
    /**
     * Register a guard function
     */
    WorkflowEngine.prototype.registerGuard = function (name, guard) {
        this.guards.set(name, guard);
    };
    /**
     * Register an action function
     */
    WorkflowEngine.prototype.registerAction = function (name, action) {
        this.actions.set(name, action);
    };
    /**
     * Create a new workflow instance
     */
    WorkflowEngine.prototype.createInstance = function (definition, data, startedBy) {
        if (data === void 0) { data = {}; }
        var instance = {
            id: this.generateInstanceId(),
            workflowId: definition.id,
            version: definition.version,
            currentState: definition.initialState,
            status: 'pending',
            data: data,
            history: [],
            createdAt: new Date(),
            startedBy: startedBy,
        };
        return instance;
    };
    /**
     * Start a workflow instance
     */
    WorkflowEngine.prototype.startInstance = function (instance, definition) {
        return __awaiter(this, void 0, void 0, function () {
            var initialState, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (instance.status !== 'pending') {
                            throw new Error("Cannot start workflow in status: ".concat(instance.status));
                        }
                        instance.status = 'running';
                        instance.startedAt = new Date();
                        initialState = definition.states[instance.currentState];
                        context = this.createContext(instance, definition, initialState);
                        if (!initialState.onEnter) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.executeActions(initialState.onEnter, context)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Check if initial state is final
                        if (initialState.final) {
                            instance.status = 'completed';
                            instance.completedAt = new Date();
                        }
                        return [2 /*return*/, instance];
                }
            });
        });
    };
    /**
     * Execute a transition
     */
    WorkflowEngine.prototype.executeTransition = function (instance, definition, transitionName, triggeredBy, transitionData) {
        return __awaiter(this, void 0, void 0, function () {
            var currentState, transition, context, guardsPass, fromState, toState, historyEntry, newState, newContext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (instance.status !== 'running') {
                            throw new Error("Cannot execute transition on workflow in status: ".concat(instance.status));
                        }
                        currentState = definition.states[instance.currentState];
                        if (!currentState.transitions || !currentState.transitions[transitionName]) {
                            throw new Error("Transition \"".concat(transitionName, "\" not available in state \"").concat(instance.currentState, "\""));
                        }
                        transition = currentState.transitions[transitionName];
                        context = this.createContext(instance, definition, currentState, {
                            name: transitionName,
                            config: transition,
                        });
                        if (!transition.guards) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.checkGuards(transition.guards, context)];
                    case 1:
                        guardsPass = _a.sent();
                        if (!guardsPass) {
                            throw new Error("Transition \"".concat(transitionName, "\" blocked by guard conditions"));
                        }
                        _a.label = 2;
                    case 2:
                        fromState = instance.currentState;
                        toState = transition.target;
                        if (!currentState.onExit) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.executeActions(currentState.onExit, context)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!transition.actions) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.executeActions(transition.actions, context)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        // Update instance state
                        instance.currentState = toState;
                        historyEntry = {
                            fromState: fromState,
                            toState: toState,
                            transition: transitionName,
                            timestamp: new Date(),
                            triggeredBy: triggeredBy,
                            data: transitionData,
                        };
                        instance.history.push(historyEntry);
                        newState = definition.states[toState];
                        newContext = this.createContext(instance, definition, newState);
                        if (!newState.onEnter) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.executeActions(newState.onEnter, newContext)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        // Check if new state is final
                        if (newState.final) {
                            instance.status = 'completed';
                            instance.completedAt = new Date();
                            instance.completedBy = triggeredBy;
                        }
                        return [2 /*return*/, instance];
                }
            });
        });
    };
    /**
     * Abort a workflow instance
     */
    WorkflowEngine.prototype.abortInstance = function (instance, definition, abortedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var currentState, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (instance.status !== 'running') {
                            throw new Error("Cannot abort workflow in status: ".concat(instance.status));
                        }
                        instance.status = 'aborted';
                        instance.abortedAt = new Date();
                        instance.completedBy = abortedBy;
                        currentState = definition.states[instance.currentState];
                        if (!currentState.onExit) return [3 /*break*/, 2];
                        context = this.createContext(instance, definition, currentState);
                        return [4 /*yield*/, this.executeActions(currentState.onExit, context)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, instance];
                }
            });
        });
    };
    /**
     * Get available transitions for current state
     */
    WorkflowEngine.prototype.getAvailableTransitions = function (instance, definition) {
        var currentState = definition.states[instance.currentState];
        if (!currentState.transitions) {
            return [];
        }
        return Object.keys(currentState.transitions);
    };
    /**
     * Check if a transition is available
     */
    WorkflowEngine.prototype.canExecuteTransition = function (instance, definition, transitionName) {
        return __awaiter(this, void 0, void 0, function () {
            var currentState, transition, context;
            return __generator(this, function (_a) {
                if (instance.status !== 'running') {
                    return [2 /*return*/, false];
                }
                currentState = definition.states[instance.currentState];
                if (!currentState.transitions || !currentState.transitions[transitionName]) {
                    return [2 /*return*/, false];
                }
                transition = currentState.transitions[transitionName];
                if (!transition.guards || transition.guards.length === 0) {
                    return [2 /*return*/, true];
                }
                context = this.createContext(instance, definition, currentState, {
                    name: transitionName,
                    config: transition,
                });
                return [2 /*return*/, this.checkGuards(transition.guards, context)];
            });
        });
    };
    /**
     * Create a workflow context
     */
    WorkflowEngine.prototype.createContext = function (instance, definition, currentState, transition) {
        return {
            instance: instance,
            definition: definition,
            currentState: currentState,
            transition: transition,
            logger: this.logger,
            getData: function (key) {
                if (key === undefined) {
                    return instance.data;
                }
                return instance.data[key];
            },
            setData: function (key, value) {
                instance.data[key] = value;
            },
        };
    };
    /**
     * Check guard conditions
     */
    WorkflowEngine.prototype.checkGuards = function (guards, context) {
        return __awaiter(this, void 0, void 0, function () {
            var guards_1, guards_1_1, guard, result, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 7]);
                        guards_1 = __values(guards), guards_1_1 = guards_1.next();
                        _b.label = 1;
                    case 1:
                        if (!!guards_1_1.done) return [3 /*break*/, 4];
                        guard = guards_1_1.value;
                        return [4 /*yield*/, guard(context)];
                    case 2:
                        result = _b.sent();
                        if (!result) {
                            return [2 /*return*/, false];
                        }
                        _b.label = 3;
                    case 3:
                        guards_1_1 = guards_1.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (guards_1_1 && !guards_1_1.done && (_a = guards_1.return)) _a.call(guards_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Execute actions
     */
    WorkflowEngine.prototype.executeActions = function (actions, context) {
        return __awaiter(this, void 0, void 0, function () {
            var actions_1, actions_1_1, action, error_1, e_2_1;
            var e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, 8, 9]);
                        actions_1 = __values(actions), actions_1_1 = actions_1.next();
                        _b.label = 1;
                    case 1:
                        if (!!actions_1_1.done) return [3 /*break*/, 6];
                        action = actions_1_1.value;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, action(context)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        this.logger.error('Error executing action:', error_1);
                        throw error_1;
                    case 5:
                        actions_1_1 = actions_1.next();
                        return [3 /*break*/, 1];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (actions_1_1 && !actions_1_1.done && (_a = actions_1.return)) _a.call(actions_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a unique instance ID
     */
    WorkflowEngine.prototype.generateInstanceId = function () {
        return "wf_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 11));
    };
    return WorkflowEngine;
}());
exports.WorkflowEngine = WorkflowEngine;
