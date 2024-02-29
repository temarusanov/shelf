# Health Checks

## Problem

Imagine a huge application with a bunch of internal services, you are tasked with changing the pipe in one of the controllers. Pipe has nothing to do with the database or Kafka. In order to run the application and test the pipe, you will need to bring up the database and all external services. Not very convenient, huh?

How to run an application that does not depend on a database, kafka or any other internal services? How to get service connection status from an application?

## Solution

Do not terminate the application if the connection to internal services failed. The application should work even if it is not connected to the database

> A health check represents a summary of health indicators. A health indicator executes a check of a service, whether it is in a healthy or unhealthy state. A health check is positive if all the assigned health indicators are up and running.

In this example, I'm using Prisma ORM and built indicator above prisma connection. First, install `@shelfjs/health-checks` package

```bash
npm i --save @shelfjs/health-checks
```

Create a health check indicator

```ts
import { Injectable } from '@nestjs/common'
import {
    HealthIndicator,
    HealthIndicatorResult,
} from '@shelfjs/health-checks'

import { SamplePrismaService } from '../sample-services/sample-prisma.service'

@Injectable()
export class SamplePrismaConnectionHealthIndicator {
    constructor(private readonly prisma: SamplePrismaService) {}

    @HealthIndicator('sample-database')
    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            await this.prisma.$queryRaw<{ dt: string }[]>`SELECT now() dt`

            return {
                status: 'up',
            }
        } catch (error) {
            return {
                status: 'down',
                error: error.message,
            }
        }
    }
}
```

Then catch connection error of your ORM or transport service. As example I use Prisma client

```ts
async onModuleInit(): Promise<void> {
    try {
        // connect to the database
        await this.$connect()
    } catch (err) {
        // do not throw error here
        this.logger.error(err, err.stack)
    }
}
```

As a result we have



```json
{
  "ratio": 1,
  "uptime": 5,
  "timestamp": 1675597500626,
  "services": [
    {
      "name": "sample-database",
      "status": "up",
    },
    {
      "name": "my-service",
      "status": "up",
      "details": {
        "entitiesCreated": 500
      }
    }
  ]
}
```