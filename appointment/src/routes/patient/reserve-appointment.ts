import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , StatusType , BadRequestError , RolesType , upload } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';

const router = express.Router();

router.post('/api/appointment/patient/book' , upload.none() , requireAuth , async (req : Request , res : Response) =>
{
    const patient = await User.findById(req.currentUser!.id);   

    if (!patient || patient.role !== RolesType.Patient) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    if (!req.query.doctorId) 
    {
        throw new BadRequestError("Doctor ID is required");
    }

    const doctor = await User.findById(req.query.doctorId);
    console.log(doctor);

    if (!doctor) 
    {
        throw new BadRequestError("Doctor Not Found");
    }

    if(!req.body.description)
    {
        throw new BadRequestError('description field is required');
    }
    
    const appointment = Appointment.build({ 
        patient : patient.id , 
        doctor : doctor.id , 
        description : req.body.description ,
        dataStatus   : { id : patient.id , status : StatusType.Reserved }  
    });

    await appointment.save();

    res.status(201).send({ status : 201 , appointment , message : "Appointment Reserved Successfully." , success : true });
});

export { router as reserveAppointment };