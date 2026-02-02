"use strict";
/**
 * Automation Storage Implementation
 *
 * In-memory storage for automation rules and formula fields
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
exports.InMemoryAutomationStorage = void 0;
/**
 * In-memory automation storage
 */
var InMemoryAutomationStorage = /** @class */ (function () {
    function InMemoryAutomationStorage() {
        this.rules = new Map();
        this.formulas = new Map();
    }
    /**
     * Save an automation rule
     */
    InMemoryAutomationStorage.prototype.saveRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.rules.set(rule.id, __assign({}, rule));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get an automation rule
     */
    InMemoryAutomationStorage.prototype.getRule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rule;
            return __generator(this, function (_a) {
                rule = this.rules.get(id);
                return [2 /*return*/, rule ? __assign({}, rule) : null];
            });
        });
    };
    /**
     * List automation rules
     */
    InMemoryAutomationStorage.prototype.listRules = function (filter) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                results = Array.from(this.rules.values());
                if (filter === null || filter === void 0 ? void 0 : filter.status) {
                    results = results.filter(function (r) { return r.status === filter.status; });
                }
                if (filter === null || filter === void 0 ? void 0 : filter.triggerType) {
                    results = results.filter(function (r) { return r.trigger.type === filter.triggerType; });
                }
                // Sort by priority (higher first)
                results.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
                return [2 /*return*/, results.map(function (r) { return (__assign({}, r)); })];
            });
        });
    };
    /**
     * Update an automation rule
     */
    InMemoryAutomationStorage.prototype.updateRule = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var rule;
            return __generator(this, function (_a) {
                rule = this.rules.get(id);
                if (!rule) {
                    throw new Error("Automation rule not found: ".concat(id));
                }
                Object.assign(rule, updates, { updatedAt: new Date() });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Delete an automation rule
     */
    InMemoryAutomationStorage.prototype.deleteRule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.rules.has(id)) {
                    throw new Error("Automation rule not found: ".concat(id));
                }
                this.rules.delete(id);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Save a formula field
     */
    InMemoryAutomationStorage.prototype.saveFormula = function (formula) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                key = "".concat(formula.objectName, ".").concat(formula.name);
                this.formulas.set(key, __assign({}, formula));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get a formula field
     */
    InMemoryAutomationStorage.prototype.getFormula = function (objectName, fieldName) {
        return __awaiter(this, void 0, void 0, function () {
            var key, formula;
            return __generator(this, function (_a) {
                key = "".concat(objectName, ".").concat(fieldName);
                formula = this.formulas.get(key);
                return [2 /*return*/, formula ? __assign({}, formula) : null];
            });
        });
    };
    /**
     * List formula fields
     */
    InMemoryAutomationStorage.prototype.listFormulas = function (objectName) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                results = Array.from(this.formulas.values());
                if (objectName) {
                    results = results.filter(function (f) { return f.objectName === objectName; });
                }
                return [2 /*return*/, results.map(function (f) { return (__assign({}, f)); })];
            });
        });
    };
    /**
     * Delete a formula field
     */
    InMemoryAutomationStorage.prototype.deleteFormula = function (objectName, fieldName) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                key = "".concat(objectName, ".").concat(fieldName);
                if (!this.formulas.has(key)) {
                    throw new Error("Formula field not found: ".concat(objectName, ".").concat(fieldName));
                }
                this.formulas.delete(key);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Clear all data (for testing)
     */
    InMemoryAutomationStorage.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.rules.clear();
                this.formulas.clear();
                return [2 /*return*/];
            });
        });
    };
    return InMemoryAutomationStorage;
}());
exports.InMemoryAutomationStorage = InMemoryAutomationStorage;
