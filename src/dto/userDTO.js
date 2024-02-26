import { createHash } from "../utils.js";

export default class UserDTO{
    constructor(name, user_name, password, role){
        this.name = name;
        this.user_name = user_name;
        this.password = createHash(password);
        this.role = role;
    }
}