"use strict";
/**
 * Better-Auth Client Configuration
 *
 * This module provides the Better-Auth instance configuration
 * with support for multiple database backends (PostgreSQL, MongoDB, SQLite)
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
exports.default = exports.resetAuthInstance = exports.getBetterAuth = void 0;
var authInstance;
var dbConnection; // Store database connection for cleanup
var getBetterAuth = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], __read(args_1), false), void 0, function (config) {
        var betterAuth, organization, role, database_1, dbUrl, isPostgres_1, isMongo_1, Pool, MongoClient, client, sqlite3Import, Database, filename, e_1;
        if (config === void 0) { config = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (authInstance)
                        return [2 /*return*/, authInstance];
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("better-auth")); })];
                case 1:
                    betterAuth = (_a.sent()).betterAuth;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("better-auth/plugins")); })];
                case 2:
                    organization = (_a.sent()).organization;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("better-auth/plugins/access")); })];
                case 3:
                    role = (_a.sent()).role;
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 12, , 13]);
                    dbUrl = config.databaseUrl || process.env.OBJECTQL_DATABASE_URL;
                    isPostgres_1 = dbUrl && dbUrl.startsWith('postgres');
                    isMongo_1 = dbUrl && dbUrl.startsWith('mongodb');
                    if (!isPostgres_1) return [3 /*break*/, 6];
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("pg")); })];
                case 5:
                    Pool = (_a.sent()).Pool;
                    dbConnection = new Pool({
                        connectionString: dbUrl
                    });
                    database_1 = dbConnection;
                    return [3 /*break*/, 11];
                case 6:
                    if (!isMongo_1) return [3 /*break*/, 9];
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("mongodb")); })];
                case 7:
                    MongoClient = (_a.sent()).MongoClient;
                    client = new MongoClient(dbUrl);
                    return [4 /*yield*/, client.connect()];
                case 8:
                    _a.sent();
                    dbConnection = client;
                    database_1 = client.db();
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("better-sqlite3")); })];
                case 10:
                    sqlite3Import = _a.sent();
                    Database = (sqlite3Import.default || sqlite3Import);
                    filename = (dbUrl === null || dbUrl === void 0 ? void 0 : dbUrl.replace('sqlite:', '')) || 'objectos.db';
                    console.log("[Better-Auth Plugin] Initializing with SQLite database: ".concat(filename));
                    dbConnection = new Database(filename);
                    database_1 = dbConnection;
                    _a.label = 11;
                case 11:
                    // Configure Better-Auth with organization and role plugins
                    authInstance = betterAuth({
                        database: database_1,
                        baseURL: config.baseURL || process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
                        trustedOrigins: config.trustedOrigins || [
                            "http://localhost:5173",
                            "http://localhost:3000",
                            "http://[::1]:3000",
                            "http://[::1]:5173"
                        ],
                        emailAndPassword: {
                            enabled: true
                        },
                        user: {
                            additionalFields: {
                                role: {
                                    type: "string",
                                    required: false,
                                    defaultValue: 'user',
                                    input: false
                                }
                            }
                        },
                        databaseHooks: {
                            user: {
                                create: {
                                    before: function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                        var count, result, collection, stmt, result, role_1, e_2;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 6, , 7]);
                                                    count = 0;
                                                    if (!isPostgres_1) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, database_1.query('SELECT count(*) FROM "user"')];
                                                case 1:
                                                    result = _a.sent();
                                                    count = parseInt(result.rows[0].count);
                                                    return [3 /*break*/, 5];
                                                case 2:
                                                    if (!isMongo_1) return [3 /*break*/, 4];
                                                    collection = database_1.collection('user');
                                                    return [4 /*yield*/, collection.countDocuments()];
                                                case 3:
                                                    count = _a.sent();
                                                    return [3 /*break*/, 5];
                                                case 4:
                                                    try {
                                                        stmt = database_1.prepare('SELECT count(*) as count FROM user');
                                                        result = stmt.get();
                                                        count = result.count;
                                                    }
                                                    catch (_b) {
                                                        count = 0;
                                                    }
                                                    _a.label = 5;
                                                case 5:
                                                    role_1 = count === 0 ? 'super_admin' : 'user';
                                                    console.log("[Better-Auth Plugin] Creating user with role: ".concat(role_1, " (current count: ").concat(count, ")"));
                                                    return [2 /*return*/, {
                                                            data: __assign(__assign({}, user), { role: role_1 })
                                                        }];
                                                case 6:
                                                    e_2 = _a.sent();
                                                    console.error("[Better-Auth Plugin] Error in user create hook:", e_2);
                                                    // Ensure a default role is set even in error cases
                                                    return [2 /*return*/, {
                                                            data: __assign(__assign({}, user), { role: 'user' })
                                                        }];
                                                case 7: return [2 /*return*/];
                                            }
                                        });
                                    }); }
                                }
                            }
                        },
                        plugins: [
                            organization({
                                dynamicAccessControl: {
                                    enabled: true
                                },
                                teams: {
                                    enabled: true
                                },
                                creatorRole: 'owner',
                                roles: {
                                    owner: role({
                                        organization: ['update', 'delete', 'read'],
                                        member: ['create', 'update', 'delete', 'read'],
                                        invitation: ['create', 'cancel', 'read'],
                                        team: ['create', 'update', 'delete', 'read']
                                    }),
                                    admin: role({
                                        organization: ['update', 'read'],
                                        member: ['create', 'update', 'delete', 'read'],
                                        invitation: ['create', 'cancel', 'read'],
                                        team: ['create', 'update', 'delete', 'read']
                                    }),
                                    user: role({
                                        organization: ['read'],
                                        member: ['read'],
                                        team: ['read']
                                    })
                                }
                            })
                        ]
                    });
                    console.log('[Better-Auth Plugin] Initialized successfully');
                    return [2 /*return*/, authInstance];
                case 12:
                    e_1 = _a.sent();
                    console.error("[Better-Auth Plugin] Initialization Error:", e_1);
                    throw e_1;
                case 13: return [2 /*return*/];
            }
        });
    });
};
exports.getBetterAuth = getBetterAuth;
exports.default = exports.getBetterAuth;
var resetAuthInstance = function () { return __awaiter(void 0, void 0, void 0, function () {
    var e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!dbConnection) return [3 /*break*/, 8];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                if (!dbConnection.end) return [3 /*break*/, 3];
                // PostgreSQL Pool
                return [4 /*yield*/, dbConnection.end()];
            case 2:
                // PostgreSQL Pool
                _a.sent();
                return [3 /*break*/, 6];
            case 3:
                if (!dbConnection.close) return [3 /*break*/, 6];
                if (!(dbConnection.close.constructor.name === 'AsyncFunction')) return [3 /*break*/, 5];
                return [4 /*yield*/, dbConnection.close()];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                dbConnection.close();
                _a.label = 6;
            case 6:
                console.log('[Better-Auth Plugin] Database connection closed');
                return [3 /*break*/, 8];
            case 7:
                e_3 = _a.sent();
                console.error('[Better-Auth Plugin] Error closing database connection:', e_3);
                return [3 /*break*/, 8];
            case 8:
                authInstance = undefined;
                dbConnection = undefined;
                return [2 /*return*/];
        }
    });
}); };
exports.resetAuthInstance = resetAuthInstance;
