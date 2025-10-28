import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger, logger } from '@/lib/logger';

interface DetailResponse {
  success: boolean;
  result?: {
    id: string;
    targetIp: string;
    targetHostname: string | null;
    createdAt: string;
    links: Array<{
      sequence: number;
      sourceIp: string;
      sourceHostname: string | null;
      sourceCountry: string | null;
      sourceRegion: string | null;
      sourceCity: string | null;
      sourceCoordinates: { lat: number; lng: number } | null;
      destinationIp: string;
      destinationHostname: string | null;
      destinationCountry: string | null;
      destinationRegion: string | null;
      destinationCity: string | null;
      destinationCoordinates: { lat: number; lng: number } | null;
      rtt: number | null;
    }>;
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DetailResponse>> {
  try {
    const reqLog = createRequestLogger();
    const { id } = await params;
    const stop = reqLog.startTimer();
    reqLog.info('GET /api/traceroute/[id]', { id });
    
    const result = await prisma.path.findUnique({
      where: { id },
      include: {
        links: {
          include: {
            source: true,
            destination: true,
          },
          orderBy: {
            sequence: 'asc'
          }
        }
      }
    });

    if (!result) {
      reqLog.warn('Path not found', { id });
      return NextResponse.json(
        { success: false, error: 'Path not found' },
        { status: 404 }
      );
    }

    reqLog.info('GET /api/traceroute/[id] completed', { links: result.links.length, durationMs: stop() });
    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        targetIp: result.targetIp,
        targetHostname: result.targetHostname,
        createdAt: result.createdAt.toISOString(),
        links: result.links.map((link) => ({
          sequence: link.sequence,
          sourceIp: link.source.ipAddress,
          sourceHostname: link.source.hostname,
          sourceCountry: link.source.country,
          sourceRegion: link.source.region,
          sourceCity: link.source.city,
          sourceCoordinates: link.source.latitude && link.source.longitude
            ? { lat: link.source.latitude, lng: link.source.longitude }
            : null,
          destinationIp: link.destination.ipAddress,
          destinationHostname: link.destination.hostname,
          destinationCountry: link.destination.country,
          destinationRegion: link.destination.region,
          destinationCity: link.destination.city,
          destinationCoordinates: link.destination.latitude && link.destination.longitude
            ? { lat: link.destination.latitude, lng: link.destination.longitude }
            : null,
          rtt: link.rtt,
        }))
      }
    });

  } catch (error) {
    logger.error('GET /api/traceroute/[id] error', { error: (error as Error)?.message });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
