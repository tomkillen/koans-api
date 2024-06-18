import mongoose from "mongoose";

/**
 * Converts a Mongo ObjectId to a base64 encoded string
 * @param objectId Mongo ObjectId
 * @returns base64 encoded version of the objectId
 */
const objectIdToString = (objectId: mongoose.Types.ObjectId): string => objectId.toString('base64');

export default objectIdToString;