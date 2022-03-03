import express , { Request , Response } from 'express';
import { currentUser } from '@clinic-microservices14/common';

const router = express.Router();

router.get('/api/auth/current-user' , currentUser , (req : Request , res : Response) =>
{
    res.status(req.currentUser ? 200 : 400).send({ currentUser : req.currentUser || null });
});

export { router as currentUserRouter };