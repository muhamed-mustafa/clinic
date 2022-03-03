import mongoose from 'mongoose';
import { StatusType } from '@clinic-microservices14/common';

interface AppointmentAttrs 
{
    doctor  : string;
    patient? : string;
    date?   : string;
    start_time? : string;
    end_time?   : string;
    description? : string;
    dataStatus?  : { id : string; status : StatusType; };
};
 
interface AppointmentDoc extends mongoose.Document
{
    doctor  : string;
    patient : string;
    date    : string;
    start_time  : string;
    end_time    : string;
    description : string;
    reschedule  : boolean;
    dataStatus  : { id : string; status : StatusType; };  
    createdAt   : string;
    updatedAt   : string; 
};

interface AppointmentModel extends mongoose.Model<AppointmentDoc>
{
    build(attrs : AppointmentAttrs) : AppointmentDoc;
}

const appointmentSchema = new mongoose.Schema({
    doctor :
    {
        type : mongoose.Schema.Types.ObjectId,
        ref  : "User"
    },

    patient :
    {
        type : mongoose.Schema.Types.ObjectId,
        ref  : "User"
    },

    date :
    {
        type : String,
        trim : true
    },

    start_time :
    {
        type : String,
        trim : true
    },

    end_time :
    {
        type : String,
        trim : true
    },

    description :
    {
        type : String,
        trim : true,
        min  : 1,
        max  : 100 
    },

    dataStatus :
    {
        id :
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },

        status : 
        {
            type : String,
            required : true,
            trim : true,
            lowercase : true,
            enum : Object.values(StatusType),
        }
    },
    
    reschedule :
    {
        type : Boolean,
        default : false
    }

} , { toJSON : { transform(doc , ret) { ret.id = ret._id , delete ret._id }} , timestamps : { createdAt: 'created_at', updatedAt: 'updated_at' } });

appointmentSchema.statics.build = (attrs : AppointmentAttrs) =>
{
    return new Appointment(attrs);
}

const Appointment = mongoose.model<AppointmentDoc , AppointmentModel>('Appointment' , appointmentSchema);

export { Appointment };
