import express , { Request , Response } from 'express';

const router = express.Router();

router.post('/api/auth/signOut' , (req : Request , res : Response) =>
{
    req.session = null;
    res.send({ status : 204 , message : "Successfully signOut" , success : true});
})

export { router as signOutRouter };