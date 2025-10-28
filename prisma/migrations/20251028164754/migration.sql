-- CreateTable
CREATE TABLE "Router" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT,
    "asn" INTEGER,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "timezone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MeasurementSystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sequence" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "rtt" REAL,
    "pathId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Link_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Router" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Link_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Router" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Link_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Path" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msId" TEXT NOT NULL,
    "targetIp" TEXT NOT NULL,
    "targetHostname" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Path_msId_fkey" FOREIGN KEY ("msId") REFERENCES "MeasurementSystem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Router_ipAddress_key" ON "Router"("ipAddress");

-- CreateIndex
CREATE INDEX "Router_ipAddress_idx" ON "Router"("ipAddress");

-- CreateIndex
CREATE INDEX "Router_country_idx" ON "Router"("country");

-- CreateIndex
CREATE INDEX "Router_city_idx" ON "Router"("city");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementSystem_ipAddress_key" ON "MeasurementSystem"("ipAddress");

-- CreateIndex
CREATE INDEX "MeasurementSystem_ipAddress_idx" ON "MeasurementSystem"("ipAddress");

-- CreateIndex
CREATE INDEX "Link_pathId_idx" ON "Link"("pathId");

-- CreateIndex
CREATE INDEX "Link_sourceId_idx" ON "Link"("sourceId");

-- CreateIndex
CREATE INDEX "Link_destinationId_idx" ON "Link"("destinationId");

-- CreateIndex
CREATE INDEX "Path_msId_idx" ON "Path"("msId");

-- CreateIndex
CREATE INDEX "Path_targetIp_idx" ON "Path"("targetIp");

-- CreateIndex
CREATE INDEX "Path_createdAt_idx" ON "Path"("createdAt");
