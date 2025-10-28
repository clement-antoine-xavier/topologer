import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger, logger } from '@/lib/logger';

interface HistoryResponse {
  success: boolean;
  results?: Array<{
    id: string;
    targetIp: string;
    targetHostname: string | null;
    createdAt: string;
    linkCount: number;
  }>;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    const reqLog = createRequestLogger();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const target = searchParams.get('target');
    const stop = reqLog.startTimer();
    reqLog.info('GET /api/traceroute/history', { limit, target });

    // Build query
    const where = target 
      ? {
          OR: [
            { targetIp: { contains: target } },
            { targetHostname: { contains: target } },
          ]
        }
      : {};

    const results = await prisma.path.findMany({
      where,
      include: {
        _count: {
          select: { links: true }
        },
        measurementSystem: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const formattedResults = results.map((result) => ({
      id: result.id,
      targetIp: result.targetIp,
      targetHostname: result.targetHostname,
      createdAt: result.createdAt.toISOString(),
      linkCount: result._count.links
    }));

    reqLog.info('GET /api/traceroute/history completed', { count: formattedResults.length, durationMs: stop() });
    return NextResponse.json({
      success: true,
      results: formattedResults
    });

  } catch (error) {
    logger.error('GET /api/traceroute/history error', { error: (error as Error)?.message });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
