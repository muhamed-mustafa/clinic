import { GenderType, RolesType } from "..";
import { Subjects } from "./subjects";

export interface UserCreatedEvent
{
    subject : Subjects.UserCreated;
    data :
    {
        id : string;
        email : string;
        username : string;
        role : RolesType;
        age  : number;
        picture : string;
        phone : string
        gender : GenderType
        specialization? : string;
        version : number;
    };
};