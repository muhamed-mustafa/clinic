import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/api/appointment/admin/schedule' , requireAuth , async (req : Request , res : Response) =>
{
    const admin = await User.findById(req.currentUser!.id);

    if (!admin || admin.role !== RolesType.Admin) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(!req.query.doctorId || !mongoose.Types.ObjectId.isValid(String(req.query.doctorId)))
    {
        throw new BadRequestError('doctor id is invalid');
    }

    const doctor = await User.findById(req.query.doctorId);

    if(!doctor)
    {
        throw new BadRequestError('doctor not found');
    }

    let appointments = await Appointment.find({ doctor : doctor.id });

    if(appointments.length === 0)
    {
        throw new BadRequestError('there is no appointments...');
    }

    appointments = appointments.filter(appointment => !appointment.date);

    res.status(200).send({ status : 200 , appointments , success : true });
});

export { router as adminGetScheduleAppointments };