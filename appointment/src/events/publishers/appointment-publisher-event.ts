import { Subjects , AppointmentCreatedEvent , Publisher } from "@clinic-microservices14/common";

export class AppointmentCreatedPublisher extends Publisher<AppointmentCreatedEvent>
{
    readonly subject = Subjects.AppointmentCreated;
};