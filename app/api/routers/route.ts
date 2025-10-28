import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger, logger } from '@/lib/logger';

interface RoutersResponse {
  success: boolean;
  routers?: Array<{
    id: string;
    ipAddress: string;
    hostname: string | null;
    asn: number | null;
    country: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    pathCount: number;
  }>;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<RoutersResponse>> {
  try {
    const reqLog = createRequestLogger();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const stop = reqLog.startTimer();
    reqLog.info('GET /api/routers', { limit, country, city });

    // Build query
    const where: any = {};
    if (country) where.country = country;
    if (city) where.city = { contains: city };

    const routers = await prisma.router.findMany({
      where,
      include: {
        _count: {
          select: { 
            linksFrom: true,
            linksTo: true 
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const formattedRouters = routers.map((router) => ({
      id: router.id,
      ipAddress: router.ipAddress,
      hostname: router.hostname,
      asn: router.asn,
      country: router.country,
      region: router.region,
      city: router.city,
      latitude: router.latitude,
      longitude: router.longitude,
      timezone: router.timezone,
      pathCount: router._count.linksFrom + router._count.linksTo
    }));

    reqLog.info('GET /api/routers completed', { count: formattedRouters.length, durationMs: stop() });
    return NextResponse.json({
      success: true,
      routers: formattedRouters
    });

  } catch (error) {
    logger.error('GET /api/routers error', { error: (error as Error)?.message });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
