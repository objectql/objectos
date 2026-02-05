"use strict";
/**
 * In-Memory Job Storage
 *
 * Simple in-memory implementation of job storage.
 * For production use, implement a persistent storage adapter (Redis, PostgreSQL, etc.)
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
exports.InMemoryJobStorage = void 0;
var InMemoryJobStorage = /** @class */ (function () {
    function InMemoryJobStorage() {
        this.jobs = new Map();
    }
    InMemoryJobStorage.prototype.save = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.jobs.set(job.id, __assign({}, job));
                return [2 /*return*/];
            });
        });
    };
    InMemoryJobStorage.prototype.get = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                job = this.jobs.get(id);
                return [2 /*return*/, job ? __assign({}, job) : null];
            });
        });
    };
    InMemoryJobStorage.prototype.update = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                job = this.jobs.get(id);
                if (!job) {
                    throw new Error("Job ".concat(id, " not found"));
                }
                this.jobs.set(id, __assign(__assign({}, job), updates));
                return [2 /*return*/];
            });
        });
    };
    InMemoryJobStorage.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.jobs.delete(id);
                return [2 /*return*/];
            });
        });
    };
    InMemoryJobStorage.prototype.query = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var results, statuses_1, sortOrder_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                results = Array.from(this.jobs.values());
                // Filter by name
                if (options.name) {
                    results = results.filter(function (job) { return job.name === options.name; });
                }
                // Filter by status
                if (options.status) {
                    statuses_1 = Array.isArray(options.status)
                        ? options.status
                        : [options.status];
                    results = results.filter(function (job) { return statuses_1.includes(job.status); });
                }
                // Filter by priority
                if (options.priority) {
                    results = results.filter(function (job) { return job.priority === options.priority; });
                }
                // Sort results
                if (options.sortBy) {
                    sortOrder_1 = options.sortOrder === 'desc' ? -1 : 1;
                    results.sort(function (a, b) {
                        var _a, _b;
                        var aVal;
                        var bVal;
                        switch (options.sortBy) {
                            case 'createdAt':
                                aVal = a.createdAt.getTime();
                                bVal = b.createdAt.getTime();
                                break;
                            case 'priority':
                                var priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
                                aVal = priorityOrder[a.priority];
                                bVal = priorityOrder[b.priority];
                                break;
                            case 'nextRun':
                                aVal = ((_a = a.nextRun) === null || _a === void 0 ? void 0 : _a.getTime()) || 0;
                                bVal = ((_b = b.nextRun) === null || _b === void 0 ? void 0 : _b.getTime()) || 0;
                                break;
                            default:
                                return 0;
                        }
                        return (aVal - bVal) * sortOrder_1;
                    });
                }
                // Apply pagination
                if (options.skip) {
                    results = results.slice(options.skip);
                }
                if (options.limit) {
                    results = results.slice(0, options.limit);
                }
                return [2 /*return*/, results.map(function (job) { return (__assign({}, job)); })];
            });
        });
    };
    InMemoryJobStorage.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var jobs, stats, jobs_1, jobs_1_1, job;
            var e_1, _a;
            return __generator(this, function (_b) {
                jobs = Array.from(this.jobs.values());
                stats = {
                    total: jobs.length,
                    pending: 0,
                    running: 0,
                    completed: 0,
                    failed: 0,
                    cancelled: 0,
                    scheduled: 0,
                };
                try {
                    for (jobs_1 = __values(jobs), jobs_1_1 = jobs_1.next(); !jobs_1_1.done; jobs_1_1 = jobs_1.next()) {
                        job = jobs_1_1.value;
                        switch (job.status) {
                            case 'pending':
                                stats.pending++;
                                break;
                            case 'running':
                                stats.running++;
                                break;
                            case 'completed':
                                stats.completed++;
                                break;
                            case 'failed':
                                stats.failed++;
                                break;
                            case 'cancelled':
                                stats.cancelled++;
                                break;
                            case 'scheduled':
                                stats.scheduled++;
                                break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (jobs_1_1 && !jobs_1_1.done && (_a = jobs_1.return)) _a.call(jobs_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return [2 /*return*/, stats];
            });
        });
    };
    InMemoryJobStorage.prototype.getNextPending = function () {
        return __awaiter(this, void 0, void 0, function () {
            var jobs, pendingJobs;
            return __generator(this, function (_a) {
                jobs = Array.from(this.jobs.values());
                pendingJobs = jobs.filter(function (job) { return job.status === 'pending'; });
                if (pendingJobs.length === 0) {
                    return [2 /*return*/, null];
                }
                // Sort by priority (critical > high > normal > low) then by createdAt
                pendingJobs.sort(function (a, b) {
                    var priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
                    var priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (priorityDiff !== 0) {
                        return priorityDiff;
                    }
                    return a.createdAt.getTime() - b.createdAt.getTime();
                });
                return [2 /*return*/, __assign({}, pendingJobs[0])];
            });
        });
    };
    InMemoryJobStorage.prototype.getScheduledDue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, jobs;
            return __generator(this, function (_a) {
                now = new Date();
                jobs = Array.from(this.jobs.values());
                return [2 /*return*/, jobs
                        .filter(function (job) {
                        return job.status === 'scheduled' &&
                            job.nextRun &&
                            job.nextRun <= now;
                    })
                        .map(function (job) { return (__assign({}, job)); })];
            });
        });
    };
    /**
     * Clear all jobs (for testing)
     */
    InMemoryJobStorage.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.jobs.clear();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get all jobs (for testing)
     */
    InMemoryJobStorage.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobs.values()).map(function (job) { return (__assign({}, job)); })];
            });
        });
    };
    return InMemoryJobStorage;
}());
exports.InMemoryJobStorage = InMemoryJobStorage;
