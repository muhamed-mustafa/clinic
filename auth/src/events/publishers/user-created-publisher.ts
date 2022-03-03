import { Subjects , Publisher , UserCreatedEvent } from "@clinic-microservices14/common";

export class UserCreatedPublisher extends Publisher<UserCreatedEvent>
{
    readonly subject = Subjects.UserCreated;
}