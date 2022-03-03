import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
import { AppointmentCreatedPublisher } from '../../events/publishers/appointment-publisher-event';
import { natsWrapper } from '../../nats-wrapper';

const router = express.Router();

router.patch('/api/appointment/admin/approved' , requireAuth , async (req : Request , res : Response) =>
{
    const admin = await User.findById(req.currentUser!.id);
    if (!admin || admin.role !== RolesType.Admin) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    const patient = await User.findById(req.query.patientId);
    if(!patient)
    {
        throw new BadRequestError('patient not found');
    }

    if(!req.query.appointmentId || !mongoose.Types.ObjectId.isValid(String(req.query.appointmentId)))
    {
        throw new BadRequestError('appointment id is invalid');
    }

    const appointment = await Appointment.findById(req.query.appointmentId);

    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    appointment.dataStatus = { id : admin.id , status : StatusType.Approved }
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
    };

    res.status(200).send({ status : 200 , appointment , success : true });
});

export { router as adminApprovedAppointment };