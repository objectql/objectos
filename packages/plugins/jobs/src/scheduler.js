"use strict";
/**
 * Job Scheduler
 *
 * Cron-based job scheduling implementation
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
exports.JobScheduler = void 0;
var cron_parser_1 = require("cron-parser");
var JobScheduler = /** @class */ (function () {
    function JobScheduler(options) {
        this.scheduledJobs = new Map();
        this.running = false;
        this.checkInterval = null;
        this.storage = options.storage;
        this.queue = options.queue;
        this.logger = options.logger || console;
    }
    /**
     * Schedule a recurring job with cron expression
     */
    JobScheduler.prototype.scheduleJob = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var nextRun, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.cronExpression) {
                            throw new Error('Cron expression is required for scheduled jobs');
                        }
                        // Validate cron expression
                        try {
                            (0, cron_parser_1.parseExpression)(config.cronExpression);
                        }
                        catch (error) {
                            throw new Error("Invalid cron expression: ".concat(config.cronExpression));
                        }
                        nextRun = this.getNextRunTime(config.cronExpression);
                        job = {
                            id: config.id,
                            name: config.name,
                            data: config.data || {},
                            status: 'scheduled',
                            priority: config.priority || 'normal',
                            attempts: 0,
                            maxRetries: config.maxRetries || 3,
                            retryDelay: config.retryDelay || 1000,
                            timeout: config.timeout || 60000,
                            cronExpression: config.cronExpression,
                            nextRun: nextRun,
                            createdAt: new Date(),
                        };
                        return [4 /*yield*/, this.storage.save(job)];
                    case 1:
                        _a.sent();
                        this.logger.info("[Scheduler] Scheduled job: ".concat(job.id, " (").concat(job.name, ") - Next run: ").concat(nextRun.toISOString()));
                        // Start scheduler if not running
                        if (!this.running) {
                            this.start();
                        }
                        return [2 /*return*/, job];
                }
            });
        });
    };
    /**
     * Unschedule a job
     */
    JobScheduler.prototype.unscheduleJob = function (jobId) {
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
                        if (job.status !== 'scheduled') {
                            throw new Error("Job ".concat(jobId, " is not scheduled"));
                        }
                        return [4 /*yield*/, this.storage.update(jobId, { status: 'cancelled' })];
                    case 2:
                        _a.sent();
                        this.logger.info("[Scheduler] Unscheduled job: ".concat(jobId));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start the scheduler
     */
    JobScheduler.prototype.start = function () {
        var _this = this;
        if (this.running) {
            return;
        }
        this.running = true;
        this.logger.info('[Scheduler] Started');
        // Check for due jobs every second
        this.checkInterval = setInterval(function () {
            _this.checkScheduledJobs().catch(function (error) {
                _this.logger.error('[Scheduler] Check error:', error);
            });
        }, 1000);
    };
    /**
     * Stop the scheduler
     */
    JobScheduler.prototype.stop = function () {
        var e_1, _a;
        if (!this.running) {
            return;
        }
        this.running = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        try {
            // Clear all scheduled timers
            for (var _b = __values(this.scheduledJobs.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var timeout = _c.value;
                clearTimeout(timeout);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.scheduledJobs.clear();
        this.logger.info('[Scheduler] Stopped');
    };
    /**
     * Check for scheduled jobs that are due
     */
    JobScheduler.prototype.checkScheduledJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dueJobs, dueJobs_1, dueJobs_1_1, job, e_2_1, error_1;
            var e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, this.storage.getScheduledDue()];
                    case 1:
                        dueJobs = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 9]);
                        dueJobs_1 = __values(dueJobs), dueJobs_1_1 = dueJobs_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!dueJobs_1_1.done) return [3 /*break*/, 6];
                        job = dueJobs_1_1.value;
                        return [4 /*yield*/, this.executeScheduledJob(job)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        dueJobs_1_1 = dueJobs_1.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (dueJobs_1_1 && !dueJobs_1_1.done && (_a = dueJobs_1.return)) _a.call(dueJobs_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_1 = _b.sent();
                        this.logger.error('[Scheduler] Error checking scheduled jobs:', error_1);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a scheduled job
     */
    JobScheduler.prototype.executeScheduledJob = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var executionJobId, nextRun, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("[Scheduler] Executing scheduled job: ".concat(job.id, " (").concat(job.name, ")"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        executionJobId = "".concat(job.id, "_").concat(Date.now());
                        return [4 /*yield*/, this.queue.enqueue({
                                id: executionJobId,
                                name: job.name,
                                data: job.data,
                                priority: job.priority,
                                maxRetries: job.maxRetries,
                                retryDelay: job.retryDelay,
                                timeout: job.timeout,
                            })];
                    case 2:
                        _a.sent();
                        if (!job.cronExpression) return [3 /*break*/, 4];
                        nextRun = this.getNextRunTime(job.cronExpression);
                        return [4 /*yield*/, this.storage.update(job.id, { nextRun: nextRun })];
                    case 3:
                        _a.sent();
                        this.logger.info("[Scheduler] Next run for ".concat(job.id, ": ").concat(nextRun.toISOString()));
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        this.logger.error("[Scheduler] Error executing scheduled job ".concat(job.id, ":"), error_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate next run time from cron expression
     */
    JobScheduler.prototype.getNextRunTime = function (cronExpression) {
        var interval = (0, cron_parser_1.parseExpression)(cronExpression);
        return interval.next().toDate();
    };
    /**
     * Get all scheduled jobs
     */
    JobScheduler.prototype.getScheduledJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.query({ status: 'scheduled' })];
            });
        });
    };
    /**
     * Update job schedule
     */
    JobScheduler.prototype.updateSchedule = function (jobId, cronExpression) {
        return __awaiter(this, void 0, void 0, function () {
            var job, nextRun;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.get(jobId)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            throw new Error("Job ".concat(jobId, " not found"));
                        }
                        if (job.status !== 'scheduled') {
                            throw new Error("Job ".concat(jobId, " is not scheduled"));
                        }
                        // Validate cron expression
                        try {
                            (0, cron_parser_1.parseExpression)(cronExpression);
                        }
                        catch (error) {
                            throw new Error("Invalid cron expression: ".concat(cronExpression));
                        }
                        nextRun = this.getNextRunTime(cronExpression);
                        return [4 /*yield*/, this.storage.update(jobId, {
                                cronExpression: cronExpression,
                                nextRun: nextRun,
                            })];
                    case 2:
                        _a.sent();
                        this.logger.info("[Scheduler] Updated schedule for ".concat(jobId, " - Next run: ").concat(nextRun.toISOString()));
                        return [2 /*return*/];
                }
            });
        });
    };
    return JobScheduler;
}());
exports.JobScheduler = JobScheduler;
