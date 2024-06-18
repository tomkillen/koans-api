import mongoose from "mongoose";

/**
 * Converts a string to a Mongo ObjectId
 * @param strId a base64 encoded ObjectId
 * @returns ObjectId
 */
const stringToObjectId = (strId: string): mongoose.Types.ObjectId => mongoose.Types.ObjectId.createFromBase64(strId);

export default stringToObjectId;