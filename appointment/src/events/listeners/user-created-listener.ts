import { Subjects , Listener , UserCreatedEvent } from "@clinic-microservices14/common";
import { User } from "../../models/user.model";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";

export class UserCreatedListener extends Listener<UserCreatedEvent>
{
    readonly subject = Subjects.UserCreated;
    queueGroupName   = queueGroupName;
    async onMessage(data : UserCreatedEvent['data'] , msg : Message)
    {
        const user = User.build({
            id: data.id,
            version: data.version,
            email: data.email,
            username: data.username,
            age: data.age,
            phone: data.phone,
            role: data.role,
            picture: data.picture,
            gender : data.gender,
            specialization : data.specialization
        });

        await user.save();

        msg.ack();
    };
};