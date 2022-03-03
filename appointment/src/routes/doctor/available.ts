import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';
import { AppointmentCreatedPublisher } from '../../events/publishers/appointment-publisher-event';
import { natsWrapper } from '../../nats-wrapper';
const router = express.Router();

router.post('/api/appointment/doctor/available' , requireAuth , async (req : Request , res : Response) =>
{
    const doctor = await User.findById(req.currentUser!.id);

    if (!doctor || doctor.role !== RolesType.Doctor) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.body.date)
    {
        throw new BadRequestError('date field is required');
    }
    
    if(!req.body.start_time)
    {
        throw new BadRequestError('start time field is required');
    }

    if(!req.body.end_time)
    {
        throw new BadRequestError('end time field is required');
    }

    const appointment = Appointment.build({
        doctor : doctor.id,
        date : new Date(req.body.date).toDateString(),
        ...req.body
    });
    

    await doctor.updateOne({ $push : { availableDates : appointment.id }} , { new : true });
    const appointmentData = await appointment.save();
    
    if(appointmentData)
    {
        await new AppointmentCreatedPublisher(natsWrapper.client).publish({
            id : appointmentData.id,
            doctorId : doctor.id,
        });
    }
    
    res.status(201).send({ status : 201 , appointment , message : "Appointment Created Successfully" , success : true });
});

export { router as doctorAddAvailableDates };