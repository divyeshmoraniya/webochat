import {z} from "zod";

export const UserValidate = z.object({
    clerkId : z.string(),
    userName : z.string(),
    Email : z.string().email(),
    profileImg : z.string().url()
})