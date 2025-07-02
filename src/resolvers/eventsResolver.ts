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