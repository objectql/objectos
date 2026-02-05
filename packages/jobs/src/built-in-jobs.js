"use strict";
/**
 * Built-in Jobs
 *
 * Pre-configured job implementations for common tasks
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
exports.builtInJobs = exports.createBackupJob = exports.createReportJob = exports.createDataCleanupJob = void 0;
/**
 * Data Cleanup Job
 * Deletes old records based on retention policies
 */
var createDataCleanupJob = function (config) {
    var handler = function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var results, cutoffDate, _a, _b, objectName, deletedCount, errorMessage;
        var e_1, _c;
        return __generator(this, function (_d) {
            context.logger.info("[DataCleanup] Starting cleanup for ".concat(config.objects.join(', ')));
            results = {};
            cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
            try {
                for (_a = __values(config.objects), _b = _a.next(); !_b.done; _b = _a.next()) {
                    objectName = _b.value;
                    try {
                        // This is a placeholder - actual implementation would use ObjectQL
                        context.logger.info("[DataCleanup] Processing ".concat(objectName, ", cutoff: ").concat(cutoffDate.toISOString()));
                        deletedCount = 0;
                        results[objectName] = deletedCount;
                        context.logger.info("[DataCleanup] Deleted ".concat(deletedCount, " records from ").concat(objectName));
                    }
                    catch (error) {
                        errorMessage = error instanceof Error ? error.message : String(error);
                        context.logger.error("[DataCleanup] Error cleaning ".concat(objectName, ": ").concat(errorMessage));
                        throw error;
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
            context.logger.info("[DataCleanup] Completed. Total results: ".concat(JSON.stringify(results)));
            return [2 /*return*/, results];
        });
    }); };
    return {
        name: 'data-cleanup',
        handler: handler,
        defaultConfig: {
            maxRetries: 2,
            timeout: 300000, // 5 minutes
        },
    };
};
exports.createDataCleanupJob = createDataCleanupJob;
/**
 * Report Generation Job
 * Generates reports in various formats
 */
var createReportJob = function (config) {
    var handler = function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var reportData, destination, errorMessage;
        return __generator(this, function (_a) {
            context.logger.info("[ReportGen] Generating ".concat(config.reportType, " report"));
            try {
                reportData = {
                    reportType: config.reportType,
                    parameters: config.parameters,
                    format: config.format || 'json',
                    generatedAt: new Date().toISOString(),
                    // Would include actual report data
                };
                destination = config.destination || "/tmp/reports/".concat(config.reportType, "_").concat(Date.now(), ".").concat(config.format || 'json');
                context.logger.info("[ReportGen] Report generated: ".concat(destination));
                return [2 /*return*/, {
                        destination: destination,
                        reportData: reportData,
                        status: 'success',
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
                context.logger.error("[ReportGen] Error generating report: ".concat(errorMessage));
                throw error;
            }
            return [2 /*return*/];
        });
    }); };
    return {
        name: 'report-generation',
        handler: handler,
        defaultConfig: {
            maxRetries: 1,
            timeout: 600000, // 10 minutes
        },
    };
};
exports.createReportJob = createReportJob;
/**
 * Backup Job
 * Creates backups of database objects
 */
var createBackupJob = function (config) {
    var handler = function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var backupInfo, backupFile, errorMessage;
        return __generator(this, function (_a) {
            context.logger.info("[Backup] Starting backup to ".concat(config.destination));
            try {
                backupInfo = {
                    destination: config.destination,
                    objects: config.objects || ['all'],
                    compress: config.compress || false,
                    includeMetadata: config.includeMetadata !== false,
                    timestamp: new Date().toISOString(),
                };
                // Placeholder for actual backup logic
                context.logger.info("[Backup] Backing up objects: ".concat(backupInfo.objects.join(', ')));
                backupFile = "".concat(config.destination, "/backup_").concat(Date.now(), ".").concat(config.compress ? 'tar.gz' : 'json');
                context.logger.info("[Backup] Backup completed: ".concat(backupFile));
                return [2 /*return*/, {
                        backupFile: backupFile,
                        backupInfo: backupInfo,
                        status: 'success',
                        size: '0 KB', // Would be actual size
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
                context.logger.error("[Backup] Error during backup: ".concat(errorMessage));
                throw error;
            }
            return [2 /*return*/];
        });
    }); };
    return {
        name: 'backup',
        handler: handler,
        defaultConfig: {
            maxRetries: 2,
            timeout: 1800000, // 30 minutes
        },
    };
};
exports.createBackupJob = createBackupJob;
/**
 * Built-in job registry
 */
exports.builtInJobs = {
    'data-cleanup': exports.createDataCleanupJob,
    'report-generation': exports.createReportJob,
    'backup': exports.createBackupJob,
};
