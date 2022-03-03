import { Subjects , Publisher , UserUpdatedEvent } from "@clinic-microservices14/common"

export class UserUpdatedPublisher extends Publisher<UserUpdatedEvent>
{
    readonly subject = Subjects.UserUpdated;
}