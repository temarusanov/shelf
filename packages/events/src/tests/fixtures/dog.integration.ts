import { Injectable, Inject } from "@nestjs/common"
import { EventPayload } from "../../lib/interfaces/events.interfaces"
import { CATS_LISTENER, CatsEventsListener, CatsEventPattern, CatsEventPatternToData } from "./cats/events.config"

@Injectable()
export class DogIntegration {
    constructor(
        @Inject(CATS_LISTENER)
        private readonly events: CatsEventsListener,
    ) {}

    onApplicationBootstrap() {
        this.listenCatCreatedEvent()
    }

    listenCatCreatedEvent() {
        this.events.listen(CatsEventPattern.CAT_CREATED, async (event) => {
            this.onCatCreatedEvent(event)
        })
    }

    async onCatCreatedEvent(event: EventPayload<CatsEventPattern, CatsEventPatternToData>) {
        console.log(event)
        return event
    }
}