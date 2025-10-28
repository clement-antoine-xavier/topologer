import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger, logger } from '@/lib/logger';

export async function GET() {
  try {
    const reqLog = createRequestLogger();
    const stop = reqLog.startTimer();
    reqLog.debug('GET /api/map start');
    // Get all routers with location data
    const routers = await prisma.router.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
      },
      select: {
        id: true,
        ipAddress: true,
        hostname: true,
        country: true,
        region: true,
        city: true,
        latitude: true,
        longitude: true,
        _count: {
          select: {
            linksFrom: true,
            linksTo: true,
          },
        },
      },
    });

  // Get all links between routers with location data
    const links = await prisma.link.findMany({
      where: {
        AND: [
          { source: { latitude: { not: null } } },
          { source: { longitude: { not: null } } },
          { destination: { latitude: { not: null } } },
          { destination: { longitude: { not: null } } },
        ],
      },
      select: {
        id: true,
        sequence: true,
        rtt: true,
        source: {
          select: {
            id: true,
            ipAddress: true,
            latitude: true,
            longitude: true,
          },
        },
        destination: {
          select: {
            id: true,
            ipAddress: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    reqLog.info('GET /api/map completed', { routers: routers.length, links: links.length, durationMs: stop() });
    return NextResponse.json({
      success: true,
      routers: routers.map((r) => ({
        id: r.id,
        ipAddress: r.ipAddress,
        hostname: r.hostname,
        country: r.country,
        region: r.region,
        city: r.city,
        latitude: r.latitude,
        longitude: r.longitude,
        totalLinks: r._count.linksFrom + r._count.linksTo,
      })),
      links: links.map((l) => ({
        id: l.id,
        sequence: l.sequence,
        rtt: l.rtt,
        source: {
          id: l.source.id,
          ipAddress: l.source.ipAddress,
          latitude: l.source.latitude,
          longitude: l.source.longitude,
        },
        destination: {
          id: l.destination.id,
          ipAddress: l.destination.ipAddress,
          latitude: l.destination.latitude,
          longitude: l.destination.longitude,
        },
      })),
    });
  } catch (error) {
    logger.error('GET /api/map error', { error: (error as Error)?.message });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}
