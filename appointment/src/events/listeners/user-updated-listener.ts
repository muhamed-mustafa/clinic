import { Subjects , Listener , UserUpdatedEvent } from "@clinic-microservices14/common";
import { User } from "../../models/user.model";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";

export class UserUpdatedListener extends Listener<UserUpdatedEvent>
{
    readonly subject = Subjects.UserUpdated;
    queueGroupName   = queueGroupName;
    async onMessage(data : UserUpdatedEvent['data'] , msg : Message)
    {
        const user = await User.findOne({ id : data.id , version : data.version - 1 });
        if(!user)
        {
            throw new Error('user is not found!');
        }

        let fields : { [key : string] : any } = { ...data };

        delete fields['version'];

        user.set({ ...fields });

        await user.save();

        msg.ack();
    };
};