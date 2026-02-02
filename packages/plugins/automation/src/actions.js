"use strict";
/**
 * Action Executor
 *
 * Executes automation actions
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionExecutor = void 0;
/**
 * Action executor for running automation actions
 */
var ActionExecutor = /** @class */ (function () {
    function ActionExecutor(options) {
        if (options === void 0) { options = {}; }
        this.logger = options.logger || console;
        this.emailConfig = options.emailConfig;
        this.enableEmail = options.enableEmail !== false;
        this.enableHttp = options.enableHttp !== false;
        this.enableScriptExecution = options.enableScriptExecution !== false;
        this.maxExecutionTime = options.maxExecutionTime || 30000; // 30 seconds default
    }
    /**
     * Set update field handler
     */
    ActionExecutor.prototype.setUpdateFieldHandler = function (handler) {
        this.updateFieldHandler = handler;
    };
    /**
     * Set create record handler
     */
    ActionExecutor.prototype.setCreateRecordHandler = function (handler) {
        this.createRecordHandler = handler;
    };
    /**
     * Set send email handler
     */
    ActionExecutor.prototype.setSendEmailHandler = function (handler) {
        this.sendEmailHandler = handler;
    };
    /**
     * Execute an action
     */
    ActionExecutor.prototype.executeAction = function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, _a, duration, error_1, errorMessage;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 14, , 15]);
                        result = void 0;
                        _a = action.type;
                        switch (_a) {
                            case 'update_field': return [3 /*break*/, 2];
                            case 'create_record': return [3 /*break*/, 4];
                            case 'send_email': return [3 /*break*/, 6];
                            case 'http_request': return [3 /*break*/, 8];
                            case 'execute_script': return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 12];
                    case 2: return [4 /*yield*/, this.executeUpdateField(action, context)];
                    case 3:
                        result = _b.sent();
                        return [3 /*break*/, 13];
                    case 4: return [4 /*yield*/, this.executeCreateRecord(action, context)];
                    case 5:
                        result = _b.sent();
                        return [3 /*break*/, 13];
                    case 6: return [4 /*yield*/, this.executeSendEmail(action, context)];
                    case 7:
                        result = _b.sent();
                        return [3 /*break*/, 13];
                    case 8: return [4 /*yield*/, this.executeHttpRequest(action, context)];
                    case 9:
                        result = _b.sent();
                        return [3 /*break*/, 13];
                    case 10: return [4 /*yield*/, this.executeScript(action, context)];
                    case 11:
                        result = _b.sent();
                        return [3 /*break*/, 13];
                    case 12: throw new Error("Unknown action type: ".concat(action.type));
                    case 13:
                        duration = Date.now() - startTime;
                        this.logger.debug("Action ".concat(action.type, " executed in ").concat(duration, "ms for rule ").concat(context.rule.id));
                        return [2 /*return*/, result];
                    case 14:
                        error_1 = _b.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        this.logger.error("Error executing action ".concat(action.type, ":"), errorMessage);
                        throw error_1;
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute update field action
     */
    ActionExecutor.prototype.executeUpdateField = function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var recordId, fields;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.updateFieldHandler) {
                            throw new Error('Update field handler not configured');
                        }
                        recordId = this.interpolateValue(action.recordId, context);
                        fields = this.interpolateFields(action.fields, context);
                        return [4 /*yield*/, this.updateFieldHandler(action.objectName, recordId, fields)];
                    case 1:
                        _a.sent();
                        context.logger.info("Updated ".concat(action.objectName, " record ").concat(recordId, " with fields: ").concat(Object.keys(fields).join(', ')));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute create record action
     */
    ActionExecutor.prototype.executeCreateRecord = function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var fields, record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.createRecordHandler) {
                            throw new Error('Create record handler not configured');
                        }
                        fields = this.interpolateFields(action.fields, context);
                        return [4 /*yield*/, this.createRecordHandler(action.objectName, fields)];
                    case 1:
                        record = _a.sent();
                        context.logger.info("Created ".concat(action.objectName, " record with ID: ").concat(record.id));
                        return [2 /*return*/, record];
                }
            });
        });
    };
    /**
     * Execute send email action
     */
    ActionExecutor.prototype.executeSendEmail = function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var recipients;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.enableEmail) {
                            throw new Error('Email actions are disabled');
                        }
                        if (!this.sendEmailHandler) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sendEmailHandler(action)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        // Default email sending (would require nodemailer or similar)
                        context.logger.warn('Email handler not configured, email not sent');
                        _a.label = 3;
                    case 3:
                        recipients = Array.isArray(action.to) ? action.to.join(', ') : action.to;
                        context.logger.info("Email sent to: ".concat(recipients, ", subject: ").concat(action.subject));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute HTTP request action
     */
    ActionExecutor.prototype.executeHttpRequest = function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var timeout, controller, timeoutId, response_1, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.enableHttp) {
                            throw new Error('HTTP actions are disabled');
                        }
                        timeout = action.timeout || this.maxExecutionTime;
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, timeout);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(action.url, {
                                method: action.method,
                                headers: action.headers,
                                body: action.body ? JSON.stringify(action.body) : undefined,
                                signal: controller.signal,
                            })];
                    case 2:
                        response_1 = _a.sent();
                        clearTimeout(timeoutId);
                        if (!response_1.ok) {
                            throw new Error("HTTP ".concat(response_1.status, ": ").concat(response_1.statusText));
                        }
                        return [4 /*yield*/, response_1.json().catch(function () { return response_1.text(); })];
                    case 3:
                        result = _a.sent();
                        context.logger.info("HTTP ".concat(action.method, " request to ").concat(action.url, " completed with status ").concat(response_1.status));
                        return [2 /*return*/, result];
                    case 4:
                        error_2 = _a.sent();
                        clearTimeout(timeoutId);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute script action
     */
    ActionExecutor.prototype.executeScript = function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var scriptContext, fn, result, error_3, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.enableScriptExecution) {
                            throw new Error('Script execution is disabled');
                        }
                        scriptContext = {
                            context: context.triggerData,
                            logger: context.logger,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        fn = new Function('ctx', action.script);
                        return [4 /*yield*/, Promise.resolve(fn(scriptContext))];
                    case 2:
                        result = _a.sent();
                        context.logger.info('Script executed successfully');
                        return [2 /*return*/, result];
                    case 3:
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : 'Script execution failed';
                        context.logger.error("Script execution error: ".concat(errorMessage));
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Interpolate template values
     */
    ActionExecutor.prototype.interpolateValue = function (value, context) {
        var _this = this;
        if (typeof value !== 'string') {
            return value;
        }
        // Replace {{field}} with values from trigger data
        return value.replace(/\{\{([^}]+)\}\}/g, function (match, field) {
            var trimmedField = field.trim();
            var fieldValue = _this.getNestedValue(context.triggerData, trimmedField);
            return fieldValue !== undefined ? String(fieldValue) : match;
        });
    };
    /**
     * Interpolate all fields in an object
     */
    ActionExecutor.prototype.interpolateFields = function (fields, context) {
        var e_1, _a;
        var result = {};
        try {
            for (var _b = __values(Object.entries(fields)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                if (typeof value === 'string') {
                    result[key] = this.interpolateValue(value, context);
                }
                else {
                    result[key] = value;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    };
    /**
     * Get nested value from object using dot notation
     */
    ActionExecutor.prototype.getNestedValue = function (obj, path) {
        return path.split('.').reduce(function (current, part) { return current === null || current === void 0 ? void 0 : current[part]; }, obj);
    };
    return ActionExecutor;
}());
exports.ActionExecutor = ActionExecutor;
