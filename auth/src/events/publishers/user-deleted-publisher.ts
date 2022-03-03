import { Subjects , Publisher , UserDeletedEvent } from "@clinic-microservices14/common";

export class UserDeletedPublisher extends Publisher<UserDeletedEvent>
{
    readonly subject = Subjects.UserDeleted;
}