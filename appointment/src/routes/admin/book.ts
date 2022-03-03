import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType, StatusType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';
import mongoose from 'mongoose';
const router = express.Router();

router.post('/api/appointment/admin/book' , requireAuth , async (req : Request , res : Response) =>
{
    const admin = await User.findById(req.currentUser!.id);

    if (!admin || admin.role !== RolesType.Admin) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if(req.query.doctorId || !mongoose.Types.ObjectId.isValid(String(req.query.doctorId)))
    {
        throw new BadRequestError('Id Is Invalid');
    }

    const doctor = await User.findById(req.query.doctorId);
    if(!doctor || doctor.role !== RolesType.Doctor)
    {
        throw new BadRequestError('doctor not found');
    }

    const patient = await User.findById(req.query.patientId);
    if(!patient || patient.role !== RolesType.Patient)
    {
        throw new BadRequestError('patient not found');
    }

    if(!req.body.date)
    {
        throw new BadRequestError('date field is required');
    }
    
    if(!req.body.start_time)
    {
        throw new BadRequestError('start time field is required');
    }

    if(!req.body.description)
    {
        throw new BadRequestError('description field is required');
    }

    const appointment = Appointment.build({
        patient : patient.id,
        doctor : doctor.id,
        date : new Date(req.body.date).toDateString(),
        ...req.body,
        dataStatus : { id : admin.id , status : StatusType.Reserved }
    });

    await appointment.save();
    
    res.status(201).send({ status : 201 , appointment , message : "Appointment Created Successfully" , success : true });
});

export { router as adminAddAppointmentForDoctor };