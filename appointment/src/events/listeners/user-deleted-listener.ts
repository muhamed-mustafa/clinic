import { Subjects , Listener , UserDeletedEvent , RolesType } from "@clinic-microservices14/common";
import { User } from "../../models/user.model";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Appointment } from "../../models/appointment.model";
export class UserDeletedListener extends Listener<UserDeletedEvent>
{
    readonly subject = Subjects.UserDeleted;
    queueGroupName   = queueGroupName;
    async onMessage(data : UserDeletedEvent['data'] , msg : Message)
    {
        const user = await User.findByIdAndRemove(data.id);

        if(!user)
        {
            throw new Error('user is not found.')
        }
        
        if (user.role === RolesType.Doctor) 
        {
            await Appointment.deleteMany({ doctor : user.id });
        } 
        
        else
         {
            await Appointment.deleteMany({ patient : user.id });
        }

        msg.ack();
    };
};