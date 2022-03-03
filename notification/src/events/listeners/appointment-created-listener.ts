import { Listener , Subjects , AppointmentCreatedEvent } from "@clinic-microservices14/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { notificationQueue } from "../../queues/notification-queue";

export class AppointmentCreatedListener extends Listener<AppointmentCreatedEvent>
{
    readonly subject = Subjects.AppointmentCreated;
    queueGroupName   = queueGroupName;

    async onMessage(data : AppointmentCreatedEvent['data'] , msg : Message)
    {
        if(data.patientId)
        {
            const delay = (new Date(`${data.date} ${data.start_time}`).getTime() - new Date().getTime()) - 864e5;
          
            if(delay > 0)
            {
                notificationQueue.add({
                  patientId : data.patientId,
                  patientPhone : String(data.patientPhone),
                  appointmentDate : String(data.date),
                  appointmentTime : String(data.start_time)
                } , { delay });
            }
        }

        msg.ack();
    }
};