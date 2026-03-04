/**
 * @file src/app/api/health/route.ts
 * @description Health check endpoint for monitoring and deployment verification.
 * GET /api/health - Returns server status and timestamp (no auth required).
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
