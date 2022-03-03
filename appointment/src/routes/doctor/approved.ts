import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
import { AppointmentCreatedPublisher } from '../../events/publishers/appointment-publisher-event';
import { natsWrapper } from '../../nats-wrapper';

const router = express.Router();

router.patch('/api/appointment/doctor/approved' , requireAuth , async (req : Request , res : Response) =>
{
    const doctor = await User.findById(req.currentUser!.id);

    if (!doctor || doctor.role !== RolesType.Doctor) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.query.appointmentId || !mongoose.Types.ObjectId.isValid(String(req.query.appointmentId)))
    {
        throw new BadRequestError('appointmentId is invalid');
    }

    const patient = await User.findById(req.query.patientId);
    if(!patient)
    {
        throw new BadRequestError('patient not found');
    }

    const appointment = await Appointment.findById(req.query.appointmentId);

    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    appointment.dataStatus = { id : doctor.id , status : StatusType.Approved }
    const appointmentData = await appointment.save();
    
    if(appointmentData)
    {
        await new AppointmentCreatedPublisher(natsWrapper.client).publish({
            id : appointmentData.id,
            date : appointmentData.date,
            patientId : patient.id,
            patientPhone : patient.phone,
            start_time : appointmentData.start_time
        });
    }

    res.status(200).send({ status : 200 , appointment , success : true });
});

export { router as doctorApprovedAppointment };