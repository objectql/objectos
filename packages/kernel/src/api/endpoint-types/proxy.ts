/**
 * Proxy Endpoint
 * 
 * Proxies requests to external APIs
 */

import { EndpointHandler } from '../endpoint-registry';
import { createSuccessResponse, createErrorResponse } from '../response';

/**
 * Proxy endpoint configuration
 */
export interface ProxyEndpointConfig {
    /** Target URL */
    targetUrl: string;
    /** Forward headers */
    forwardHeaders?: string[];
    /** Additional headers to add */
    headers?: Record<string, string>;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Transform response */
    transformResponse?: (data: any) => any;
}

/**
 * HTTP client interface
 */
export interface HttpClient {
    request(url: string, options: any): Promise<any>;
}

/**
 * Proxy endpoint handler
 */
export class ProxyEndpoint implements EndpointHandler {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async execute(req: any, res: any, config: ProxyEndpointConfig): Promise<void> {
        try {
            // Build target URL with query parameters
            const targetUrl = this.buildTargetUrl(config.targetUrl, req);

            // Prepare headers
            const headers = this.prepareHeaders(req, config);

            // Prepare request options
            const options = {
                method: req.method,
                headers,
                body: req.body ? JSON.stringify(req.body) : undefined,
                timeout: config.timeout || 30000,
            };

            // Make request to target
            const response = await this.httpClient.request(targetUrl, options);

            // Transform response if configured
            let data = response.data || response;
            if (config.transformResponse) {
                data = config.transformResponse(data);
            }

            // Send response
            const apiResponse = createSuccessResponse(data);
            this.sendResponse(res, response.status || 200, apiResponse);
        } catch (error) {
            const response = createErrorResponse(
                'PROXY_ERROR',
                error instanceof Error ? error.message : 'Proxy request failed'
            );
            this.sendResponse(res, 500, response);
        }
    }

    private buildTargetUrl(baseUrl: string, req: any): string {
        let url = baseUrl;

        // Replace path parameters
        if (req.params) {
            for (const [key, value] of Object.entries(req.params)) {
                url = url.replace(`:${key}`, String(value));
            }
        }

        // Add query parameters
        if (req.query && Object.keys(req.query).length > 0) {
            const queryString = new URLSearchParams(req.query).toString();
            url += (url.includes('?') ? '&' : '?') + queryString;
        }

        return url;
    }

    private prepareHeaders(req: any, config: ProxyEndpointConfig): Record<string, string> {
        const headers: Record<string, string> = {};

        // Forward selected headers from request
        if (config.forwardHeaders && req.headers) {
            for (const headerName of config.forwardHeaders) {
                const value = req.headers[headerName.toLowerCase()];
                if (value) {
                    headers[headerName] = value;
                }
            }
        }

        // Add configured headers
        if (config.headers) {
            Object.assign(headers, config.headers);
        }

        // Set content type for JSON
        if (req.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    private sendResponse(res: any, status: number, body: any): void {
        if (res.status && res.json) {
            res.status(status).json(body);
        }
    }
}

/**
 * Create proxy endpoint handler
 */
export function createProxyEndpoint(httpClient: HttpClient): ProxyEndpoint {
    return new ProxyEndpoint(httpClient);
}
