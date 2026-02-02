"use strict";
/**
 * Workflow Storage Implementation
 *
 * In-memory storage for workflow definitions, instances, and tasks
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
exports.InMemoryWorkflowStorage = void 0;
/**
 * In-memory workflow storage
 */
var InMemoryWorkflowStorage = /** @class */ (function () {
    function InMemoryWorkflowStorage() {
        this.definitions = new Map();
        this.instances = new Map();
        this.tasks = new Map();
    }
    /**
     * Save a workflow definition
     */
    InMemoryWorkflowStorage.prototype.saveDefinition = function (definition) {
        return __awaiter(this, void 0, void 0, function () {
            var versions;
            return __generator(this, function (_a) {
                if (!this.definitions.has(definition.id)) {
                    this.definitions.set(definition.id, new Map());
                }
                versions = this.definitions.get(definition.id);
                versions.set(definition.version, definition);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get a workflow definition
     */
    InMemoryWorkflowStorage.prototype.getDefinition = function (id, version) {
        return __awaiter(this, void 0, void 0, function () {
            var versions, allVersions;
            return __generator(this, function (_a) {
                versions = this.definitions.get(id);
                if (!versions)
                    return [2 /*return*/, null];
                if (version) {
                    return [2 /*return*/, versions.get(version) || null];
                }
                allVersions = Array.from(versions.values());
                if (allVersions.length === 0)
                    return [2 /*return*/, null];
                return [2 /*return*/, allVersions[allVersions.length - 1]];
            });
        });
    };
    /**
     * List all workflow definitions
     */
    InMemoryWorkflowStorage.prototype.listDefinitions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, _b, versions, allVersions;
            var e_1, _c;
            return __generator(this, function (_d) {
                result = [];
                try {
                    for (_a = __values(this.definitions.values()), _b = _a.next(); !_b.done; _b = _a.next()) {
                        versions = _b.value;
                        allVersions = Array.from(versions.values());
                        if (allVersions.length > 0) {
                            result.push(allVersions[allVersions.length - 1]);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return [2 /*return*/, result];
            });
        });
    };
    /**
     * Save a workflow instance
     */
    InMemoryWorkflowStorage.prototype.saveInstance = function (instance) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.instances.set(instance.id, __assign({}, instance));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get a workflow instance
     */
    InMemoryWorkflowStorage.prototype.getInstance = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var instance;
            return __generator(this, function (_a) {
                instance = this.instances.get(id);
                return [2 /*return*/, instance ? __assign({}, instance) : null];
            });
        });
    };
    /**
     * Update a workflow instance
     */
    InMemoryWorkflowStorage.prototype.updateInstance = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var instance;
            return __generator(this, function (_a) {
                instance = this.instances.get(id);
                if (!instance) {
                    throw new Error("Workflow instance not found: ".concat(id));
                }
                Object.assign(instance, updates);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Query workflow instances
     */
    InMemoryWorkflowStorage.prototype.queryInstances = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var results, statuses_1, sortOrder_1;
            return __generator(this, function (_a) {
                results = Array.from(this.instances.values());
                // Filter by workflow ID
                if (options.workflowId) {
                    results = results.filter(function (i) { return i.workflowId === options.workflowId; });
                }
                // Filter by status
                if (options.status) {
                    statuses_1 = Array.isArray(options.status) ? options.status : [options.status];
                    results = results.filter(function (i) { return statuses_1.includes(i.status); });
                }
                // Filter by started user
                if (options.startedBy) {
                    results = results.filter(function (i) { return i.startedBy === options.startedBy; });
                }
                // Sort
                if (options.sortBy) {
                    sortOrder_1 = options.sortOrder || 'desc';
                    results.sort(function (a, b) {
                        var aVal = a[options.sortBy];
                        var bVal = b[options.sortBy];
                        if (!aVal && !bVal)
                            return 0;
                        if (!aVal)
                            return sortOrder_1 === 'asc' ? 1 : -1;
                        if (!bVal)
                            return sortOrder_1 === 'asc' ? -1 : 1;
                        var comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                        return sortOrder_1 === 'asc' ? comparison : -comparison;
                    });
                }
                // Pagination
                if (options.skip) {
                    results = results.slice(options.skip);
                }
                if (options.limit) {
                    results = results.slice(0, options.limit);
                }
                return [2 /*return*/, results.map(function (i) { return (__assign({}, i)); })];
            });
        });
    };
    /**
     * Save a task
     */
    InMemoryWorkflowStorage.prototype.saveTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.tasks.set(task.id, __assign({}, task));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get a task
     */
    InMemoryWorkflowStorage.prototype.getTask = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                task = this.tasks.get(id);
                return [2 /*return*/, task ? __assign({}, task) : null];
            });
        });
    };
    /**
     * Get tasks for an instance
     */
    InMemoryWorkflowStorage.prototype.getInstanceTasks = function (instanceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tasks.values())
                        .filter(function (t) { return t.instanceId === instanceId; })
                        .map(function (t) { return (__assign({}, t)); })];
            });
        });
    };
    /**
     * Update a task
     */
    InMemoryWorkflowStorage.prototype.updateTask = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                task = this.tasks.get(id);
                if (!task) {
                    throw new Error("Task not found: ".concat(id));
                }
                Object.assign(task, updates);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Clear all data (for testing)
     */
    InMemoryWorkflowStorage.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.definitions.clear();
                this.instances.clear();
                this.tasks.clear();
                return [2 /*return*/];
            });
        });
    };
    return InMemoryWorkflowStorage;
}());
exports.InMemoryWorkflowStorage = InMemoryWorkflowStorage;
