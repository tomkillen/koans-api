import mongoose from "mongoose";

const stringToObjectId = (strId: string): mongoose.Types.ObjectId => mongoose.Types.ObjectId.createFromBase64(strId);

export default stringToObjectId;