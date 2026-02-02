"use strict";
/**
 * @objectstack/runtime - ObjectKernel
 *
 * The core kernel that manages plugin lifecycle and provides essential services.
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
exports.ObjectKernel = void 0;
var plugin_context_1 = require("./plugin-context");
var logger_1 = require("./logger");
/**
 * ObjectKernel - The micro-kernel for ObjectStack
 *
 * Manages plugin lifecycle and provides core services:
 * - Plugin Lifecycle Manager
 * - Service Registry (DI Container)
 * - Event Bus (Hook System)
 * - Dependency Resolver
 */
var ObjectKernel = /** @class */ (function () {
    function ObjectKernel() {
        this.plugins = new Map();
        this.bootstrapped = false;
        this.logger = (0, logger_1.createLogger)('ObjectKernel');
        this.context = new plugin_context_1.PluginContextImpl(this.logger);
        // Set the kernel reference in the context
        this.context.setKernel(this);
    }
    /**
     * Register a plugin with the kernel.
     * Plugins should be registered before bootstrap.
     *
     * @param plugin - The plugin instance to register
     * @returns this (for chaining)
     */
    ObjectKernel.prototype.use = function (plugin) {
        if (this.bootstrapped) {
            this.logger.warn('Adding plugin after bootstrap. Plugin will need to be manually initialized.');
        }
        if (this.plugins.has(plugin.name)) {
            this.logger.warn("Plugin '".concat(plugin.name, "' is already registered. Skipping."));
            return this;
        }
        this.plugins.set(plugin.name, {
            plugin: plugin,
            initialized: false,
            started: false,
        });
        this.logger.info("Registered plugin: ".concat(plugin.name).concat(plugin.version ? " v".concat(plugin.version) : ''));
        return this;
    };
    /**
     * Bootstrap the kernel.
     * - Resolves plugin dependencies (topological sort)
     * - Calls init() on all plugins
     * - Calls start() on all plugins
     * - Triggers 'kernel:ready' event
     */
    ObjectKernel.prototype.bootstrap = function () {
        return __awaiter(this, void 0, void 0, function () {
            var initOrder, initOrder_1, initOrder_1_1, pluginName, e_1_1, initOrder_2, initOrder_2_1, pluginName, e_2_1;
            var e_1, _a, e_2, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.logger.info('Bootstrapping ObjectKernel...');
                        // Trigger kernel:init event
                        return [4 /*yield*/, this.context.trigger('kernel:init')];
                    case 1:
                        // Trigger kernel:init event
                        _c.sent();
                        initOrder = this.resolveDependencies();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 7, 8, 9]);
                        initOrder_1 = __values(initOrder), initOrder_1_1 = initOrder_1.next();
                        _c.label = 3;
                    case 3:
                        if (!!initOrder_1_1.done) return [3 /*break*/, 6];
                        pluginName = initOrder_1_1.value;
                        return [4 /*yield*/, this.initializePlugin(pluginName)];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        initOrder_1_1 = initOrder_1.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _c.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (initOrder_1_1 && !initOrder_1_1.done && (_a = initOrder_1.return)) _a.call(initOrder_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9:
                        _c.trys.push([9, 14, 15, 16]);
                        initOrder_2 = __values(initOrder), initOrder_2_1 = initOrder_2.next();
                        _c.label = 10;
                    case 10:
                        if (!!initOrder_2_1.done) return [3 /*break*/, 13];
                        pluginName = initOrder_2_1.value;
                        return [4 /*yield*/, this.startPlugin(pluginName)];
                    case 11:
                        _c.sent();
                        _c.label = 12;
                    case 12:
                        initOrder_2_1 = initOrder_2.next();
                        return [3 /*break*/, 10];
                    case 13: return [3 /*break*/, 16];
                    case 14:
                        e_2_1 = _c.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 16];
                    case 15:
                        try {
                            if (initOrder_2_1 && !initOrder_2_1.done && (_b = initOrder_2.return)) _b.call(initOrder_2);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 16:
                        this.bootstrapped = true;
                        // Trigger kernel:ready event
                        return [4 /*yield*/, this.context.trigger('kernel:ready')];
                    case 17:
                        // Trigger kernel:ready event
                        _c.sent();
                        this.logger.info("ObjectKernel ready (".concat(this.plugins.size, " plugins loaded)"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Shutdown the kernel.
     * Calls destroy() on all plugins in reverse order.
     */
    ObjectKernel.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pluginNames, pluginNames_1, pluginNames_1_1, pluginName, entry, error_1, e_3_1;
            var e_3, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger.info('Shutting down ObjectKernel...');
                        // Trigger kernel:shutdown event
                        return [4 /*yield*/, this.context.trigger('kernel:shutdown')];
                    case 1:
                        // Trigger kernel:shutdown event
                        _b.sent();
                        pluginNames = Array.from(this.plugins.keys()).reverse();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 9, 10, 11]);
                        pluginNames_1 = __values(pluginNames), pluginNames_1_1 = pluginNames_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!pluginNames_1_1.done) return [3 /*break*/, 8];
                        pluginName = pluginNames_1_1.value;
                        entry = this.plugins.get(pluginName);
                        if (!entry.plugin.destroy) return [3 /*break*/, 7];
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        this.logger.debug("Destroying plugin: ".concat(pluginName));
                        return [4 /*yield*/, entry.plugin.destroy()];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        this.logger.error("Error destroying plugin '".concat(pluginName, "':"), error_1);
                        return [3 /*break*/, 7];
                    case 7:
                        pluginNames_1_1 = pluginNames_1.next();
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_3_1 = _b.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (pluginNames_1_1 && !pluginNames_1_1.done && (_a = pluginNames_1.return)) _a.call(pluginNames_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 11:
                        this.bootstrapped = false;
                        this.logger.info('ObjectKernel shutdown complete');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a service from the service registry.
     */
    ObjectKernel.prototype.getService = function (name) {
        return this.context.getService(name);
    };
    /**
     * Check if a service is registered.
     */
    ObjectKernel.prototype.hasService = function (name) {
        return this.context.hasService(name);
    };
    Object.defineProperty(ObjectKernel.prototype, "pluginContext", {
        /**
         * Get the plugin context (for advanced use cases).
         */
        get: function () {
            return this.context;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Initialize a single plugin.
     */
    ObjectKernel.prototype.initializePlugin = function (pluginName) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, deps, deps_1, deps_1_1, dep, depEntry, error_2;
            var e_4, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        entry = this.plugins.get(pluginName);
                        if (!entry) {
                            throw new Error("Plugin '".concat(pluginName, "' not found"));
                        }
                        if (entry.initialized) {
                            return [2 /*return*/];
                        }
                        deps = entry.plugin.dependencies || [];
                        try {
                            for (deps_1 = __values(deps), deps_1_1 = deps_1.next(); !deps_1_1.done; deps_1_1 = deps_1.next()) {
                                dep = deps_1_1.value;
                                depEntry = this.plugins.get(dep);
                                if (!depEntry) {
                                    throw new Error("Plugin '".concat(pluginName, "' depends on '").concat(dep, "', but it is not registered"));
                                }
                                if (!depEntry.initialized) {
                                    throw new Error("Plugin '".concat(pluginName, "' depends on '").concat(dep, "', but it is not initialized yet"));
                                }
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (deps_1_1 && !deps_1_1.done && (_a = deps_1.return)) _a.call(deps_1);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        this.logger.debug("Initializing plugin: ".concat(pluginName));
                        if (!entry.plugin.init) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, entry.plugin.init(this.context)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _b.sent();
                        this.logger.error("Error initializing plugin '".concat(pluginName, "':"), error_2);
                        throw error_2;
                    case 4:
                        entry.initialized = true;
                        this.logger.debug("Initialized plugin: ".concat(pluginName));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start a single plugin.
     */
    ObjectKernel.prototype.startPlugin = function (pluginName) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entry = this.plugins.get(pluginName);
                        if (!entry) {
                            throw new Error("Plugin '".concat(pluginName, "' not found"));
                        }
                        if (entry.started) {
                            return [2 /*return*/];
                        }
                        if (!entry.initialized) {
                            throw new Error("Cannot start plugin '".concat(pluginName, "' - not initialized"));
                        }
                        this.logger.debug("Starting plugin: ".concat(pluginName));
                        if (!entry.plugin.start) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, entry.plugin.start(this.context)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.error("Error starting plugin '".concat(pluginName, "':"), error_3);
                        throw error_3;
                    case 4:
                        entry.started = true;
                        this.logger.debug("Started plugin: ".concat(pluginName));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Resolve plugin dependencies using topological sort.
     * Returns plugin names in initialization order.
     */
    ObjectKernel.prototype.resolveDependencies = function () {
        var e_5, _a;
        var _this = this;
        var visited = new Set();
        var visiting = new Set();
        var order = [];
        var visit = function (pluginName) {
            var e_6, _a;
            if (visited.has(pluginName)) {
                return;
            }
            if (visiting.has(pluginName)) {
                throw new Error("Circular dependency detected: ".concat(pluginName));
            }
            visiting.add(pluginName);
            var entry = _this.plugins.get(pluginName);
            if (!entry) {
                throw new Error("Plugin '".concat(pluginName, "' not found"));
            }
            var deps = entry.plugin.dependencies || [];
            try {
                for (var deps_2 = __values(deps), deps_2_1 = deps_2.next(); !deps_2_1.done; deps_2_1 = deps_2.next()) {
                    var dep = deps_2_1.value;
                    if (!_this.plugins.has(dep)) {
                        throw new Error("Plugin '".concat(pluginName, "' depends on '").concat(dep, "', but it is not registered"));
                    }
                    visit(dep);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (deps_2_1 && !deps_2_1.done && (_a = deps_2.return)) _a.call(deps_2);
                }
                finally { if (e_6) throw e_6.error; }
            }
            visiting.delete(pluginName);
            visited.add(pluginName);
            order.push(pluginName);
        };
        try {
            for (var _b = __values(this.plugins.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var pluginName = _c.value;
                visit(pluginName);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return order;
    };
    return ObjectKernel;
}());
exports.ObjectKernel = ObjectKernel;
