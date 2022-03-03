import express , { Request , Response } from 'express';
import jwt from 'jsonwebtoken';
import address from 'address';
import { BadRequestError, upload } from '@clinic-microservices14/common';
import { Password } from '../services/Password';
import { User } from '../models/user.model';

const router = express.Router();

router.post('/api/auth/signin' , upload.none() , async(req : Request , res : Response) =>
{
      const { email , password } = req.body;
      const existingUser = await User.findOne({ email });

      if(!existingUser)
      {
          throw new BadRequestError('Invalid credentials');
      }

      const passwordMatch = await Password.compare(existingUser.password , password);
      if(!passwordMatch)
      {
          throw new BadRequestError('Invalid credentials');
      }

      address.mac((err , addr) =>
      {
          if(err)
          {
              console.log(err);
          }

          else
          {
              existingUser.macAddress.map(el =>
              {
                  if(el.Mac !== addr)
                  {
                      return existingUser.macAddress.push({ Mac : addr });
                  }
              });
          }
      }); 

      // generate JWT and then store it on session object
      const userJwt = jwt.sign({ id : existingUser.id , email : existingUser.email } , process.env.JWT_KEY!);
      req.session   = { jwt : userJwt };

      res.status(200).send({ status : 200 , existingUser , success : true });
});

export { router as signinRouter };