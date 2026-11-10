import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * A refresh session. We store only a SHA-256 hash of the opaque refresh token, so a
 * database leak does not hand out working sessions. `family` links rotated tokens so that
 * reuse of an already-rotated token (a strong theft signal) revokes the whole chain.
 */
@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ required: true, index: true })
  family: string;

  @Prop({ type: Date, default: null })
  rotatedAt: Date | null;

  @Prop({ type: String, maxlength: 256 })
  userAgent?: string;

  /** TTL index: MongoDB deletes expired sessions automatically. */
  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);
