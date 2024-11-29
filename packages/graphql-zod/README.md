# Logging

Imagine a large application in which there is active development and something constantly needs to be debugged. 
The developers cover everything with debug logs and all this deploys to the server. 
Due to the huge number of logs, it is impossible to find the log you need. 
Developers remove all debug logs. After a lot of logs have been removed, a bug appears in production, but now there are no logs.

How to find a balance between logs, and turn on only necessary logs?

## Installation

```bash
npm i --save @shelfjs/logger
```
    
### Features

Divide logs into subgroups. Break logs into subgroups. 
For example, authorization logs, post debug logs, notification debug logs and etc.
Now, instead of removing logs from the code, you can turn logs on or off at the moment you need

- Various labers of logs that can be turned on/off via config
- In production mode debug() does not work
- Datetime in UTC format
- Format of logs: `[time] [level] [label] [message]`
- Can be used instead of NestJS Logger
- Can log any objects, arrays, variables
- Modes: normal or json format output
- Colors!

  
### Usage/Examples

```ts
import { Logardian } from 'logardian'

const logger = new Logardian()

logger.configure({
    labels: ['users', '*.debug']
})

logger.log(`Hi! I'm info log example`)
logger.warn(`Hi! I'm warn log example`)
logger.error(`Hi! I'm error log example`)
logger.verbose(`Hi! I'm verbose log example`)
logger.debug({ some: 'object' })

logger.markTime('marker')

setTimeout(() => {
    logger.measureTime('marker', 'Function take {n} ms to execute')
}, 2000)

logger.log(`I will log`, { label: 'users' })
logger.log(`I will log too`, { label: 'auth.debug' })
logger.log(`I will not log :(`, { label: 'database' })
```

### Default output

![](https://i.ibb.co/dQn1t8Q/image.png)


### Json output

> Json logs are useful to push logs in Loki or Elastic and make flexible queries

```ts
logger.configure({
    json: true
})
```

```bash
{"timestamp":"2022-10-10T12:39:40.012Z","message":"Starting Nest application...","level":"log"}
{"timestamp":"2022-10-10T12:39:40.017Z","message":"AppModule dependencies initialized","level":"log"}
{"timestamp":"2022-10-10T12:39:40.020Z","message":"Nest application successfully started","level":"log"}
{"timestamp":"2022-10-10T12:39:40.022Z","message":"Hi! I'm info log example","level":"log"}
{"timestamp":"2022-10-10T12:39:40.022Z","message":"Hi! I'm warn log example","level":"warn"}
{"timestamp":"2022-10-10T12:39:40.022Z","message":"Hi! I'm error log example","level":"error"}
{"timestamp":"2022-10-10T12:39:40.022Z","message":"Hi! I'm verbose log example","level":"verbose"}
{"timestamp":"2022-10-10T12:39:40.022Z","message":"{\"some\":\"object\"}","level":"debug"}
{"timestamp":"2022-10-10T12:39:40.023Z","message":"I will log","level":"log","label":"users"}
{"timestamp":"2022-10-10T12:39:40.024Z","message":"I will log too","level":"log","label":"auth.debug"}
{"timestamp":"2022-10-10T12:39:42.024Z","message":"Function take 2002.041 ms to execute","level":"timer"}
```

### Labels

Labels now support glob patterns! You can dynamically enable and disable the logs you need via `logger.configure()`. For example:

> Using [HCP Consul KV](https://developer.hashicorp.com/consul/docs/dynamic-app-config/kv) you can dynamically change labels in your application, without restarting it



```ts
import { Logardian } from 'logardian'

const logger = new Logardian()

logger.configure({
    labels: ['users.*']
})

logger.log('User sent mail', { label: 'users.email' }) // will log
logger.log('User registered', { label: 'users.auth.registration' }) // will log
logger.log('User authorized', { label: 'users.auth.authorization' }) // will log
logger.log('Database connected', { label: 'database' }) // will NOT log
logger.log('User entity created', { label: 'database.users' }) // will NOT log
``` 

### Colors

If you don't like the set of colors logardian provides you can change them in `configure()` function.

```ts
const logger = new Logardian()

logger.configure({
    colors: {
        timestamp: '#ABC',
        traceId: '#CCC',
        label: '#FFFFFF',
        message: '#FFFFFF',
        trace: '#FFFFFF',
        stack: '#000000'
    }
})
```

### Environment Variables

`NODE_ENV` production start does not show debug() logs

### FAQ

#### How does it implement NestJS Logger without any framework libs?

We made logger based on [LoggerService](https://github.com/nestjs/nest/blob/master/packages/common/services/logger.service.ts) but we don't explicitly import it so that we stay dependless of NestJS libraries. But you can also use the Logardian instead of common NestJS logger.

```ts
// main.ts
import { Logardian } from 'logardian'

const logger = new Logardian()

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, { logger })

    await app.listen(port, hostname, () =>
        logger.log(`Server running at ${hostname}:${port}`),
    )
}
```

#### How can I use logardian in my NestJS service?

Simply create a new logger class

```ts
import { Logardian } from 'logardian'

@Injectable()
export class CatService {
    private readonly _logger = new Logardian()
}
```

#### I do not see NestJS logger context

Yeah, that's a problem. And for know I don't know quickfix for that

#### I do not see my logs with label

Specify labels you want to log or write `*` to log every log with label. 
Working in production and development mode

Logardian is a singleton, so it means that `configure()` works on all Logardian instances

```ts
import { Logardian } from 'logardian'

const logger = new Logardian()

logger.configure({
    labels: '*', // or ['database', 'events'] or false
    trace: false,
    json: true,
    traceId: true
})
```
