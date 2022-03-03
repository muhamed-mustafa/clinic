import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , upload , RolesType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';
import mongoose from 'mongoose';

const router = express.Router();

router.patch('/api/appointment/patient/reschedule' , upload.none() , requireAuth , async (req : Request , res : Response) =>
{   
    const patient = await User.findById(req.currentUser!.id);

    if (!patient || patient.role !== RolesType.Patient) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.query.appointmentId || !mongoose.Types.ObjectId.isValid(String(req.query.appointmentId)))
    {
        throw new BadRequestError('Id Is Invalid');
    }

    const appointment = await Appointment.findById(req.query.appointmentId);
    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    appointment.reschedule = true;
    await appointment.save();

    res.status(200).send({ status : 200 , appointment , success : true });
});

export { router as rescheduleAppointment };