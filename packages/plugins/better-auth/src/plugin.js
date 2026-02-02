"use strict";
/**
 * Better-Auth Plugin for ObjectOS
 *
 * This plugin provides authentication capabilities using Better-Auth library.
 * It conforms to the @objectstack/runtime protocol for plugin lifecycle and context.
 *
 * Features:
 * - Email/Password authentication
 * - Organization and team management
 * - Role-based access control (RBAC)
 * - Multi-database support (PostgreSQL, MongoDB, SQLite)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getBetterAuth = exports.BetterAuthPlugin = void 0;
exports.getBetterAuthAPI = getBetterAuthAPI;
var auth_client_1 = require("./auth-client");
/**
 * Better-Auth Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
var BetterAuthPlugin = /** @class */ (function () {
    function BetterAuthPlugin(config) {
        if (config === void 0) { config = {}; }
        this.name = 'com.objectos.auth.better-auth';
        this.version = '0.1.0';
        this.dependencies = [];
        this.config = config;
    }
    /**
     * Initialize plugin - Initialize Better-Auth and register routes
     */
    BetterAuthPlugin.prototype.init = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, toNodeHandler, handler_1, error_1, errorMessage;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.context = context;
                        context.logger.info('[Better-Auth Plugin] Initializing...');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // Initialize Better-Auth
                        _a = this;
                        return [4 /*yield*/, (0, auth_client_1.getBetterAuth)(this.config)];
                    case 2:
                        // Initialize Better-Auth
                        _a.authInstance = _b.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('better-auth/node')); })];
                    case 3:
                        toNodeHandler = (_b.sent()).toNodeHandler;
                        handler_1 = toNodeHandler(this.authInstance);
                        // Register the plugin as a service
                        context.registerService('better-auth', this);
                        // Register route handler through a hook or service
                        // The kernel should provide a way to register routes
                        // For now, we'll use a hook to expose the handler
                        context.hook('http.route.register', function (routeData) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if ((routeData === null || routeData === void 0 ? void 0 : routeData.path) === '/api/auth/*') {
                                    return [2 /*return*/, handler_1];
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        // Emit plugin initialized event
                        return [4 /*yield*/, context.trigger('plugin.initialized', {
                                pluginId: this.name,
                                timestamp: new Date().toISOString()
                            })];
                    case 4:
                        // Emit plugin initialized event
                        _b.sent();
                        context.logger.info('[Better-Auth Plugin] Initialized successfully');
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _b.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        context.logger.error("[Better-Auth Plugin] Failed to initialize: ".concat(errorMessage), error_1);
                        throw new Error("Better-Auth Plugin initialization failed: ".concat(errorMessage));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start plugin - Can be minimal for auth plugin
     */
    BetterAuthPlugin.prototype.start = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context.logger.info('[Better-Auth Plugin] Starting...');
                        // Emit authentication ready event
                        return [4 /*yield*/, context.trigger('auth.ready', {
                                pluginId: this.name,
                                timestamp: new Date().toISOString()
                            })];
                    case 1:
                        // Emit authentication ready event
                        _a.sent();
                        context.logger.info('[Better-Auth Plugin] Started successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Better-Auth instance
     */
    BetterAuthPlugin.prototype.getAuthInstance = function () {
        return this.authInstance;
    };
    /**
     * Get the Better-Auth handler for route registration
     */
    BetterAuthPlugin.prototype.getHandler = function () {
        return __awaiter(this, void 0, void 0, function () {
            var toNodeHandler;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.authInstance) {
                            throw new Error('Better-Auth not initialized');
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('better-auth/node')); })];
                    case 1:
                        toNodeHandler = (_a.sent()).toNodeHandler;
                        return [2 /*return*/, toNodeHandler(this.authInstance)];
                }
            });
        });
    };
    /**
     * Cleanup and shutdown - Close database connections and reset auth instance
     */
    BetterAuthPlugin.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        (_a = this.context) === null || _a === void 0 ? void 0 : _a.logger.info('[Better-Auth Plugin] Destroying...');
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 5, , 6]);
                        // Close database connections and reset auth instance
                        return [4 /*yield*/, (0, auth_client_1.resetAuthInstance)()];
                    case 2:
                        // Close database connections and reset auth instance
                        _d.sent();
                        this.authInstance = undefined;
                        if (!this.context) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.context.trigger('plugin.destroyed', {
                                pluginId: this.name,
                                timestamp: new Date().toISOString()
                            })];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        (_b = this.context) === null || _b === void 0 ? void 0 : _b.logger.info('[Better-Auth Plugin] Destroyed successfully');
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _d.sent();
                        (_c = this.context) === null || _c === void 0 ? void 0 : _c.logger.error('[Better-Auth Plugin] Error during destroy:', error_2);
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return BetterAuthPlugin;
}());
exports.BetterAuthPlugin = BetterAuthPlugin;
/**
 * Helper function to access the Better-Auth API from kernel
 */
function getBetterAuthAPI(kernel) {
    try {
        return kernel.getService('better-auth');
    }
    catch (_a) {
        return null;
    }
}
/**
 * Export helper function to get auth instance
 * This can be used by other plugins or modules
 */
var auth_client_2 = require("./auth-client");
Object.defineProperty(exports, "getBetterAuth", { enumerable: true, get: function () { return auth_client_2.getBetterAuth; } });
