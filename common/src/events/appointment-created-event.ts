import { Subjects } from "./subjects";

export interface AppointmentCreatedEvent
{
    subject : Subjects.AppointmentCreated;
    data :
    {
        id : string;
        doctorId? : string;
        date? : string;
        start_time? : string;
        patientId? : string;
        patientPhone? : string;
    };
};