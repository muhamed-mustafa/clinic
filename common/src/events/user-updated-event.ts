import { RolesType } from "../types/roles-type";
import { Subjects } from "./subjects";

export interface UserUpdatedEvent
{
    subject : Subjects.UserUpdated;
    data :
    {
        id : string;
        email? : string;
        username? : string;
        role? : RolesType;
        age?  : number;
        picture? : string;
        phone? : string;
        specialization? : string;
        availableDate? : string;
        version : number;
    };
};