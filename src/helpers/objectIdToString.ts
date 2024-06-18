import mongoose from "mongoose";

/**
 * Converts a Mongo ObjectId to a hexadecimal encoded string
 * @param objectId Mongo ObjectId
 * @returns hexadecimal encoded version of the objectId
 */
const objectIdToString = (objectId: mongoose.Types.ObjectId): string => objectId.toHexString();

export default objectIdToString;