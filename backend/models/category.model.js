import { Schema } from "mongoose";

const catgorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    image: {
        type: String,
        default: ""
    },
    imagekitFileId: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

export default catgorySchema
