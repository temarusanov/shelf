import { Inject, Injectable } from "@nestjs/common";
import { CATS_PUBLISHER, CatsEventPattern, CatsEventsPublisher } from "./events.config";

@Injectable()
export class CatsService {
    constructor(
        @Inject(CATS_PUBLISHER)
        private readonly events: CatsEventsPublisher
    ) {}

    async createCat(name: string) {
        await this.events.send({
            pattern: CatsEventPattern.CAT_CREATED,
            data: {
                name
            },
        })
    }
}