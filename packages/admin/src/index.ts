import express, { Router } from 'express';
import * as path from 'path';

export function createObjectQLAdmin(): Router {
    const router = express.Router();
    // Assuming 'public' is copied to 'dist/public' during build
    // And this file is compiled to 'dist/index.js'
    const publicPath = path.join(__dirname, 'public');
    
    router.use(express.static(publicPath));
    
    return router;
}
