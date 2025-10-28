# Database Documentation

## Overview

Topologer uses SQLite with Prisma ORM to store network topology data including routers, measurement systems, paths, and hops in a normalized relational structure.

## Schema

### Router

Represents a network router or node discovered during traceroutes.

| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Unique identifier |
| ipAddress | String (unique) | IP address of the router |
| hostname | String? | Hostname if available |
| asn | Int? | Autonomous System Number |
| countryCode | String? | 2-letter ISO-3166-1 alpha-2 country code |
| countryName | String? | Country name in English |
| nativeName | String? | Country name in native language |
| continent | String? | 2-letter continent code (AS, EU, NA, etc.) |
| continentName | String? | Continent name |
| capital | String? | Capital city of the country |
| hopsFrom | Hop[] | Hops where this router is the source |
| hopsTo | Hop[] | Hops where this router is the destination |
| createdAt | DateTime | When the router was first discovered |
| updatedAt | DateTime | Last time router info was updated |

### MeasurementSystem

Represents the system performing traceroutes (your server).

| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Unique identifier |
| name | String | Name of the measurement system |
| ipAddress | String (unique) | IP address of the system |
| description | String? | Optional description |
| paths | Path[] | Paths measured by this system |
| createdAt | DateTime | When the system was created |
| updatedAt | DateTime | Last update time |

### Path

Represents a complete traceroute path from measurement system to target.

| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Unique identifier |
| msId | String | Foreign key to MeasurementSystem |
| targetIp | String | Target IP address |
| targetHostname | String? | Target hostname if available |
| hops | Hop[] | Individual hops in this path |
| createdAt | DateTime | When the path was traced |
| updatedAt | DateTime | Last update time |

### Hop

Represents a single hop (router-to-router connection) in a path.

| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Unique identifier |
| sequence | Int | Hop number in the path (1, 2, 3, etc.) |
| sourceId | String | Foreign key to source Router |
| destinationId | String | Foreign key to destination Router |
| rtt | Float? | Round-trip time in milliseconds |
| pathId | String | Foreign key to Path |
| createdAt | DateTime | When the hop was recorded |
| updatedAt | DateTime | Last update time |

## Benefits of This Schema

1. **Deduplication**: Routers are stored once and referenced by multiple hops/paths
2. **Network Graph**: Can build a complete network topology graph
3. **Analysis**: Easily query all paths through a specific router
4. **Efficiency**: Normalized structure reduces data redundancy
5. **Scalability**: Can handle millions of paths and hops efficiently
6. **Geolocation**: Country-level location data from geoip-country for all public IPs

## API Endpoints

### POST/GET `/api/traceroute`

Execute a new traceroute and store the results.

**Query Parameters (GET):**

- `target` - The IPv4, IPv6, or domain to trace

**Request Body (POST):**

```json
{
  "target": "google.com"
}
```

### GET `/api/traceroute/history`

Retrieve traceroute path history.

**Query Parameters:**

- `limit` (optional) - Number of results to return (default: 50)
- `target` (optional) - Filter by target IP or hostname

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "id": "...",
      "targetIp": "8.8.8.8",
      "targetHostname": "dns.google",
      "createdAt": "2025-10-29T...",
      "hopCount": 15
    }
  ]
}
```

### GET `/api/traceroute/[id]`

Get detailed information about a specific path with all hops.

**Response:**

```json
{
  "success": true,
  "result": {
    "id": "...",
    "targetIp": "8.8.8.8",
    "targetHostname": "dns.google",
    "createdAt": "2025-10-29T...",
    "hops": [
      {
        "sequence": 1,
        "sourceIp": "192.168.1.1",
        "sourceHostname": "gateway",
        "sourceCountry": null,
        "sourceCountryName": null,
        "sourceContinent": null,
        "sourceCapital": null,
        "destinationIp": "10.0.0.1",
        "destinationHostname": "isp-router",
        "destinationCountry": "US",
        "destinationCountryName": "United States",
        "destinationContinent": "North America",
        "destinationCapital": "Washington",
        "rtt": 1.234
      }
    ]
  }
}
```

### GET `/api/routers`

Query discovered routers with geolocation data.

**Query Parameters:**

- `limit` (optional) - Number of results to return (default: 100)
- `country` (optional) - Filter by country code (e.g., US, CN)
- `continent` (optional) - Filter by continent code (e.g., AS, EU, NA)

**Response:**

```json
{
  "success": true,
  "routers": [
    {
      "id": "...",
      "ipAddress": "8.8.8.8",
      "hostname": "dns.google",
      "countryCode": "US",
      "countryName": "United States",
      "nativeName": "United States",
      "continent": "NA",
      "continentName": "North America",
      "capital": "Washington",
      "pathCount": 5
    }
  ]
}
```

## Database Commands

### Create a new migration

```bash
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Reset database

```bash
npx prisma migrate reset
```

### View database in Prisma Studio

```bash
npx prisma studio
```

## Database Location

The SQLite database is stored at `./dev.db` (relative to project root).

**Note:** The database file is excluded from git via `.gitignore`.
