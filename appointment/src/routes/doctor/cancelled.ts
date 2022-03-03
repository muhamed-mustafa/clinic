import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
const router = express.Router();

router.patch('/api/appointment/doctor/cancelled' , requireAuth , async (req : Request , res : Response) =>
{
    const doctor = await User.findById(req.currentUser!.id);

    if (!doctor || doctor.role !== RolesType.Doctor) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.query.appointmentId || !mongoose.Types.ObjectId.isValid(String(req.query.id)))
    {
        throw new BadRequestError('appointmentId is invalid');
    }

    const appointment = await Appointment.findById(req.query.appointmentId);

    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    appointment.dataStatus = { id : doctor.id , status : StatusType.Cancelled }
    await appointment.save();
    
    res.status(200).send({ status : 200 , appointment , success : true });
});

export { router as doctorCancelledAppointment };