import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, maxlength: 254 })
  email: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  name: string;

  /** argon2id hash. Never selected by default so it cannot leak through a careless query. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
