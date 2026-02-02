"use strict";
/**
 * Formula Engine
 *
 * Handles formula field calculations
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
exports.FormulaEngine = void 0;
/**
 * Formula engine for calculating field values
 */
var FormulaEngine = /** @class */ (function () {
    function FormulaEngine(logger) {
        this.autoNumberCounters = new Map();
        this.logger = logger || console;
    }
    /**
     * Set query records handler
     */
    FormulaEngine.prototype.setQueryRecordsHandler = function (handler) {
        this.queryRecordsHandler = handler;
    };
    /**
     * Calculate a formula field value
     */
    FormulaEngine.prototype.calculateFormula = function (formula, record, allRecords) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (formula.config.type) {
                    case 'calculated':
                        return [2 /*return*/, this.calculateCalculatedField(formula.config, record)];
                    case 'rollup':
                        return [2 /*return*/, this.calculateRollupField(formula.config, record, allRecords)];
                    case 'autonumber':
                        return [2 /*return*/, this.calculateAutoNumberField(formula.config, formula)];
                    default:
                        throw new Error("Unknown formula type: ".concat(formula.config.type));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Calculate a calculated field
     */
    FormulaEngine.prototype.calculateCalculatedField = function (config, record) {
        try {
            // Create a safe evaluation context
            var context = __assign({}, record);
            // Parse and evaluate the expression
            // Note: This is a simplified implementation. In production, you'd want:
            // - Proper expression parser (e.g., mathjs, expr-eval)
            // - Type checking
            // - Security sandboxing
            var result = this.evaluateExpression(config.expression, context);
            // Cast to the expected return type
            return this.castValue(result, config.returnType);
        }
        catch (error) {
            this.logger.error("Error calculating formula: ".concat(config.expression), error);
            return null;
        }
    };
    /**
     * Calculate a rollup field
     */
    FormulaEngine.prototype.calculateRollupField = function (config, record, allRecords) {
        return __awaiter(this, void 0, void 0, function () {
            var relatedRecords, relationshipValue_1, filter, error_1;
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        relatedRecords = void 0;
                        if (!allRecords) return [3 /*break*/, 1];
                        relationshipValue_1 = record[config.relationshipField];
                        relatedRecords = allRecords.filter(function (r) { return r[config.relationshipField] === relationshipValue_1; });
                        return [3 /*break*/, 4];
                    case 1:
                        if (!this.queryRecordsHandler) return [3 /*break*/, 3];
                        filter = (_a = {},
                            _a[config.relationshipField] = record.id,
                            _a);
                        return [4 /*yield*/, this.queryRecordsHandler(config.relatedObject, filter)];
                    case 2:
                        relatedRecords = _b.sent();
                        return [3 /*break*/, 4];
                    case 3: throw new Error('No data source available for rollup calculation');
                    case 4:
                        // Apply additional conditions
                        if (config.conditions && config.conditions.length > 0) {
                            relatedRecords = relatedRecords.filter(function (r) {
                                return _this.evaluateConditions(config.conditions, r);
                            });
                        }
                        // Perform the rollup operation
                        return [2 /*return*/, this.performRollupOperation(config.operation, relatedRecords, config.aggregateField)];
                    case 5:
                        error_1 = _b.sent();
                        this.logger.error('Error calculating rollup field:', error_1);
                        return [2 /*return*/, null];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate an auto-number field
     */
    FormulaEngine.prototype.calculateAutoNumberField = function (config, formula) {
        var key = "".concat(formula.objectName, ".").concat(formula.name);
        var currentNumber = this.autoNumberCounters.get(key) || config.startingNumber || 1;
        // Increment the counter
        this.autoNumberCounters.set(key, currentNumber + 1);
        // Format the number
        var digits = config.digits || 4;
        var numberStr = currentNumber.toString().padStart(digits, '0');
        // Build the final value
        var result = '';
        if (config.prefix) {
            result += config.prefix;
        }
        result += numberStr;
        if (config.suffix) {
            result += config.suffix;
        }
        return result;
    };
    /**
     * Evaluate a simple expression
     * This is a basic implementation - in production use a proper expression parser
     */
    FormulaEngine.prototype.evaluateExpression = function (expression, context) {
        // Replace field references with values
        var processedExpr = expression;
        // Replace {fieldName} with actual values
        processedExpr = processedExpr.replace(/\{([^}]+)\}/g, function (match, field) {
            var value = context[field.trim()];
            if (value === undefined) {
                return '0';
            }
            return typeof value === 'string' ? "\"".concat(value, "\"") : String(value);
        });
        // Evaluate basic mathematical expressions
        // Note: In production, use a proper expression evaluator like mathjs
        try {
            // Simple arithmetic evaluation (UNSAFE - for demo only)
            // eslint-disable-next-line no-new-func
            var fn = new Function('return ' + processedExpr);
            return fn();
        }
        catch (error) {
            this.logger.error("Failed to evaluate expression: ".concat(expression), error);
            return null;
        }
    };
    /**
     * Cast value to expected type
     */
    FormulaEngine.prototype.castValue = function (value, type) {
        switch (type) {
            case 'string':
                return String(value);
            case 'number':
                return Number(value);
            case 'boolean':
                return Boolean(value);
            case 'date':
                return value instanceof Date ? value : new Date(value);
            default:
                return value;
        }
    };
    /**
     * Perform rollup operation
     */
    FormulaEngine.prototype.performRollupOperation = function (operation, records, field) {
        if (records.length === 0) {
            return operation === 'COUNT' ? 0 : null;
        }
        var values = records.map(function (r) { return r[field]; }).filter(function (v) { return v !== null && v !== undefined; });
        switch (operation) {
            case 'COUNT':
                return values.length;
            case 'SUM':
                return values.reduce(function (sum, val) { return sum + Number(val); }, 0);
            case 'AVG':
                if (values.length === 0)
                    return null;
                return values.reduce(function (sum, val) { return sum + Number(val); }, 0) / values.length;
            case 'MIN':
                if (values.length === 0)
                    return null;
                return Math.min.apply(Math, __spreadArray([], __read(values.map(function (v) { return Number(v); })), false));
            case 'MAX':
                if (values.length === 0)
                    return null;
                return Math.max.apply(Math, __spreadArray([], __read(values.map(function (v) { return Number(v); })), false));
            default:
                throw new Error("Unknown rollup operation: ".concat(operation));
        }
    };
    /**
     * Evaluate conditions for filtering
     */
    FormulaEngine.prototype.evaluateConditions = function (conditions, record) {
        var e_1, _a;
        try {
            for (var conditions_1 = __values(conditions), conditions_1_1 = conditions_1.next(); !conditions_1_1.done; conditions_1_1 = conditions_1.next()) {
                var condition = conditions_1_1.value;
                if (!this.evaluateCondition(condition, record)) {
                    return false;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (conditions_1_1 && !conditions_1_1.done && (_a = conditions_1.return)) _a.call(conditions_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    };
    /**
     * Evaluate a single condition
     */
    FormulaEngine.prototype.evaluateCondition = function (condition, record) {
        var fieldValue = record[condition.field];
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'not_equals':
                return fieldValue !== condition.value;
            case 'greater_than':
                return fieldValue > condition.value;
            case 'less_than':
                return fieldValue < condition.value;
            case 'contains':
                return String(fieldValue).includes(String(condition.value));
            case 'starts_with':
                return String(fieldValue).startsWith(String(condition.value));
            case 'ends_with':
                return String(fieldValue).endsWith(String(condition.value));
            default:
                return false;
        }
    };
    /**
     * Reset auto-number counter (for testing)
     */
    FormulaEngine.prototype.resetAutoNumberCounter = function (objectName, fieldName) {
        var key = "".concat(objectName, ".").concat(fieldName);
        this.autoNumberCounters.delete(key);
    };
    /**
     * Get current auto-number counter value
     */
    FormulaEngine.prototype.getAutoNumberCounter = function (objectName, fieldName) {
        var key = "".concat(objectName, ".").concat(fieldName);
        return this.autoNumberCounters.get(key) || 0;
    };
    return FormulaEngine;
}());
exports.FormulaEngine = FormulaEngine;
