"use strict";
/**
 * Job Queue
 *
 * Core job queue implementation with retry logic and monitoring
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueue = void 0;
var storage_1 = require("./storage");
var JobQueue = /** @class */ (function () {
    function JobQueue(options) {
        if (options === void 0) { options = {}; }
        this.handlers = new Map();
        this.processing = false;
        this.activeJobs = 0;
        this.storage = options.storage || new storage_1.InMemoryJobStorage();
        this.maxConcurrency = options.concurrency || 5;
        this.defaultMaxRetries = options.defaultMaxRetries || 3;
        this.defaultRetryDelay = options.defaultRetryDelay || 1000;
        this.defaultTimeout = options.defaultTimeout || 60000;
        this.logger = options.logger || console;
    }
    /**
     * Register a job handler
     */
    JobQueue.prototype.registerHandler = function (definition) {
        if (this.handlers.has(definition.name)) {
            throw new Error("Job handler \"".concat(definition.name, "\" is already registered"));
        }
        this.handlers.set(definition.name, definition.handler);
        this.logger.info("[JobQueue] Registered handler: ".concat(definition.name));
    };
    /**
     * Unregister a job handler
     */
    JobQueue.prototype.unregisterHandler = function (name) {
        this.handlers.delete(name);
        this.logger.info("[JobQueue] Unregistered handler: ".concat(name));
    };
    /**
     * Add a job to the queue
     */
    JobQueue.prototype.enqueue = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var handler, job;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        handler = this.handlers.get(config.name);
                        if (!handler) {
                            throw new Error("No handler registered for job: ".concat(config.name));
                        }
                        job = {
                            id: config.id,
                            name: config.name,
                            data: config.data || {},
                            status: 'pending',
                            priority: config.priority || 'normal',
                            attempts: 0,
                            maxRetries: (_a = config.maxRetries) !== null && _a !== void 0 ? _a : this.defaultMaxRetries,
                            retryDelay: (_b = config.retryDelay) !== null && _b !== void 0 ? _b : this.defaultRetryDelay,
                            timeout: (_c = config.timeout) !== null && _c !== void 0 ? _c : this.defaultTimeout,
                            cronExpression: config.cronExpression,
                            createdAt: new Date(),
                        };
                        return [4 /*yield*/, this.storage.save(job)];
                    case 1:
                        _d.sent();
                        this.logger.info("[JobQueue] Enqueued job: ".concat(job.id, " (").concat(job.name, ")"));
                        // Start processing if not already running
                        if (!this.processing) {
                            this.startProcessing();
                        }
                        return [2 /*return*/, job];
                }
            });
        });
    };
    /**
     * Start processing jobs
     */
    JobQueue.prototype.startProcessing = function () {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.processing)
                            return [2 /*return*/];
                        this.processing = true;
                        this.logger.info('[JobQueue] Started processing');
                        _a.label = 1;
                    case 1:
                        if (!this.processing) return [3 /*break*/, 11];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 10]);
                        if (!(this.activeJobs >= this.maxConcurrency)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.sleep(100)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, this.storage.getNextPending()];
                    case 5:
                        job = _a.sent();
                        if (!!job) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.sleep(100)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 7:
                        // Process job asynchronously
                        this.activeJobs++;
                        this.processJob(job).finally(function () {
                            _this.activeJobs--;
                        });
                        return [3 /*break*/, 10];
                    case 8:
                        error_1 = _a.sent();
                        this.logger.error('[JobQueue] Processing error:', error_1);
                        return [4 /*yield*/, this.sleep(1000)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 1];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop processing jobs
     */
    JobQueue.prototype.stopProcessing = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.processing = false;
                        this.logger.info('[JobQueue] Stopped processing');
                        _a.label = 1;
                    case 1:
                        if (!(this.activeJobs > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.sleep(100)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a single job
     */
    JobQueue.prototype.processJob = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var handler, context, result, error_2, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handler = this.handlers.get(job.name);
                        if (!!handler) return [3 /*break*/, 2];
                        this.logger.error("[JobQueue] No handler for job: ".concat(job.name));
                        return [4 /*yield*/, this.failJob(job, 'No handler registered')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        job.attempts++;
                        return [4 /*yield*/, this.storage.update(job.id, {
                                status: 'running',
                                attempts: job.attempts,
                                startedAt: new Date(),
                            })];
                    case 3:
                        _a.sent();
                        this.logger.info("[JobQueue] Processing job: ".concat(job.id, " (attempt ").concat(job.attempts, "/").concat(job.maxRetries + 1, ")"));
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 7, , 12]);
                        context = {
                            jobId: job.id,
                            name: job.name,
                            data: job.data,
                            attempt: job.attempts,
                            logger: this.logger,
                        };
                        return [4 /*yield*/, this.executeWithTimeout(handler(context), job.timeout)];
                    case 5:
                        result = _a.sent();
                        // Mark job as completed
                        return [4 /*yield*/, this.storage.update(job.id, {
                                status: 'completed',
                                completedAt: new Date(),
                                result: result,
                            })];
                    case 6:
                        // Mark job as completed
                        _a.sent();
                        this.logger.info("[JobQueue] Completed job: ".concat(job.id));
                        return [3 /*break*/, 12];
                    case 7:
                        error_2 = _a.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                        this.logger.error("[JobQueue] Job failed: ".concat(job.id, " - ").concat(errorMessage));
                        if (!(job.attempts <= job.maxRetries)) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.retryJob(job, errorMessage)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, this.failJob(job, errorMessage)];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11: return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retry a failed job
     */
    JobQueue.prototype.retryJob = function (job, error) {
        return __awaiter(this, void 0, void 0, function () {
            var retryDelay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        retryDelay = job.retryDelay * Math.pow(2, job.attempts - 1);
                        this.logger.info("[JobQueue] Retrying job ".concat(job.id, " in ").concat(retryDelay, "ms"));
                        // Schedule retry
                        return [4 /*yield*/, this.sleep(retryDelay)];
                    case 1:
                        // Schedule retry
                        _a.sent();
                        return [4 /*yield*/, this.storage.update(job.id, {
                                status: 'pending',
                                error: error,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Mark a job as failed
     */
    JobQueue.prototype.failJob = function (job, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.update(job.id, {
                            status: 'failed',
                            failedAt: new Date(),
                            error: error,
                        })];
                    case 1:
                        _a.sent();
                        this.logger.error("[JobQueue] Job failed permanently: ".concat(job.id, " - ").concat(error));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a promise with timeout
     */
    JobQueue.prototype.executeWithTimeout = function (promise, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.race([
                        promise,
                        new Promise(function (_, reject) {
                            return setTimeout(function () { return reject(new Error('Job timeout')); }, timeout);
                        }),
                    ])];
            });
        });
    };
    /**
     * Cancel a job
     */
    JobQueue.prototype.cancel = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.get(jobId)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            throw new Error("Job ".concat(jobId, " not found"));
                        }
                        if (job.status === 'running') {
                            throw new Error('Cannot cancel a running job');
                        }
                        return [4 /*yield*/, this.storage.update(jobId, {
                                status: 'cancelled',
                            })];
                    case 2:
                        _a.sent();
                        this.logger.info("[JobQueue] Cancelled job: ".concat(jobId));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get job by ID
     */
    JobQueue.prototype.getJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.get(jobId)];
            });
        });
    };
    /**
     * Query jobs
     */
    JobQueue.prototype.queryJobs = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.query(options)];
            });
        });
    };
    /**
     * Get queue statistics
     */
    JobQueue.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.getStats()];
            });
        });
    };
    /**
     * Sleep utility
     */
    JobQueue.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    return JobQueue;
}());
exports.JobQueue = JobQueue;
