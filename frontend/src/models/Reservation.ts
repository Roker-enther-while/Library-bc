import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReservation extends Document {
    user: mongoose.Types.ObjectId;
    book: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'picked_up' | 'expired';
    note: string;
    requestDate: Date;
    pickupDeadline?: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    processedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: {
        type: String,
        ref: 'Book',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'picked_up', 'expired'],
        default: 'pending'
    },
    note: { type: String, default: '' },
    requestDate: { type: Date, default: Date.now },
    pickupDeadline: { type: Date },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Reservation: Model<IReservation> = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', reservationSchema);
export default Reservation;
