import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Helper for generating environment variables used by the worker
const MOCK_ENV = {
    VT_API_KEY: 'mock_virustotal_key',
    RATE_LIMIT: {
        get: vi.fn(),
        put: vi.fn()
    },
    // We mock the ENVIRONMENT to 'production' to enforce CORS rules (rejecting dev/localhost)
    ENVIRONMENT: 'production' 
};

// Global context mock
const MOCK_CTX = {
    waitUntil: vi.fn()
};

describe('Worker API Integration Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Since we are not testing the actual VirusTotal integration here, 
        // we could mock global.fetch but the test cases below short-circuit before fetch.
    });

    it('should return 405 Method Not Allowed for GET requests', async () => {
        const request = new Request('https://scantxungoqr-api.michelmacias-it.workers.dev/api/scan', {
            method: 'GET'
        });

        const response = await worker.fetch(request, MOCK_ENV, MOCK_CTX);
        expect(response.status).toBe(405);
        
        const data = await response.text();
        expect(data).toBe('Method Not Allowed');
    });

    it('should return 403 Forbidden for unauthorized CORS origins', async () => {
        const request = new Request('https://scantxungoqr-api.michelmacias-it.workers.dev/api/scan', {
            method: 'POST',
            headers: {
                'Origin': 'https://evil-hacker.domain.com'
            }
        });

        const response = await worker.fetch(request, MOCK_ENV, MOCK_CTX);
        expect(response.status).toBe(403);
        
        const data = await response.json();
        expect(data).toHaveProperty('error', 'Forbidden');
    });

    it('should return 413 Payload Too Large for body > 2KB', async () => {
        // Construct a huge payload
        const hugeString = 'a'.repeat(3000);
        
        const request = new Request('https://scantxungoqr-api.michelmacias-it.workers.dev/api/scan', {
            method: 'POST',
            headers: {
                'Origin': 'https://scantxungoqr.com',
                'Content-Type': 'application/json',
                'Content-Length': '3000'
            },
            body: JSON.stringify({ url: hugeString })
        });

        const response = await worker.fetch(request, MOCK_ENV, MOCK_CTX);
        expect(response.status).toBe(413);

        const data = await response.json();
        expect(data).toHaveProperty('error', 'Payload Too Large');
    });

    it('should return 400 Bad Request if URL is missing in the body', async () => {
        const request = new Request('https://scantxungoqr-api.michelmacias-it.workers.dev/api/scan', {
            method: 'POST',
            headers: {
                'Origin': 'https://scantxungoqr.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ not_a_url: 'something' })
        });

        const response = await worker.fetch(request, MOCK_ENV, MOCK_CTX);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data).toHaveProperty('error', 'URL is required');
    });

    it('should return 415 Unsupported Media Type if Content-Type is not application/json', async () => {
        const request = new Request('https://scantxungoqr-api.michelmacias-it.workers.dev/api/scan', {
            method: 'POST',
            headers: {
                'Origin': 'https://scantxungoqr.com',
                'Content-Type': 'text/plain'
            },
            body: 'url=https://example.com'
        });

        const response = await worker.fetch(request, MOCK_ENV, MOCK_CTX);
        expect(response.status).toBe(415);
        
        const data = await response.json();
        expect(data).toHaveProperty('error', 'Unsupported Media Type');
    });
});
