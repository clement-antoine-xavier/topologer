import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';
import { getGeoLocation, formatLocation, isPrivateIP } from '@/lib/geoip';
import { createRequestLogger, logger, redact } from '@/lib/logger';

const execAsync = promisify(exec);

// IPv4 address validation regex
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// IPv6 address validation regex
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

// Domain name validation regex
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

function isValidTarget(target: string): boolean {
  return IPV4_REGEX.test(target) || IPV6_REGEX.test(target) || DOMAIN_REGEX.test(target);
}

function getTargetType(target: string): string {
  if (IPV4_REGEX.test(target)) return 'ipv4';
  if (IPV6_REGEX.test(target)) return 'ipv6';
  if (DOMAIN_REGEX.test(target)) return 'domain';
  return 'unknown';
}

interface TracerouteHop {
  hop: number;
  ip: string | null;
  hostname: string | null;
  rtt: string[];
}

interface TracerouteResponse {
  success: boolean;
  target: string;
  hops?: TracerouteHop[];
  error?: string;
}

function parseTraceroute(output: string): TracerouteHop[] {
  const lines = output.split('\n').filter(line => line.trim());
  const hops: TracerouteHop[] = [];

  // Skip the first line (header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse hop number
    const hopMatch = line.match(/^\s*(\d+)/);
    if (!hopMatch) continue;

    const hopNumber = parseInt(hopMatch[1]);

    // Check for timeout (asterisks)
    if (line.includes('* * *') || line.match(/\*\s+\*\s+\*/)) {
      hops.push({
        hop: hopNumber,
        ip: null,
        hostname: null,
        rtt: []
      });
      continue;
    }

    // Parse hostname/IP and RTT values
    const parts = line.split(/\s+/).filter(p => p);
    
    // Find hostname and IP
    let hostname: string | null = null;
    let ip: string | null = null;
    
    // Look for IP in parentheses
    const ipMatch = line.match(/\(([0-9.]+)\)/);
    if (ipMatch) {
      ip = ipMatch[1];
      // Hostname is before the parentheses
      const hostnameMatch = line.match(/^\s*\d+\s+([^\s(]+)/);
      if (hostnameMatch && hostnameMatch[1] !== ip) {
        hostname = hostnameMatch[1];
      }
    } else {
      // No parentheses, might be just IP or hostname
      if (parts[1]) {
        // Check if it's an IP address
        if (/^[0-9.]+$/.test(parts[1])) {
          ip = parts[1];
        } else {
          hostname = parts[1];
        }
      }
    }

    // Extract RTT values (numbers that appear before 'ms')
    const rttValues: string[] = [];
    // Match patterns like "12.345 ms" or just numbers before "ms"
    const rttMatches = line.matchAll(/(\d+\.?\d*)\s*ms/g);
    for (const match of rttMatches) {
      rttValues.push(match[1]);
    }

    hops.push({
      hop: hopNumber,
      ip: ip,
      hostname: hostname,
      rtt: rttValues
    });
  }

  return hops;
}

async function saveTracerouteToDatabase(
  target: string,
  targetHostname: string | null,
  hops: TracerouteHop[]
) {
  logger.debug('Saving traceroute to database', {
    target,
    targetHostname,
    hopsCount: hops.length,
  });
  // Get or create measurement system (representing the server running this code)
  const measurementSystem = await prisma.measurementSystem.upsert({
    where: { ipAddress: 'localhost' },
    update: {},
    create: {
      name: 'Topologer Server',
      ipAddress: 'localhost',
      description: 'Default measurement system',
    },
  });

  // Create or get routers for each link (skip private IPs)
  const routerMap = new Map<string, string>(); // ip -> routerId
  
  let skippedPrivate = 0;
  for (const hop of hops) {
    if (hop.ip && !isPrivateIP(hop.ip)) {
      // Get geolocation data for the IP
      const geoData = getGeoLocation(hop.ip);
      
      const router = await prisma.router.upsert({
        where: { ipAddress: hop.ip },
        update: {
          hostname: hop.hostname || undefined,
          country: geoData?.country || undefined,
          region: geoData?.region || undefined,
          city: geoData?.city || undefined,
          latitude: geoData?.latitude || undefined,
          longitude: geoData?.longitude || undefined,
          timezone: geoData?.timezone || undefined,
        },
        create: {
          ipAddress: hop.ip,
          hostname: hop.hostname,
          country: geoData?.country,
          region: geoData?.region,
          city: geoData?.city,
          latitude: geoData?.latitude,
          longitude: geoData?.longitude,
          timezone: geoData?.timezone,
        },
      });
      routerMap.set(hop.ip, router.id);
    }
    if (hop.ip && isPrivateIP(hop.ip)) skippedPrivate++;
  }

  // Create path with links
  const path = await prisma.path.create({
    data: {
      msId: measurementSystem.id,
      targetIp: target,
      targetHostname: targetHostname,
      links: {
        create: hops
          .filter((hop) => hop.ip && !isPrivateIP(hop.ip)) // Only create links for public IPs
          .map((hop, index, publicHops) => {
            const sourceId = routerMap.get(hop.ip!);
            // Destination is the next public hop, or the target for the last link
            const nextHop = publicHops[index + 1];
            const destinationId = nextHop?.ip
              ? routerMap.get(nextHop.ip)
              : sourceId; // If no next link, use same router

            if (!sourceId || !destinationId) {
              return null;
            }

            return {
              sequence: hop.hop,
              sourceId,
              destinationId,
              rtt: hop.rtt[0] ? parseFloat(hop.rtt[0]) : null,
            };
          })
          .filter((hop): hop is NonNullable<typeof hop> => hop !== null),
      },
    },
    include: {
      links: {
        include: {
          source: true,
          destination: true,
        },
      },
    },
  });

  logger.info('Saved traceroute path', {
    target,
    routersCreated: routerMap.size,
    linksCreated: path.links.length,
    skippedPrivate,
  });
  return path;
}

export async function GET(request: NextRequest): Promise<NextResponse<TracerouteResponse>> {
  const reqLog = createRequestLogger();
  const searchParams = request.nextUrl.searchParams;
  const target = searchParams.get('target');
  const stop = reqLog.startTimer();

  // Validate target parameter
  if (!target) {
    reqLog.warn('GET /api/traceroute missing target');
    return NextResponse.json(
      { success: false, target: '', error: 'Target address or domain is required' },
      { status: 400 }
    );
  }

  // Validate target format (IPv4, IPv6, or domain)
  if (!isValidTarget(target)) {
    reqLog.warn('GET /api/traceroute invalid target', { target });
    return NextResponse.json(
      { success: false, target, error: 'Invalid target format. Please provide a valid IPv4, IPv6 address, or domain name' },
      { status: 400 }
    );
  }

  try {
    // Sanitize target to prevent command injection
    const sanitizedTarget = target.replace(/[;&|`$()]/g, '');
    reqLog.info('Starting traceroute', { target: sanitizedTarget, type: getTargetType(sanitizedTarget) });
    
    // Determine the OS and use appropriate traceroute command
    const platform = process.platform;
    let command: string;

    if (platform === 'darwin' || platform === 'linux') {
      // macOS and Linux use traceroute
      // -w: wait time per hop in seconds
      // For IPv6, use traceroute6 if target is IPv6
      const isIPv6 = IPV6_REGEX.test(sanitizedTarget);
      const cmd = isIPv6 ? 'traceroute6' : 'traceroute';
      command = `${cmd} -w 3 ${sanitizedTarget}`;
    } else if (platform === 'win32') {
      // Windows uses tracert (supports both IPv4 and IPv6)
      command = `tracert -w 3000 ${sanitizedTarget}`;
    } else {
      reqLog.error('Unsupported OS for traceroute', { platform });
      return NextResponse.json(
        { success: false, target, error: 'Unsupported operating system' },
        { status: 500 }
      );
    }
    reqLog.debug('Executing command', { command });

    // Execute traceroute command with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    if (stderr && !stdout) {
      const errorMessage = `Traceroute error: ${stderr}`;
      reqLog.error('Traceroute failed with stderr only', { stderr: redact(stderr, 200) });
      return NextResponse.json(
        { success: false, target, error: errorMessage },
        { status: 500 }
      );
    }

    reqLog.debug('Traceroute output received', { stdoutSize: stdout?.length ?? 0, stderrSize: stderr?.length ?? 0 });
    const hops = parseTraceroute(stdout);
    reqLog.info('Parsed traceroute output', { hopsCount: hops.length });

    // Save to database using new schema
    try {
      await saveTracerouteToDatabase(
        sanitizedTarget,
        hops.find(h => h.hostname)?.hostname || null,
        hops
      );
    } catch (dbError) {
      reqLog.error('Database save error', { error: (dbError as Error)?.message });
      // Continue even if database save fails
    }

    reqLog.info('Traceroute completed', { durationMs: stop() });
    return NextResponse.json({
      success: true,
      target,
      hops
    });

  } catch (error) {
    logger.error('Traceroute execution error', { error: (error as Error)?.message });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { success: false, target, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<TracerouteResponse>> {
  const reqLog = createRequestLogger();
  try {
    const body = await request.json();
    const { target } = body;
    const stop = reqLog.startTimer();

    // Validate target parameter
    if (!target) {
      reqLog.warn('POST /api/traceroute missing target');
      return NextResponse.json(
        { success: false, target: '', error: 'Target address or domain is required' },
        { status: 400 }
      );
    }

    // Validate target format (IPv4, IPv6, or domain)
    if (!isValidTarget(target)) {
      reqLog.warn('POST /api/traceroute invalid target', { target });
      return NextResponse.json(
        { success: false, target, error: 'Invalid target format. Please provide a valid IPv4, IPv6 address, or domain name' },
        { status: 400 }
      );
    }

    try {
      // Sanitize target to prevent command injection
      const sanitizedTarget = target.replace(/[;&|`$()]/g, '');
  reqLog.info('Starting traceroute', { target: sanitizedTarget, type: getTargetType(sanitizedTarget) });
      
      const platform = process.platform;
      let command: string;

      if (platform === 'darwin' || platform === 'linux') {
        const isIPv6 = IPV6_REGEX.test(sanitizedTarget);
        const cmd = isIPv6 ? 'traceroute6' : 'traceroute';
        command = `${cmd} -w 3 ${sanitizedTarget}`;
      } else if (platform === 'win32') {
        command = `tracert -w 3000 ${sanitizedTarget}`;
      } else {
        reqLog.error('Unsupported OS for traceroute', { platform });
        return NextResponse.json(
          { success: false, target, error: 'Unsupported operating system' },
          { status: 500 }
        );
      }
      reqLog.debug('Executing command', { command });

      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000,
        maxBuffer: 1024 * 1024
      });

      if (stderr && !stdout) {
        const errorMessage = `Traceroute error: ${stderr}`;
        reqLog.error('Traceroute failed with stderr only', { stderr: redact(stderr, 200) });
        return NextResponse.json(
          { success: false, target, error: errorMessage },
          { status: 500 }
        );
      }

      reqLog.debug('Traceroute output received', { stdoutSize: stdout?.length ?? 0, stderrSize: stderr?.length ?? 0 });
      const hops = parseTraceroute(stdout);
      reqLog.info('Parsed traceroute output', { hopsCount: hops.length });

      // Save to database using new schema
      try {
        await saveTracerouteToDatabase(
          sanitizedTarget,
          hops.find(h => h.hostname)?.hostname || null,
          hops
        );
      } catch (dbError) {
        reqLog.error('Database save error', { error: (dbError as Error)?.message });
        // Continue even if database save fails
      }

      reqLog.info('Traceroute completed', { durationMs: stop() });
      return NextResponse.json({
        success: true,
        target,
        hops
      });

    } catch (error) {
      logger.error('Traceroute execution error', { error: (error as Error)?.message });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return NextResponse.json(
        { success: false, target, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.warn('Invalid POST body for traceroute');
    return NextResponse.json(
      { success: false, target: '', error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
