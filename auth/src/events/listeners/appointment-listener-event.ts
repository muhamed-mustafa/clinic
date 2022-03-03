import { Subjects , Listener , AppointmentCreatedEvent, BadRequestError, RolesType } from "@clinic-microservices14/common";
import { Message } from "node-nats-streaming";
import { User } from "../../models/user.model";
import { queueGroupName } from "./queue-group-name";
import { UserUpdatedPublisher } from "../publishers/user-updated-publisher";

export class AppointmentCreatedListener extends Listener<AppointmentCreatedEvent>
{
    readonly subject = Subjects.AppointmentCreated;
    queueGroupName   = queueGroupName;

    async onMessage(data : AppointmentCreatedEvent['data'] , msg : Message)
    {
        if(data.doctorId)
        {
            const doctor = await User.findById(data.doctorId);

            if(!doctor || doctor.role !== RolesType.Doctor)
            {
                throw new BadRequestError('Doctor is not found');
            }

            doctor.availableDates.push(data.id);

            const doctorData = await doctor.save();

            if(doctorData)
            {
                await new UserUpdatedPublisher(this.client).publish({
                    id :  doctor.id,
                    version : doctor.version
                });
            }   
        }

        msg.ack();
    }
};
