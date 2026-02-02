"use strict";
/**
 * @objectstack/runtime - Simple Console Logger
 */
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
exports.ConsoleLogger = void 0;
exports.createLogger = createLogger;
var ConsoleLogger = /** @class */ (function () {
    function ConsoleLogger(prefix) {
        if (prefix === void 0) { prefix = ''; }
        this.prefix = prefix;
    }
    ConsoleLogger.prototype.debug = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        console.debug.apply(console, __spreadArray(["[DEBUG]".concat(this.prefix ? " [".concat(this.prefix, "]") : '', " ").concat(message)], __read(args), false));
    };
    ConsoleLogger.prototype.info = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        console.info.apply(console, __spreadArray(["[INFO]".concat(this.prefix ? " [".concat(this.prefix, "]") : '', " ").concat(message)], __read(args), false));
    };
    ConsoleLogger.prototype.warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        console.warn.apply(console, __spreadArray(["[WARN]".concat(this.prefix ? " [".concat(this.prefix, "]") : '', " ").concat(message)], __read(args), false));
    };
    ConsoleLogger.prototype.error = function (message, error) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        console.error.apply(console, __spreadArray(["[ERROR]".concat(this.prefix ? " [".concat(this.prefix, "]") : '', " ").concat(message), error], __read(args), false));
    };
    return ConsoleLogger;
}());
exports.ConsoleLogger = ConsoleLogger;
function createLogger(prefix) {
    return new ConsoleLogger(prefix);
}
