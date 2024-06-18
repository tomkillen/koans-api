import mongoose from "mongoose";

/**
 * Converts a string to a Mongo ObjectId
 * @param strId a hexadecimal encoded ObjectId
 * @returns ObjectId
 */
const stringToObjectId = (strId: string): mongoose.Types.ObjectId => mongoose.Types.ObjectId.createFromHexString(strId);

export default stringToObjectId;