import mongoose from "mongoose";

const objectIdToString = (objectId: mongoose.Types.ObjectId): string => objectId.toString('base64');

export default objectIdToString;