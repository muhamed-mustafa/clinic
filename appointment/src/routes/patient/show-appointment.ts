import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType } from '@clinic-microservices14/common';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
const router = express.Router();

router.get('/api/appointment/patient' , requireAuth , async (req : Request , res : Response) =>
{
    const patient = await User.findById(req.currentUser!.id);

    if (!patient || patient.role !== RolesType.Patient) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.query.id || !mongoose.Types.ObjectId.isValid(String(req.query.id)))
    {
        throw new BadRequestError('id is invalid');
    }

    const appointment = await Appointment.findById(req.query.id);

    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    res.status(200).send({ status : 200 , appointment , success : true });
});

export { router as showAppointment };