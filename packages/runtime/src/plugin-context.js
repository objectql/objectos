"use strict";
/**
 * @objectstack/runtime - Plugin Context Implementation
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginContextImpl = void 0;
var PluginContextImpl = /** @class */ (function () {
    function PluginContextImpl(logger, initialServices, initialHooks) {
        this.services = new Map();
        this.hooks = new Map();
        this.logger = logger;
        if (initialServices) {
            this.services = new Map(initialServices);
        }
        if (initialHooks) {
            this.hooks = new Map(initialHooks);
        }
    }
    PluginContextImpl.prototype.registerService = function (name, service) {
        if (this.services.has(name)) {
            this.logger.warn("Service '".concat(name, "' is already registered. Overwriting."));
        }
        this.services.set(name, service);
        this.logger.debug("Registered service: ".concat(name));
    };
    PluginContextImpl.prototype.getService = function (name) {
        var service = this.services.get(name);
        if (!service) {
            throw new Error("Service '".concat(name, "' not found"));
        }
        return service;
    };
    PluginContextImpl.prototype.hasService = function (name) {
        return this.services.has(name);
    };
    PluginContextImpl.prototype.hook = function (name, handler) {
        if (!this.hooks.has(name)) {
            this.hooks.set(name, []);
        }
        this.hooks.get(name).push(handler);
        this.logger.debug("Registered hook: ".concat(name));
    };
    PluginContextImpl.prototype.trigger = function (name) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var handlers, errors, handlers_1, handlers_1_1, handler, error_1, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        handlers = this.hooks.get(name);
                        if (!handlers || handlers.length === 0) {
                            return [2 /*return*/];
                        }
                        this.logger.debug("Triggering hook: ".concat(name, " (").concat(handlers.length, " handlers)"));
                        errors = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, 9, 10]);
                        handlers_1 = __values(handlers), handlers_1_1 = handlers_1.next();
                        _b.label = 2;
                    case 2:
                        if (!!handlers_1_1.done) return [3 /*break*/, 7];
                        handler = handlers_1_1.value;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, handler.apply(void 0, __spreadArray([], __read(args), false))];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _b.sent();
                        this.logger.error("Error in hook '".concat(name, "':"), error_1);
                        // Collect error but continue with other handlers
                        // This allows the system to be resilient to individual plugin failures
                        errors.push(error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                        return [3 /*break*/, 6];
                    case 6:
                        handlers_1_1 = handlers_1.next();
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (handlers_1_1 && !handlers_1_1.done && (_a = handlers_1.return)) _a.call(handlers_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all registered services (for internal use)
     */
    PluginContextImpl.prototype.getServices = function () {
        return this.services;
    };
    /**
     * Get all registered hooks (for internal use)
     */
    PluginContextImpl.prototype.getHooks = function () {
        return this.hooks;
    };
    /**
     * Get the kernel instance (for advanced use cases)
     */
    PluginContextImpl.prototype.getKernel = function () {
        return this.kernel;
    };
    /**
     * Set the kernel instance (for internal use)
     */
    PluginContextImpl.prototype.setKernel = function (kernel) {
        this.kernel = kernel;
    };
    return PluginContextImpl;
}());
exports.PluginContextImpl = PluginContextImpl;
