import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';
import mongoose from 'mongoose';
import _ from 'lodash';
const router = express.Router();

router.patch('/api/appointment/admin/update-book' , requireAuth , async (req : Request , res : Response) =>
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

    if(req.body.date)
    {
        appointment.date = new Date(req.body.date).toDateString();
    }

    _.extend(appointment , req.body);
    appointment.dataStatus = { id : admin.id , status : StatusType.Reserved }

    await appointment.save();

    res.status(200).send({ status : 200 , appointment , success : true });
});

export { router as adminUpdateBookForPatients };