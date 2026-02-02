"use strict";
/**
 * Jobs Plugin for ObjectOS
 *
 * This plugin provides comprehensive job queue and scheduling capabilities including:
 * - Background job processing with queue management
 * - Cron-based job scheduling
 * - Automatic retry logic with exponential backoff
 * - Job monitoring and statistics
 * - Built-in jobs for common tasks (cleanup, reports, backups)
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
exports.JobsPlugin = void 0;
exports.getJobsAPI = getJobsAPI;
var storage_1 = require("./storage");
var queue_1 = require("./queue");
var scheduler_1 = require("./scheduler");
var built_in_jobs_1 = require("./built-in-jobs");
/**
 * Jobs Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
var JobsPlugin = /** @class */ (function () {
    function JobsPlugin(config) {
        if (config === void 0) { config = {}; }
        this.name = 'com.objectos.jobs';
        this.version = '0.1.0';
        this.dependencies = [];
        this.config = __assign({ enabled: true, concurrency: 5, pollInterval: 1000, defaultMaxRetries: 3, defaultRetryDelay: 1000, defaultTimeout: 60000, enableBuiltInJobs: true }, config);
        this.storage = config.storage || new storage_1.InMemoryJobStorage();
        // Initialize queue
        this.queue = new queue_1.JobQueue({
            storage: this.storage,
            concurrency: this.config.concurrency,
            defaultMaxRetries: this.config.defaultMaxRetries,
            defaultRetryDelay: this.config.defaultRetryDelay,
            defaultTimeout: this.config.defaultTimeout,
        });
        // Initialize scheduler
        this.scheduler = new scheduler_1.JobScheduler({
            storage: this.storage,
            queue: this.queue,
        });
    }
    /**
     * Initialize plugin - Register services and subscribe to events
     */
    JobsPlugin.prototype.init = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.context = context;
                        // Update loggers
                        this.queue.logger = context.logger;
                        this.scheduler.logger = context.logger;
                        // Register jobs service
                        context.registerService('jobs', this);
                        // Register built-in jobs if enabled
                        if (this.config.enableBuiltInJobs) {
                            this.registerBuiltInJobs();
                        }
                        // Set up event listeners using kernel hooks
                        return [4 /*yield*/, this.setupEventListeners(context)];
                    case 1:
                        // Set up event listeners using kernel hooks
                        _a.sent();
                        context.logger.info('[Jobs Plugin] Initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register built-in job handlers
     */
    JobsPlugin.prototype.registerBuiltInJobs = function () {
        var _a;
        // Data cleanup job
        var cleanupJob = (0, built_in_jobs_1.createDataCleanupJob)({
            objects: [],
            retentionDays: 90,
        });
        this.queue.registerHandler(cleanupJob);
        // Report generation job
        var reportJob = (0, built_in_jobs_1.createReportJob)({
            reportType: 'default',
        });
        this.queue.registerHandler(reportJob);
        // Backup job
        var backupJob = (0, built_in_jobs_1.createBackupJob)({
            destination: '/tmp/backups',
        });
        this.queue.registerHandler(backupJob);
        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Jobs Plugin] Built-in jobs registered');
    };
    /**
     * Set up event listeners for job lifecycle using kernel hooks
     */
    JobsPlugin.prototype.setupEventListeners = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                // Listen for data events that might trigger jobs
                context.hook('data.create', function (data) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.emitEvent('job.trigger', { type: 'data.create', data: data })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Jobs Plugin] Event listeners registered');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Emit job events using kernel trigger system
     */
    JobsPlugin.prototype.emitEvent = function (event, data) {
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
     * Register a custom job handler
     */
    JobsPlugin.prototype.registerHandler = function (definition) {
        this.queue.registerHandler(definition);
    };
    /**
     * Add a job to the queue
     */
    JobsPlugin.prototype.enqueue = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queue.enqueue(config)];
                    case 1:
                        job = _a.sent();
                        return [4 /*yield*/, this.emitEvent('job.enqueued', job)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, job];
                }
            });
        });
    };
    /**
     * Schedule a recurring job
     */
    JobsPlugin.prototype.schedule = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.scheduler.scheduleJob(config)];
                    case 1:
                        job = _a.sent();
                        return [4 /*yield*/, this.emitEvent('job.scheduled', job)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, job];
                }
            });
        });
    };
    /**
     * Cancel a job
     */
    JobsPlugin.prototype.cancel = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queue.cancel(jobId)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.emitEvent('job.cancelled', { jobId: jobId })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get job by ID
     */
    JobsPlugin.prototype.getJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.queue.getJob(jobId)];
            });
        });
    };
    /**
     * Query jobs
     */
    JobsPlugin.prototype.queryJobs = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.queue.queryJobs(options)];
            });
        });
    };
    /**
     * Get queue statistics
     */
    JobsPlugin.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.queue.getStats()];
            });
        });
    };
    /**
     * Start job processing
     */
    JobsPlugin.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                this.scheduler.start();
                (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Jobs Plugin] Started');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Cleanup and shutdown
     */
    JobsPlugin.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.queue.stopProcessing()];
                    case 1:
                        _b.sent();
                        this.scheduler.stop();
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Jobs Plugin] Destroyed');
                        return [2 /*return*/];
                }
            });
        });
    };
    return JobsPlugin;
}());
exports.JobsPlugin = JobsPlugin;
/**
 * Helper function to access the jobs API from kernel
 */
function getJobsAPI(kernel) {
    try {
        return kernel.getService('jobs');
    }
    catch (_a) {
        return null;
    }
}
