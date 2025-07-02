import { UUID } from "node:crypto";
import { fetchMS, URLS } from "../fetchMicroservices.js";

// The variables are in snake case because this is what the events microservice returns
// This is the result of some naming conventions in .NET
// This isn't a problem because the getJSONFromEvent function converts it to camel case
interface Event {
    id: UUID;
    title: String;
    description: String;
    place: String;
    starts_at: Date;
    ends_at: Date;
    capacity: Number;
    user_creator_id: UUID;
    group_creator_id?: UUID;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}

export interface NewEvent {
    title: String;
    description: String;
    place: String;
    startsAt: Date;
    endsAt: Date;
    capacity: Number;
}

// This shares several arguments with NewEvent and so one would think of extending it.
// However, I need to change some properties from camelCase to snake_case because that's
// what the backend expects. I think hardcoding it this way is just simpler
interface CreateEventBody {
    title: String;
    description: String;
    place: String;
    starts_at: Date;
    ends_at: Date;
    capacity: Number;
    user_creator_id: UUID;
    group_creator_id?: UUID;
}

function getJSONFromEvent(event: Event) {
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        place: event.place,
        startsAt: new Date(event.starts_at),
        endsAt: new Date(event.ends_at),
        capacity: event.capacity,
        userCreatorId: event.user_creator_id,
        groupCreatorId: event.group_creator_id,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
        deletedAt: new Date(event.deleted_at)
    }
}

export const eventsResolver = async () => {
    const response = await fetchMS<Event[]>({
        url: `${URLS.EVENTS_MS}`,
        wrapInData: true
    })

    const events = response.responseBody.data
    const processedResponse = events.map(event => {
        return getJSONFromEvent(event)
    })
    return processedResponse
}

export const eventResolver = async (id: UUID) => {
    const response = await fetchMS<Event>({
        url: `${URLS.EVENTS_MS}/${id}`,
        wrapInData: true
    })

    const event = response.responseBody.data
    return getJSONFromEvent(event)
}

export const createEventResolver = async (input: NewEvent) => {
    const body: CreateEventBody = {
        title: input.title,
        description: input.description,
        place: input.place,
        capacity: input.capacity,
        starts_at: input.startsAt,
        ends_at: input.endsAt,   
        // TODO: get these two values from the context
        // Right now these are hardcoded values meant for testing
        user_creator_id: "ec8da607-d038-44d6-aa28-c6811db563fb",
        group_creator_id: null
    }

    const response = await fetchMS<Event>({
        url: `${URLS.EVENTS_MS}`,
        method: "POST",
        body: JSON.stringify(body),
        headers: new Headers({ 
            "Content-Type": "application/json" 
        }),
        wrapInData: true,
        expectedStatus: 201
    })

    const event = response.responseBody.data
    return getJSONFromEvent(event)
}