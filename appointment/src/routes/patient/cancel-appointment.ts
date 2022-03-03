import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError, StatusType } from '@clinic-microservices14/common';
import mongoose from 'mongoose';

const router = express.Router();

router.patch('/api/appointment' , requireAuth , async (req : Request , res : Response) =>
{
    if(!req.query.id || !mongoose.Types.ObjectId.isValid(String(req.query.id)))
    {
        throw new BadRequestError('id is invalid');
    }

    const appointment = await Appointment.findById(req.query.id);

    if(!appointment)
    {
        throw new BadRequestError('Appointment Not Found');
    }

    appointment.dataStatus = { id : req.currentUser!.id , status : StatusType.Cancelled };
    await appointment.save();

    res.status(200).send({ status : 200 , message : "Appointment Cancelled Successfully." , success : true });
});

export { router as cancelledAppointment };
