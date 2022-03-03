import mongoose from 'mongoose';
import { app } from './app';
import { natsWrapper } from './nats-wrapper';
import { UserCreatedListener } from './events/listeners/user-created-listener';
import { UserUpdatedListener } from './events/listeners/user-updated-listener';
import { UserDeletedListener } from './events/listeners/user-deleted-listener';

const start = async () =>
{
   const Environment = ['MONGO_URI' ,'NATS_CLUSTER_ID' , 'NATS_URL' , 'NATS_CLIENT_ID' , 'JWT_KEY'];
   Environment.forEach(el =>
   {
      if(!process.env[el])
      {
          throw new Error(`${el} Must Be Defined`)
      }
   });

   try
   {
        await natsWrapper.connect(process.env.NATS_CLUSTER_ID! , process.env.NATS_CLIENT_ID! , process.env.NATS_URL!);
        natsWrapper.client.on('close' , () =>
        {
            console.log('Nats Connection Closed!');
            process.exit();
        }); 

        process.on('SIGINT' , () => natsWrapper.client.close());
        process.on('SIGTERM' , () => natsWrapper.client.close());
        
        new UserCreatedListener(natsWrapper.client).listen();
        new UserUpdatedListener(natsWrapper.client).listen();
        new UserDeletedListener(natsWrapper.client).listen();
        
        await mongoose.connect(process.env.MONGO_URI! , { useNewUrlParser : true , useUnifiedTopology : true } as mongoose.ConnectOptions);
        mongoose.Promise = global.Promise;
        console.log('Connection to Mongodb Successfully!');
   }

   catch(e)
   {
       console.log(e);
   }

   const PORT = 3000 || process.env.PORT;
   app.listen(PORT , () => console.log(`Server Listening On Port ${PORT} From Appointment Service`));
}

start();