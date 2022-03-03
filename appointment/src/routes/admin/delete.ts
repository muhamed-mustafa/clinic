import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';
import mongoose from 'mongoose';

const router = express.Router();

router.delete('/api/appointment/admin/delete' , requireAuth , async (req : Request , res : Response) =>
{
    const admin = await User.findById(req.currentUser!.id);

    if (!admin || admin.role !== RolesType.Admin) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.query.appointmentId || !mongoose.Types.ObjectId.isValid(String(req.query.appointmentId)))
    {
        throw new BadRequestError('appointmentId is invalid');
    }

    const appointment = await Appointment.findById(req.query.appointmentId);

    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    if(!appointment.patient)
    {
        throw new BadRequestError("You can't delete this available date document");
    }

    await appointment.deleteOne();
    res.send({ status : 204 , message : "Appointment Deleted Successfully..." , success : true });
});

export { router as adminDeleteAppointments };